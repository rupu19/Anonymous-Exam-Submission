# Product Proposal

## What is the product, and who uses it?
**Anonymous Exam Submission** is a privacy-preserving exam participation tracker for education. Institutions (universities, exam boards, online course platforms) need a public, auditable count of how many students submitted or participated — without learning *which* student did so, and without students posting identifying secrets on a transparent ledger.

**Primary users:**
- **Students** — connect Lace, prove they are authorized to participate, and update the on-chain counter without revealing their private secret.
- **Institutions / invigilators** — read the public counter and transaction metadata to confirm participation volume and that authorized circuit calls occurred.
- **Auditors** — verify that participation is real and countable on-chain, while private student credentials stay off the public ledger.

Today the product is a Compact counter dApp on Midnight Preprod: connect wallet → generate a ZK proof → call `getCount` / `increment` / `reset`, with only public results shown in the UI.

## Why Midnight specifically?
A transparent chain (e.g. a normal public L1) would typically expose the caller’s identity linkage, raw authorization material, or both — either as plaintext inputs, account history, or correlatable public keys. For exams, that breaks anonymity: “who submitted” becomes as visible as “how many submitted.”

**Midnight is a better fit because:**
- **Selective disclosure** — Compact lets us keep `secretKey` as a private witness and only `disclose()` what must be public (`count`, `round`, hashed `owner` commitment).
- **Prove without reveal** — students prove knowledge of the secret that matches the on-chain owner commitment without putting the raw secret on-chain or in the UI.
- **Public auditability without identity leak** — institutions still get a trustworthy participation counter and tx/block evidence, which a private database alone cannot provide as credibly.

On a transparent chain, building the same “authorized but anonymous participation” story is awkward: you either leak identity/credentials or you move authorization off-chain and lose verifiable public state.

## Data Model
| Data Point                         | Type            | Disclosed To                                      |
|------------------------------------|-----------------|---------------------------------------------------|
| `ledger.count` (participation tally) | Public ledger   | Everyone                                          |
| `ledger.round`                     | Public ledger   | Everyone                                          |
| `ledger.owner` (hash commitment)   | Public ledger   | Everyone (hash only — not the raw secret)         |
| Circuit call / tx id / block       | Public metadata | Everyone                                          |
| Student `secretKey()` witness      | Private witness | No one (local private state + ZK proof only)      |
| Non-disclosed circuit inputs       | Private         | No one (unless wrapped in `disclose()`)           |
| Proof of authorization             | ZK proof        | Network verifies; raw secret not revealed         |

## Mainnet Feasibility
**Yes — realistic for a Mainnet-ready MVP by Level 6**, if scope stays focused.

**Already in place for that path:**
- Compact contract deployed on Preprod
- Lace-connected frontend with circuit calls
- Tests (circuit / state / privacy) and CI
- Clear privacy claim and public contract address

**Still needed before Mainnet:**
- Harden product flows beyond a simple counter (e.g. per-exam instances, submission attestations, rate limits)
- Production ops: reliable proof-server path, key/artifact versioning, monitoring
- Security review of Compact auth + frontend private-state handling
- Mainnet wallet/network config, fees, and institutional onboarding docs

**Verdict:** Reaching Mainnet by Level 6 is feasible as a **narrow MVP** (anonymous authorized participation counter + polished dApp). Expanding into a full campus exam platform is a longer roadmap after Mainnet, not a Level 6 blocker.
