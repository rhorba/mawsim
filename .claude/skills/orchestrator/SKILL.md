---
name: orchestrator
description: Apply Naql/.claude/skills/orchestrator patterns. Mawsim-specific notes below.
---
# Orchestrator — Mawsim

## Mawsim Context
- DB: pgvector/pgvector:pg16 in CI and Docker (listings + RFQs have vector columns)
- Auth: Auth.js v5 (email + Google OAuth) — 4 roles: farmer/buyer/logistics/admin
- Escrow: 30% deposit + 70% on delivery (2 separate payment events)
- Commission: 2.5% from buyer + 1.5% from farmer (transparent, fixed)
- Contract: bilingual PDF generated on deal AGREED state
- Price board: public SSR (no auth), cached, sources: mawsim_transaction + onicl
- Farmer bank details: encrypted at rest, farmer + admin only, access audit-logged
- Certification docs: private R2, signed URLs, admin + owner only
- Critical tests: deal state machine 100%, escrow 30%+70% sum, RFQ matching fixture, price outlier filter

## Sprint Snapshot (project-monitor only)
```
### [date] SPRINT_SNAPSHOT — Sprint N
- Tests: unit / E2E
- Deal state machine: PASS/FAIL
- Escrow 30+70 tests: PASS/FAIL
- Role isolation: PASS/FAIL
- DoD items: N/22
```
