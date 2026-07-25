/** Preprod counter contract (redeployed — not the old hello-world address) */
export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ??
  'afcffcebb57c90948e51acfde87e30d970d39dda004aaed058ede9df121f505c';

export const NETWORK_ID = (import.meta.env.VITE_NETWORK_ID ?? 'preprod') as
  | 'preprod'
  | 'preview'
  | 'undeployed'
  | 'mainnet';

/** Browser dApps must use a local proof server — remote hosted ones block CORS. */
export const PROOF_SERVER_URI =
  import.meta.env.VITE_PROOF_SERVER_URI?.trim() || 'http://127.0.0.1:6300';

export const PRIVATE_STATE_ID = 'anonymousExamCounterPrivateState' as const;

export type CircuitKeys = 'increment' | 'getCount' | 'reset';
