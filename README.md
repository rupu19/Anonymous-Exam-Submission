# Anonymous Exam Submission
> Privacy-preserving exam counter dApp on Midnight — prove authorization without revealing your secret.

## Live Demo
https://anonymous-exam-submission.vercel.app

## Contract Address
| Network  | Address                                                            |
|----------|--------------------------------------------------------------------|
| Preprod  | `afcffcebb57c90948e51acfde87e30d970d39dda004aaed058ede9df121f505c` |

## What This Does
Anonymous Exam Submission is a privacy-first dApp on the Midnight Network. Institutions can track exam participation via a public on-chain counter, while students connect Lace wallet, generate a zero-knowledge proof in the browser, and call the Compact circuit — without ever putting their private secret key on the public ledger or on the UI.

## Privacy Model
- **What is PUBLIC:** The counter value (`count`), round, hashed owner commitment (`owner`), and the fact that an authorized circuit call occurred (tx id / block).
- **What is PRIVATE:** The student's `secretKey()` witness material and any non-disclosed circuit inputs (never rendered in the frontend).
- **What the user PROVES without revealing:** Knowledge of the secret corresponding to the on-chain owner commitment — authorization to update state — without disclosing the raw secret.

## Privacy Claim
An on-chain observer can see that a `getCount` / `increment` / `reset` call happened, the resulting public ledger fields, and transaction metadata. They **cannot** see the caller's raw `secretKey` witness or any private circuit input that was not wrapped in `disclose()`. The UI also never displays private inputs: only public results (e.g. count, tx id) appear after submission.

## Tech Stack
Midnight network, Compact, Midnight.js SDK, React / Vite, Lace wallet (`@midnight-ntwrk/dapp-connector-api`)

## Prerequisites
- Lace wallet installed ([Midnight Lace](https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk)) configured for **Preprod**
- Node.js v22
- (Optional for local proving) Docker proof server if Lace is pointed at `localhost:6300`

## Run Locally
```bash
git clone https://github.com/rupu19/Anonymous-Exam-Submission.git
cd Anonymous-Exam-Submission
npm install
npm run compile   # optional if managed/ artifacts already present
npm run dev       # http://localhost:5173
```

Run contract unit tests:
```bash
npm test
```

Deploy / interact via the Midnight CLI scaffold (`mn-demo`):
```bash
cd mn-demo
npm install
# Ensure Docker is running (proof server on :6300)
NODE_OPTIONS="--max-old-space-size=12288" npm run deploy:counter -- --network preprod
npm run network preprod
npm run cli
```

## Deploy frontend
Exact CLI commands (after `npm run build` succeeds):

**Vercel**
```bash
npm i -g vercel
vercel login
vercel --prod
```

**Netlify**
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

The live app reads `VITE_CONTRACT_ADDRESS` (defaults to the Preprod address above).

## Demo Video
[PLACEHOLDER — I will add the link after recording]

## Screenshots

### Successful Compilation Screenshot
![Successful Compilation](screenshots/compile-output.png)

### Successful Contract Deployed Screenshot
![Successful Contract Deployed](screenshots/deployed-contract-address.png)

## Project layout
```
├── contracts/counter.compact
├── managed/                  ← compact compile output (+ keys/zkir)
├── src/
│   ├── components/
│   │   ├── WalletConnect.tsx
│   │   └── CircuitCall.tsx
│   ├── hooks/
│   │   └── useMidnight.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── witnesses.ts
├── public/                   ← ZK artifacts copied at build time
├── tests/
├── .github/
├── vercel.json
├── netlify.toml
├── vite.config.ts
├── README.md
└── package.json
```

---

# Level 2 — The First Thread of Light

> You wire your contract to a real frontend and bring Lace onto Preprod. For the first time your work has a face the world can glimpse — a thin, deliberate crescent. Most of it still rests in shadow; you have simply chosen to reveal the edge.

**Mission this cycle:** Contract wired to a frontend UI, with Lace connected on Preprod.

## Who Can Join
Open to developers who have completed Level 1 or have equivalent experience, with a deployed Compact contract and readiness to learn the Midnight.js SDK and DApp connector.

## What You Will Learn
- Midnight.js SDK and the DApp connector API
- Connecting and disconnecting the Lace wallet
- Calling a circuit from the frontend and handling its result
- Managing local private state; deploying to Preprod

## Requirements to Pass
- Lace wallet connect / disconnect implemented
- Circuit called successfully from the frontend
- An observable privacy behavior (something proven without being shown)
- Contract deployed to Preprod with a verifiable address
- Minimum 8 meaningful commits

## Level 2 Submission

| Field | Value |
|-------|--------|
| **Public GitHub repository** | https://github.com/rupu19/Anonymous-Exam-Submission |
| **Live demo** | https://anonymous-exam-submission.vercel.app |
| **Preprod contract address** | `afcffcebb57c90948e51acfde87e30d970d39dda004aaed058ede9df121f505c` |
| **Demo video** | *[Add your YouTube link here — wallet connect + successful circuit call]* |
| **Privacy claim** | Documented above under **Privacy Claim** / **Privacy Model** |
| **Meaningful commits** | 21+ (exceeds the minimum of 8) |

### Submission Checklist
- [x] Public GitHub repository with README
- [x] Live demo link (Vercel)
- [x] Deployed Preprod contract address (verifiable on-chain)
- [ ] Demo video: wallet connect + a successful circuit call *(YouTube link TBD)*
- [x] README documenting the privacy claim
- [x] Minimum 8 meaningful commits

### Level 2 features in this repo
- **Lace connect / disconnect** — `src/components/WalletConnect.tsx` via `@midnight-ntwrk/dapp-connector-api`
- **Circuit calls from the frontend** — `getCount` / `increment` / `reset` in `src/components/CircuitCall.tsx` + `src/hooks/useMidnight.ts`
- **Observable privacy behavior** — authorization is proven with a ZK proof; the raw `secretKey` witness is never shown in the UI or put on the public ledger (see Privacy Claim)
- **Preprod deploy** — contract address above; frontend defaults to that address via `VITE_CONTRACT_ADDRESS` / `src/config.ts`
