import type { FC } from 'react';
import type { CircuitResult, CircuitStatus } from '../hooks/useMidnight';

type Props = {
  enabled: boolean;
  status: CircuitStatus;
  result: CircuitResult | null;
  error: string | null;
  isProving: boolean;
  contractAddress: string;
  onCall: () => void;
};

export const CircuitCall: FC<Props> = ({
  enabled,
  status,
  result,
  error,
  isProving,
  contractAddress,
  onCall,
}) => {
  return (
    <section className="panel circuit-panel" aria-labelledby="circuit-heading">
      <div className="panel-head">
        <h2 id="circuit-heading">Circuit call</h2>
        <span className="status-pill muted-pill">getCount · Preprod</span>
      </div>

      <p className="muted">
        Generates a zero-knowledge proof locally (via Lace proof server), then submits the
        transaction on-chain against your Level 1 contract.
      </p>

      <p className="contract-line">
        <span className="label">Contract</span>
        <code title={contractAddress}>{contractAddress.slice(0, 12)}…{contractAddress.slice(-10)}</code>
      </p>

      <button
        type="button"
        className="btn btn-primary"
        onClick={onCall}
        disabled={!enabled || isProving}
      >
        {status === 'proving'
          ? 'Generating proof…'
          : status === 'submitting'
            ? 'Submitting on-chain…'
            : 'Call getCount circuit'}
      </button>

      {isProving && (
        <div className="loading-block" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          <p>
            {status === 'proving'
              ? 'Proof generation in progress — private witness stays off-screen.'
              : 'Balancing and submitting transaction through Lace…'}
          </p>
        </div>
      )}

      <p className="privacy-label">Proved without revealing your input</p>

      {result && status === 'success' && (
        <div className="result-block" role="status">
          <h3>On-chain result</h3>
          <p>{result.message}</p>
          {result.count !== undefined && (
            <p>
              <span className="label">Public count</span> <strong>{result.count}</strong>
            </p>
          )}
          {result.txId && (
            <p>
              <span className="label">Tx</span> <code>{result.txId}</code>
            </p>
          )}
          {result.blockHeight !== undefined && (
            <p>
              <span className="label">Block</span> {String(result.blockHeight)}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
};
