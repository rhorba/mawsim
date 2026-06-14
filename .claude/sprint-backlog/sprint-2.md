# Sprint 2 — Marketplace: Listings + Browse + RFQ

**Duration**: 1–2 sessions | **Depends on**: Sprint 1

## Must
- [ ] S2-01 — UX: listing browse + listing detail + post listing wireframes — **UX Designer**
- [ ] S2-02 — Backend: listing CRUD server actions (draft/publish/expire) + embedding trigger (pg-boss job on publish) — **Backend Dev** → Market Engine
- [ ] S2-03 — Frontend: public listing browse — SSR, filter by product/region/grade/price/certification (no auth required) — **Frontend Dev**
- [ ] S2-04 — Frontend: listing detail page (SSR, public) — farmer info, grade, quantity, certifications, price history in region — **Frontend Dev**
- [ ] S2-05 — Frontend: farmer post listing form (product, variety, qty, grade, price, photos, harvest date) — **Frontend Dev**
- [ ] S2-06 — Backend: RFQ CRUD (buyer posts demand) + pgvector match → top-5 listings — **Backend Dev** → Market Engine
- [ ] S2-07 — Market Engine: `matchListingsToRFQ()` pgvector query + re-ranking — **Market Engine**
- [ ] S2-08 — Frontend: buyer RFQ form + matched listings results — **Frontend Dev**
- [ ] S2-09 — Content Editor: FR/AR for listing fields, RFQ form, grade descriptions — **Content Editor**
- [ ] S2-10 — Tester: RFQ matching fixture tests, listing RBAC (only farmer posts), public SSR renders — **Tester**
- [ ] S2-11 — Sprint 2 snapshot → ask for Sprint 3

## DoD — Sprint 2
- [ ] Public listing browse works without auth (SSR/cached)
- [ ] Farmer posts listings; RFQ matching returns relevant results
- [ ] pgvector HNSW index created after seed
- [ ] FR + AR; `pnpm build`/`test`/`lint` green
