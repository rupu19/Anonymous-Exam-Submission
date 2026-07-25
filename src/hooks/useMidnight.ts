import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import '@midnight-ntwrk/dapp-connector-api';
import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import {
  Binding,
  Proof,
  SignatureEnabled,
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { MidnightProviders, UnboundTransaction } from '@midnight-ntwrk/midnight-js-types';
import * as CounterContract from '../../managed/counter/contract/index.js';
import { CONTRACT_ADDRESS, NETWORK_ID, PRIVATE_STATE_ID, PROOF_SERVER_URI, type CircuitKeys } from '../config';
import { inMemoryPrivateStateProvider } from '../in-memory-private-state-provider';
import { selectWallet } from '../selectWallet';
import {
  createCounterPrivateState,
  getOrCreateLocalSecret,
  witnesses,
  type CounterPrivateState,
} from '../witnesses';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected';
export type CircuitStatus = 'idle' | 'proving' | 'submitting' | 'success' | 'error';

export type CircuitResult = {
  txId?: string;
  blockHeight?: string | number;
  count?: string;
  message: string;
};

type CounterProviders = MidnightProviders<CircuitKeys, typeof PRIVATE_STATE_ID, CounterPrivateState>;

const DEFAULT_PROOF_SERVER_URI = PROOF_SERVER_URI;

function isLocalProofServer(uri: string): boolean {
  try {
    const { hostname } = new URL(uri);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

/** Prefer local prover — Lace may return a remote URI that browsers cannot call (CORS). */
function resolveProofServerUri(laceUri: string | undefined | null): string {
  const fromEnv = import.meta.env.VITE_PROOF_SERVER_URI?.trim();
  if (fromEnv) return fromEnv;
  const fromLace = laceUri?.trim();
  if (fromLace && isLocalProofServer(fromLace)) return fromLace;
  return DEFAULT_PROOF_SERVER_URI;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error) || 'Unknown error';
  } catch {
    return 'Unknown error';
  }
}

function friendlyError(error: unknown): string {
  const msg = errorMessage(error);
  const lower = msg.toLowerCase();

  if (
    lower.includes('no midnight') ||
    lower.includes('could not find midnight') ||
    lower.includes('extension installed')
  ) {
    return 'Lace wallet not installed or not detected. Install Midnight Lace and refresh.';
  }
  if (
    lower.includes('not authorized') ||
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('connection rejected')
  ) {
    return 'Connection rejected in Lace. Approve the request and try again.';
  }
  // Only treat real network-id mismatches — do not match every error that
  // merely mentions "preprod" (e.g. indexer URLs or proof-server hints).
  if (
    /network id mismatch|network mismatch|invalidnetworkid|expects ["']preprod["']/i.test(msg) ||
    /wallet is on ["'].+["'], dapp expects/i.test(msg)
  ) {
    return 'Network mismatch. Set Lace to Midnight Preprod and reconnect.';
  }
  if (
    lower.includes('proof server') ||
    lower.includes('prover') ||
    lower.includes('econnrefused') ||
    lower.includes('failed to fetch') ||
    lower.includes('cors') ||
    (lower.includes('prove') && lower.includes('error'))
  ) {
    return `Proof server unreachable from the browser. Keep Docker proof-server on ${DEFAULT_PROOF_SERVER_URI}, and in Lace set Proof server to Local (http://localhost:6300), then reconnect.`;
  }
  if (
    lower.includes('mismatched verifier') ||
    lower.includes('are undefined or have mismatched') ||
    lower.includes('contracttypeerror')
  ) {
    return 'Wrong contract at this address (verifier keys do not match the counter). Redeploy the counter with: cd mn-demo && npm run deploy:counter -- --network preprod';
  }
  if (lower.includes('tdust') || lower.includes('not enough dust') || lower.includes('insufficient funds')) {
    return 'Lace has no tDUST for fees. Fund NIGHT from the Preprod faucet and wait for DUST generation, then retry.';
  }
  return msg;
}

function asKeyString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'toString' in value) {
    return String((value as { toString: () => string }).toString());
  }
  return String(value);
}

function sameNetworkId(a: string | undefined | null, b: string): boolean {
  return !!a && a.toLowerCase() === b.toLowerCase();
}

async function buildProviders(connectedApi: ConnectedAPI): Promise<CounterProviders> {
  setNetworkId(NETWORK_ID);
  const config = await connectedApi.getConfiguration();

  if (config.networkId && !sameNetworkId(config.networkId, NETWORK_ID)) {
    throw new Error(
      `Network ID mismatch: wallet config is "${config.networkId}", dApp expects "${NETWORK_ID}".`,
    );
  }

  // Lace often returns the hosted Preprod prover, which browsers cannot call (CORS/403).
  // Use localhost:6300 unless Lace (or VITE_PROOF_SERVER_URI) points at a local server.
  const proofServerUri = resolveProofServerUri(config.proverServerUri);
  console.info('[providers] proof server:', proofServerUri);

  const shielded = await connectedApi.getShieldedAddresses();
  const zkConfigProvider = new FetchZkConfigProvider<CircuitKeys>(
    window.location.origin,
    fetch.bind(window),
  );

  // isomorphic-ws browser build only has a default export; Vite leaves ws.WebSocket
  // undefined. Pass the native constructor explicitly.
  const nativeWebSocket = globalThis.WebSocket;

  return {
    privateStateProvider: inMemoryPrivateStateProvider<typeof PRIVATE_STATE_ID, CounterPrivateState>(),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(proofServerUri, zkConfigProvider),
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
      nativeWebSocket as never,
    ),
    walletProvider: {
      getCoinPublicKey: () => asKeyString(shielded.shieldedCoinPublicKey) as never,
      getEncryptionPublicKey: () => asKeyString(shielded.shieldedEncryptionPublicKey) as never,
      balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
        const received = await connectedApi.balanceUnsealedTransaction(toHex(tx.serialize()));
        return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
          'signature',
          'proof',
          'binding',
          fromHex(received.tx),
        );
      },
    },
    midnightProvider: {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        await connectedApi.submitTransaction(toHex(tx.serialize()));
        return tx.identifiers()[0];
      },
    },
  };
}

function buildCompiledContract() {
  // ZK artifacts are served from /keys and /zkir (copied into public/ at build time).
  // withCompiledFileAssets is primarily for Node; browser uses FetchZkConfigProvider.
  return CompiledContract.make('counter', CounterContract.Contract).pipe(
    CompiledContract.withWitnesses(witnesses as never),
    CompiledContract.withCompiledFileAssets('/'),
  );
}

export function useMidnight() {
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('disconnected');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [circuitStatus, setCircuitStatus] = useState<CircuitStatus>('idle');
  const [circuitError, setCircuitError] = useState<string | null>(null);
  const [circuitResult, setCircuitResult] = useState<CircuitResult | null>(null);
  const [walletReady, setWalletReady] = useState(false);

  const connectedApiRef = useRef<ConnectedAPI | null>(null);
  const providersRef = useRef<CounterProviders | null>(null);

  useEffect(() => {
    const check = () => {
      try {
        selectWallet();
        setWalletReady(true);
      } catch {
        setWalletReady(false);
      }
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, []);

  const connect = useCallback(async () => {
    setWalletError(null);
    setWalletStatus('connecting');
    try {
      const wallet = selectWallet();
      const connectedApi = await wallet.connect(NETWORK_ID);
      const status = await connectedApi.getConnectionStatus();
      if (status.status !== 'connected') {
        throw new Error('Wallet reported disconnected after connect.');
      }
      if (status.networkId && !sameNetworkId(status.networkId, NETWORK_ID)) {
        throw new Error(
          `Network mismatch: wallet is on "${status.networkId}", dApp expects "${NETWORK_ID}".`,
        );
      }

      let address: string | null = null;
      try {
        const unshielded = await connectedApi.getUnshieldedAddress();
        address = unshielded.unshieldedAddress;
      } catch {
        const shielded = await connectedApi.getShieldedAddresses();
        address = shielded.shieldedAddress;
      }

      connectedApiRef.current = connectedApi;
      providersRef.current = await buildProviders(connectedApi);
      setWalletAddress(address);
      setWalletStatus('connected');
    } catch (error) {
      console.error('[connect]', error);
      connectedApiRef.current = null;
      providersRef.current = null;
      setWalletAddress(null);
      setWalletStatus('disconnected');
      setWalletError(friendlyError(error));
    }
  }, []);

  const disconnect = useCallback(() => {
    connectedApiRef.current = null;
    providersRef.current = null;
    setWalletAddress(null);
    setWalletStatus('disconnected');
    setWalletError(null);
    setCircuitStatus('idle');
    setCircuitResult(null);
    setCircuitError(null);
  }, []);

  /**
   * Calls the on-chain `getCount` circuit:
   * - private witness / amount never enter React state or the DOM
   * - proof is generated via Lace's configured proof server (local proving path)
   * - transaction is balanced + submitted through the wallet
   */
  const callCircuit = useCallback(async () => {
    if (!connectedApiRef.current) {
      setCircuitError('Connect Lace wallet first.');
      setCircuitStatus('error');
      return;
    }

    setCircuitError(null);
    setCircuitResult(null);
    setCircuitStatus('proving');

    try {
      const providers =
        providersRef.current ?? (await buildProviders(connectedApiRef.current));
      providersRef.current = providers;

      // Private inputs stay in memory only — never assigned to React state.
      const privateState = createCounterPrivateState(getOrCreateLocalSecret());
      const compiledContract = buildCompiledContract();

      const found = await findDeployedContract(providers, {
        compiledContract: compiledContract as never,
        contractAddress: CONTRACT_ADDRESS,
        privateStateId: PRIVATE_STATE_ID,
        initialPrivateState: privateState,
      });

      setCircuitStatus('submitting');
      const txData = await found.callTx.getCount();

      const publicData = txData.public as {
        txId?: string;
        txHash?: string;
        blockHeight?: string | number;
        result?: bigint;
      };

      const countValue =
        publicData.result !== undefined ? publicData.result.toString() : undefined;

      setCircuitResult({
        txId: publicData.txId ?? publicData.txHash,
        blockHeight: publicData.blockHeight,
        count: countValue,
        message: 'Circuit proved and submitted on Preprod.',
      });
      setCircuitStatus('success');
    } catch (error) {
      console.error('[callCircuit]', error);
      // Drop cached providers so the next attempt rebuilds with fresh Lace config.
      providersRef.current = null;
      setCircuitStatus('error');
      setCircuitError(friendlyError(error));
    }
  }, []);

  return {
    networkId: NETWORK_ID,
    contractAddress: CONTRACT_ADDRESS,
    walletReady,
    walletStatus,
    walletAddress,
    walletError,
    connect,
    disconnect,
    circuitStatus,
    circuitError,
    circuitResult,
    callCircuit,
    isProving: circuitStatus === 'proving' || circuitStatus === 'submitting',
  };
}
