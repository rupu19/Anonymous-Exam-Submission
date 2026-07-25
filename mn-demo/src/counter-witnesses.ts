/**
 * Deploy-time witnesses for the counter — kept inside mn-demo so Node resolves
 * a single copy of @midnight-ntwrk/* (avoids ContractMaintenanceAuthority instanceof failures).
 */
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from '../contracts/managed/counter/contract/index.js';

export type CounterPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createCounterPrivateState = (
  secretKey: Uint8Array,
): CounterPrivateState => ({ secretKey });

export const witnesses = {
  secretKey: ({
    privateState,
  }: WitnessContext<Ledger, CounterPrivateState>): [
    CounterPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secretKey],
};
