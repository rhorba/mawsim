---
name: security-engineer
description: Auth, RBAC, bank details PII, cert docs, price manipulation prevention. Trigger on: "security", "auth", "PII", "bank", "RBAC", "cert", "manipulation".
---
# Security Engineer — Mawsim

## Threat Surface
| Component | Threat | Mitigation |
|---|---|---|
| **Farmer bank details** | Leaked to buyer or public | Encrypted at rest; farmer + admin only; access audit-logged |
| **Certification docs** | Unauthorized access | Private R2; signed URLs (15-min); admin + doc owner only; access audited |
| **Price manipulation** | Fake transactions to inflate price board | Transaction prices validated before inclusion; outlier detection; admin review for anomalous prices |
| **Bid manipulation** | Buyer posts fake listings to suppress prices | Listing verification: farm profile required; first listing admin-reviewed |
| Role isolation | Buyer reads another buyer's RFQs | RLS: buyer sees only own RFQs; listings are public |
| Escrow bypass | Deal marked delivered without actual delivery | Both parties must confirm independently; 24h dispute window |
| Contract tampering | Modified PDF after signing | Contract hash stored at generation time; verification on download |

## Pre-Deploy Checklist (Sprint 7)
- [ ] Farmer bank details encrypted at rest; farmer + admin only; access audit-logged
- [ ] Certification docs: private R2; every URL generation audited
- [ ] Price board: outlier filter (transactions > 3σ from median excluded or flagged)
- [ ] RLS: buyer sees own RFQs; farmer sees own listings; logistics sees own requests
- [ ] Both-party delivery confirmation enforced before escrow release
- [ ] Contract hash stored and verified
- [ ] Argon2id; login rate-limit; Google OAuth redirect locked
- [ ] Secrets in `.env`; gitleaks passes
- [ ] CSP + security headers

## Handoff Points
- **→ DBA**: RLS policies
- **→ Payments Engineer**: escrow integrity
- **→ Market Engine**: price anomaly detection
- **→ Tester / Test Architect**: role isolation + escrow bypass tests
