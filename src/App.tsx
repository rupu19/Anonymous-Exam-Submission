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
      </footer>
    </div>
  );
}
