import { describe, it, expect } from 'vitest';
import {
  CostModel,
  QueryContext,
  createConstructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  ledger,
  type Ledger,
} from '../managed/counter/contract/index.js';
import {
  createCounterPrivateState,
  witnesses,
  type CounterPrivateState,
} from '../src/witnesses.js';

class CounterSimulator {
  readonly contract: Contract<CounterPrivateState>;
  circuitContext: any;

  constructor(secretKey: Uint8Array) {
    this.contract = new Contract<CounterPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext(createCounterPrivateState(secretKey), '0'.repeat(64)),
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  getPrivateState(): CounterPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  switchUser(secretKey: Uint8Array) {
    this.circuitContext.currentPrivateState = createCounterPrivateState(secretKey);
  }

  async increment(amount: bigint): Promise<Ledger> {
    this.circuitContext = (
      await this.contract.impureCircuits.increment(this.circuitContext, amount)
    ).context;
    return this.getLedger();
  }

  async reset(): Promise<Ledger> {
    this.circuitContext = (
      await this.contract.impureCircuits.reset(this.circuitContext)
    ).context;
    return this.getLedger();
  }

  async getCount(): Promise<bigint> {
    return (
      await this.contract.impureCircuits.getCount(this.circuitContext)
    ).result;
  }
}

function randomSecret(): Uint8Array {
  const sk = new Uint8Array(32);
  crypto.getRandomValues(sk);
  return sk;
}

describe('Anonymous Exam Submission — counter contract', () => {
  describe('a) Circuit logic', () => {
    it('getCount returns the public ledger count after init', async () => {
      const sim = new CounterSimulator(randomSecret());
      expect(sim.getLedger().count).toBe(0n);
      expect(await sim.getCount()).toBe(0n);
    });
  });

  describe('b) State transitions', () => {
    it('increment then reset update public count as expected', async () => {
      const sim = new CounterSimulator(randomSecret());
      const afterInc = await sim.increment(5n);
      expect(afterInc.count).toBe(5n);
      expect(afterInc.round).toBeGreaterThan(0n);

      const afterSecond = await sim.increment(3n);
      expect(afterSecond.count).toBe(8n);

      const afterReset = await sim.reset();
      expect(afterReset.count).toBe(0n);
    });

    it('rejects increment from an unauthorized secret key', async () => {
      const ownerSk = randomSecret();
      const attackerSk = randomSecret();
      const sim = new CounterSimulator(ownerSk);

      sim.switchUser(attackerSk);
      await expect(sim.increment(1n)).rejects.toThrow(/unauthorized/i);
    });
  });

  describe('c) Privacy', () => {
    it('private secretKey is never exposed on the public ledger', async () => {
      const secretKey = randomSecret();
      const sim = new CounterSimulator(secretKey);

      await sim.increment(7n);
      const publicLedger = sim.getLedger();
      const privateState = sim.getPrivateState();

      // Secret stays only in private state
      expect(privateState.secretKey).toEqual(secretKey);

      // Ledger never stores the raw secret key
      expect(
        Buffer.from(publicLedger.owner).equals(Buffer.from(secretKey)),
      ).toBe(false);

      // Owner commitment is 32 bytes and distinct from the secret
      expect(publicLedger.owner).toHaveLength(32);
      expect(publicLedger.count).toBe(7n);

      // Public ledger JSON must not embed the raw secret bytes
      const ledgerSnapshot = JSON.stringify({
        count: publicLedger.count.toString(),
        round: publicLedger.round.toString(),
        owner: Array.from(publicLedger.owner),
      });
      expect(ledgerSnapshot).not.toContain(
        JSON.stringify(Array.from(secretKey)),
      );
    });
  });
});
