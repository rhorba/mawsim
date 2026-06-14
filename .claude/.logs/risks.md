# risks
## RISK-000 — Farmer bank details exposure (standing, highest)
Every access audit-logged. Farmer + admin only. Encrypted at rest.

## RISK-001 — Price manipulation
Fake transactions to game price board. Outlier filter (3σ) + admin review for anomalous prices.

## RISK-002 — Deal bypass (delivery without confirmation)
Both-party independent delivery confirmation required. Escrow cannot release with only one party.

## RISK-003 — pgvector missing in CI
Must use pgvector/pgvector:pg16 image (not postgres:16-alpine) in GitHub Actions CI.
Listing this as a risk because it's a common mistake from the other 3 frameworks.
