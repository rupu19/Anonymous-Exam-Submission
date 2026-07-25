/**
 * Send unshielded tNIGHT from the mn-demo CLI wallet to a Lace address.
 *
 * Usage:
 *   npx tsx src/send-tnight.ts --network preprod <recipient> [amount]
 *
 * Amount is in base units (default: 100_000_000 = 100 tNIGHT if 6 decimals).
 */
import { WebSocket } from 'ws';
import { MidnightBech32m, UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { resolveNetwork, getOrCreateSeed } from './network';
import { createWallet, persistWalletState, unshieldedToken } from './wallet';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

const args = process.argv
  .slice(2)
  .filter((a) => a !== '--network' && a !== 'preprod' && a !== 'preview' && a !== 'undeployed');
const { network, config: networkConfig } = resolveNetwork();
const SEED = getOrCreateSeed(network);

const recipientBech32 = args[0];
const amountArg = args[1];
const DEFAULT_AMOUNT = 100_000_000n; // 100 tNIGHT (6 decimals)
const amount = amountArg ? BigInt(amountArg.replace(/_/g, '')) : DEFAULT_AMOUNT;

if (!recipientBech32 || !recipientBech32.startsWith('mn_addr_')) {
  console.error('\nUsage: npx tsx src/send-tnight.ts --network preprod <mn_addr_...> [amount]\n');
  process.exit(1);
}

function parseUnshieldedAddress(bech32: string, networkId: string): UnshieldedAddress {
  const parsed = MidnightBech32m.parse(bech32);
  return parsed.decode(UnshieldedAddress, networkId);
}

async function main() {
  console.log(`\n─── Send tNIGHT (${network}) ───────────────────────────────────\n`);
  console.log(`  To:     ${recipientBech32}`);
  console.log(`  Amount: ${amount.toLocaleString()} base units\n`);

  const receiverAddress = parseUnshieldedAddress(recipientBech32, network);

  const walletCtx = await createWallet({ network, networkConfig, seed: SEED });
  console.log('  Syncing wallet...');
  const state = await walletCtx.wallet.waitForSyncedState();
  await persistWalletState(network, walletCtx);

  const from = walletCtx.unshieldedKeystore.getBech32Address().toString();
  const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;
  console.log(`  From:   ${from}`);
  console.log(`  Balance before: ${balance.toLocaleString()}\n`);

  if (balance < amount) {
    console.error(`  ❌ Insufficient balance (need ${amount}, have ${balance})\n`);
    await walletCtx.wallet.stop();
    process.exit(1);
  }

  const dust = state.dust.balance(new Date());
  if (dust === 0n) {
    console.log('  Waiting for / registering DUST for fees...');
    const unregistered = state.unshielded.availableCoins.filter(
      (c: { meta?: { registeredForDustGeneration?: boolean } }) => !c.meta?.registeredForDustGeneration,
    );
    if (unregistered.length > 0) {
      const recipe = await walletCtx.wallet.registerNightUtxosForDustGeneration(
        unregistered,
        walletCtx.unshieldedKeystore.getPublicKey(),
        (payload) => walletCtx.unshieldedKeystore.signData(payload),
      );
      const finalized = await walletCtx.wallet.finalizeRecipe(recipe);
      await walletCtx.wallet.submitTransaction(finalized);
    }
  }

  console.log('  Building transfer...');
  const recipe = await walletCtx.wallet.transferTransaction(
    [
      {
        type: 'unshielded',
        outputs: [
          {
            amount,
            receiverAddress,
            type: unshieldedToken().raw,
          },
        ],
      },
    ],
    {
      shieldedSecretKeys: walletCtx.shieldedSecretKeys,
      dustSecretKey: walletCtx.dustSecretKey,
    },
    { ttl: new Date(Date.now() + 30 * 60 * 1000) },
  );

  console.log('  Signing...');
  const signed = await walletCtx.wallet.signRecipe(recipe, (payload) =>
    walletCtx.unshieldedKeystore.signData(payload),
  );
  console.log('  Finalizing...');
  const finalized = await walletCtx.wallet.finalizeRecipe(signed);
  console.log('  Submitting...');
  const txId = await walletCtx.wallet.submitTransaction(finalized);

  console.log(`\n  ✅ Submitted!\n  Tx: ${txId}\n`);
  console.log('  Lace should show tNIGHT shortly; register NIGHT for DUST in Lace if tank is empty.\n');

  await persistWalletState(network, walletCtx);
  await walletCtx.wallet.stop();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
