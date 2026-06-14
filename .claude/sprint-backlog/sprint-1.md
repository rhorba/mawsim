# Sprint 1 — Data Model + Profiles + Demo Seed

**Duration**: 1–2 sessions | **Depends on**: Sprint 0

## Must
- [ ] S1-01 — DBA: full schema — `farmer_profiles`, `farmer_certifications`, `buyer_profiles`, `listings` (with product_vector pgvector column), `rfqs` (with requirement_vector), `deals`, `escrows`, `price_points`, `logistics_requests`, `reviews`, `notifications`, `audit_logs`, `access_audit_logs` — all with RLS — **DBA** → Security
- [ ] S1-02 — DBA: pgvector columns + HNSW index placeholder (created post-seed) — **DBA** → Market Engine
- [ ] S1-03 — Security: review RLS — farmer bank details strictest (farmer + admin); cert docs private R2 only — **Security**
- [ ] S1-04 — Backend: farmer profile CRUD + certification upload (private R2 + consent) — **Backend Dev**
- [ ] S1-05 — Backend: buyer profile CRUD + business verification stub — **Backend Dev**
- [ ] S1-06 — Frontend: farmer profile create/edit (farm size, region, products, photos) — **Frontend Dev**
- [ ] S1-07 — Frontend: buyer profile create/edit (company, ICE, sector) — **Frontend Dev**
- [ ] S1-08 — DBA + Backend: demo seed (6 farmers, 4 buyers, 2 logistics, 12 listings, 4 RFQs, 6 deals, 6mo price history) — **DBA**
- [ ] S1-09 — Content Editor: FR/AR for profile fields, product categories, regions, grade labels — **Content Editor**
- [ ] S1-10 — Tester: role isolation on all new tables; bank details 403 for buyer; cert docs 403 — **Tester**
- [ ] S1-11 — Sprint 1 snapshot → ask for Sprint 2

## DoD — Sprint 1
- [ ] All tables with RLS; cert docs + bank details strictest policies
- [ ] Farmer + buyer profiles create/edit/view; demo seed loads
- [ ] pgvector columns exist (data populated in seed)
- [ ] FR + AR; `pnpm build`/`test`/`lint` green
