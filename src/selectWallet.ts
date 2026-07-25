import type { InitialAPI } from '@midnight-ntwrk/dapp-connector-api';
import semver from 'semver';

const COMPATIBLE_CONNECTOR_API_VERSION = '4.x';

export const listWallets = (): InitialAPI[] => {
  const injected = window.midnight;
  if (!injected) return [];
  return Object.values(injected).filter(
    (wallet): wallet is InitialAPI =>
      !!wallet &&
      typeof wallet === 'object' &&
      'apiVersion' in wallet &&
      typeof wallet.apiVersion === 'string' &&
      semver.satisfies(wallet.apiVersion, COMPATIBLE_CONNECTOR_API_VERSION),
  );
};

export const selectWallet = (): InitialAPI => {
  const wallets = listWallets();
  if (wallets.length === 0) {
    throw new Error(
      'No Midnight Lace wallet found. Install the Lace Midnight extension, unlock it, and refresh this page.',
    );
  }
  return wallets[0];
};
