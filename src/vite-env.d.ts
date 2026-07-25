/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NETWORK_ID: string;
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_PROOF_SERVER_URI?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  midnight?: Record<string, import('@midnight-ntwrk/dapp-connector-api').InitialAPI>;
}
