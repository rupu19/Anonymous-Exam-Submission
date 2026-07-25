/**
 * Private witness helpers for the Compact counter.
 * secretKey material is NEVER rendered in the UI.
 */
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from '../managed/counter/contract/index.js';

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

const SECRET_STORAGE_KEY = 'aes-midnight-secret-v1';

/** Load or create a local secret for circuit witnesses. Never expose in UI. */
export function getOrCreateLocalSecret(): Uint8Array {
  try {
    const stored = localStorage.getItem(SECRET_STORAGE_KEY);
    if (stored) {
      return Uint8Array.from(atob(stored), (c) => c.charCodeAt(0));
    }
  } catch {
    // ignore storage errors — fall through to generate
  }
  const secret = crypto.getRandomValues(new Uint8Array(32));
  try {
    localStorage.setItem(
      SECRET_STORAGE_KEY,
      btoa(String.fromCharCode(...secret)),
    );
  } catch {
    // private state still works for this session
  }
  return secret;
}
