# Anonymous Exam Submission
A robust and secure portal designed for anonymous exam submission and verification, powered by a privacy-preserving smart contract on the Midnight Network.

## Initial Idea
The Anonymous Exam Submission platform is a privacy-first smart contract built on the Midnight network. It allows institutions to record exam-related actions on-chain while empowering students to prove authorization and participation without exposing sensitive, underlying private data on a public ledger. By using Midnight's zero-knowledge proofs, the platform ensures that verification is cryptographically secure and tamper-proof.

## Privacy Model (Public vs Private State)
**What is PUBLIC (on-chain, visible to anyone):** The public counter value (`count`), the round used for owner commitments (`round`), the hashed owner commitment (`owner`), and the fact that an authorized increment/reset occurred.

**What is PRIVATE (private witness, never on-chain):** The student's `secretKey()` witness material, and any circuit inputs that are not intentionally wrapped in `disclose()`.

**What the user PROVES without revealing:** The student proves they know the secret corresponding to the on-chain owner commitment (authorization to update state) without publicly disclosing the raw secret on the public ledger.

## Deployed Contract Address
| Network  | Address                                                            |
|----------|--------------------------------------------------------------------|
| Preview  | — (Preview faucet unavailable during setup)                        |
| Preprod  | `5b18df35c759f1231b531137700cc03f52f50d1d017d8ad3efe1057bbb436509` |

## Setup Instructions (How to run locally)
Clone the repository:
```bash
git clone https://github.com/rupu19/Anonymous-Exam-Submission.git
cd Anonymous-Exam-Submission
```

Install dependencies and compile the Compact contract:
```bash
npm install
npm run compile
```

Run the test suite:
```bash
npm test
```

Deploy / interact via the Midnight scaffold (`mn-demo`):
```bash
cd mn-demo
npm install
# Ensure Docker is running (proof server on :6300)
NODE_OPTIONS="--max-old-space-size=12288" npm run deploy -- --network preprod
# Fund the printed wallet at: https://midnight-tmnight-preprod.nethermind.dev/
npm run network preprod
npm run cli
```

## Screenshots

### Successful Compilation Screenshot
![Successful Compilation](screenshots/compile-output.png)

### Successful Contract Deployed Screenshot
![Successful Contract Deployed](screenshots/deployed-contract-address.png)

## Technologies Used
- Midnight network (Compact language) for smart contracts
- Node.js v22 & Docker for local proof server and deployment
- TypeScript + Vitest for contract unit tests
- `@midnight-ntwrk/compact-runtime` for Compact JS execution

## Project layout
```
├── contracts/counter.compact
├── managed/                  ← compact compile output
├── src/witnesses.ts
├── tests/counter.test.ts
├── screenshots/
│   ├── compile-output.png
│   ├── deployed-contract-address.png
│   └── preprod-faucet-funded.png
├── mn-demo/                  ← create-mn-app hello-world scaffold
├── README.md
└── package.json
```
