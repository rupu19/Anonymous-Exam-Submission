import type { FC } from 'react';
import type { WalletStatus } from '../hooks/useMidnight';

type Props = {
  status: WalletStatus;
  address: string | null;
  error: string | null;
  walletReady: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

function shorten(address: string): string {
  if (address.length <= 20) return address;
  return `${address.slice(0, 10)}…${address.slice(-8)}`;
}

export const WalletConnect: FC<Props> = ({
  status,
  address,
  error,
  walletReady,
  onConnect,
  onDisconnect,
}) => {
  const connected = status === 'connected' && !!address;

  return (
    <section className="panel wallet-panel" aria-labelledby="wallet-heading">
      <div className="panel-head">
        <h2 id="wallet-heading">Lace wallet</h2>
        <span className={`status-pill ${connected ? 'on' : 'off'}`}>
          {connected ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Disconnected'}
        </span>
      </div>

      {!walletReady && status === 'disconnected' && (
        <p className="hint">
          Midnight Lace extension not detected. Install it, unlock the wallet, then refresh.
        </p>
      )}

      {connected ? (
        <div className="wallet-connected">
          <p className="label">Connected address</p>
          <p className="address" title={address ?? undefined}>
            {shorten(address!)}
          </p>
          <button type="button" className="btn btn-ghost" onClick={onDisconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <div className="wallet-disconnected">
          <p className="muted">Connect Lace on Midnight Preprod to call the exam counter circuit.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConnect}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? 'Connecting…' : 'Connect Lace wallet'}
          </button>
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
