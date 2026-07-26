import { CircuitCall } from './components/CircuitCall';
import { WalletConnect } from './components/WalletConnect';
import { useMidnight } from './hooks/useMidnight';

export default function App() {
  const midnight = useMidnight();

  return (
    <div className="app-shell">
      <header className="hero">
        <p className="brand">Anonymous Exam Submission</p>
        <h1>Prove participation without exposing your secret.</h1>
        <p className="lede">
          Midnight Preprod dApp — connect Lace, call the counter circuit, keep private
          witness material off the public ledger and off this screen.
        </p>
      </header>

      <aside className="privacy-banner" aria-labelledby="privacy-heading">
        <h2 id="privacy-heading">Privacy behavior</h2>
        <ul>
          <li>
            <strong>Public:</strong> counter value, round, owner commitment hash, tx metadata
          </li>
          <li>
            <strong>Private:</strong> your <code>secretKey</code> witness — never shown here or
            stored raw on-chain
          </li>
          <li>
            <strong>Proved without revealing:</strong> you know the secret matching the on-chain
            owner commitment
          </li>
        </ul>
      </aside>

      <main className="layout">
        <WalletConnect
          status={midnight.walletStatus}
          address={midnight.walletAddress}
          error={midnight.walletError}
          walletReady={midnight.walletReady}
          onConnect={midnight.connect}
          onDisconnect={midnight.disconnect}
        />
        <CircuitCall
          enabled={midnight.walletStatus === 'connected'}
          status={midnight.circuitStatus}
          result={midnight.circuitResult}
          error={midnight.circuitError}
          isProving={midnight.isProving}
          contractAddress={midnight.contractAddress}
          onCall={midnight.callCircuit}
        />
      </main>

      <footer className="footer">
        <p>
          Network: <strong>{midnight.networkId}</strong>
        </p>
        <p className="footer-note">
          Only public results appear after a circuit call. Private inputs stay in the proof,
          not in this UI.
        </p>
      </footer>
    </div>
  );
}
