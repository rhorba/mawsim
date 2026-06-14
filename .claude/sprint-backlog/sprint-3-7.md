# Sprint 3 — Offer/Negotiation + Contract PDF

**Duration**: 1–2 sessions | **Depends on**: Sprint 2

## Must
- [ ] S3-01 — Market Engine: deal state machine implementation (offer → negotiation → agreed → contract_signed) — **Market Engine**
- [ ] S3-02 — Backend: make offer / counter-offer / accept offer server actions — **Backend Dev**
- [ ] S3-03 — Market Engine: bilingual contract PDF generation (@react-pdf/renderer, FR/AR columns) — **Market Engine**
- [ ] S3-04 — Backend: contract stored in private R2; signed URL for download — **Backend Dev** → Security
- [ ] S3-05 — Frontend: negotiation interface (offer history + counter button + accept/decline) — **Frontend Dev**
- [ ] S3-06 — Frontend: deal timeline (step tracker from offer to completion) — **Frontend Dev**
- [ ] S3-07 — pg-boss: negotiation expiry job (24h per round, max 10 rounds) — **Backend Dev**
- [ ] S3-08 — Tester: deal state machine 100% coverage, contract PDF correct fields, negotiation expiry — **Tester**
- [ ] S3-09 — Sprint 3 snapshot → ask for Sprint 4

---

# Sprint 4 — Payments & Escrow (30% + 70%)

**Duration**: 2 sessions | **Depends on**: Sprint 3

## Must
- [ ] S4-01 — Payments: `computeDealEscrow()` (30%/70% + fees) + escrow state machine — **Payments Engineer**
- [ ] S4-02 — Payments: `PaymentGateway` interface + `DevGateway` (mock) — **Payments Engineer**
- [ ] S4-03 — Backend: deposit payment (30%) on contract signature → escrow DEPOSIT_PAID — **Backend Dev**
- [ ] S4-04 — Backend: remainder payment (70%) on delivery → escrow FULLY_FUNDED — **Backend Dev**
- [ ] S4-05 — Backend: delivery confirmation (both parties) → escrow RELEASED → farmer payout — **Backend Dev**
- [ ] S4-06 — Backend: dispute mechanism + admin resolution — **Backend Dev**
- [ ] S4-07 — pg-boss: escrow abandonment sweep (72h no deposit → cancel deal) — **Backend Dev**
- [ ] S4-08 — Frontend: deal payment UI (deposit button → summary → confirmation) — **Frontend Dev**
- [ ] S4-09 — Frontend: delivery confirmation (farmer + buyer both confirm) — **Frontend Dev**
- [ ] S4-10 — Content Editor: FR/AR for payment steps, escrow states, fees disclosure — **Content Editor**
- [ ] S4-11 — Tester: 30+70=100% test, double-payout impossible, both-party delivery requirement — **Tester**
- [ ] S4-12 — Test Architect: adversarial escrow — bypass delivery confirmation, deposit without contract — **Test Architect**
- [ ] S4-13 — Sprint 4 snapshot → ask for Sprint 5

---

# Sprint 5 — Price Board + Alerts + Logistics

**Duration**: 1–2 sessions | **Depends on**: Sprint 4

## Must
- [ ] S5-01 — packages/pricing: `aggregatePricePoints()` — median per (product, region, week) from mawsim transactions + ONICL manual data — **Backend Dev**
- [ ] S5-02 — Frontend: public price board (SSR, table with sparklines, region filter, source attribution) — **Frontend Dev**
- [ ] S5-03 — Frontend: 12-month price history chart per product + region — **Frontend Dev**
- [ ] S5-04 — Backend: price alert CRUD + `price.alerts` pg-boss sweep (nightly, notify if threshold hit) — **Backend Dev**
- [ ] S5-05 — Logistics Engineer: `generateLogisticsRequest()` auto on deal state → IN_TRANSIT — **Logistics Engineer**
- [ ] S5-06 — Backend: logistics provider quote submission + selection + state machine — **Backend Dev**
- [ ] S5-07 — Frontend: logistics request UI (provider sees open requests + submits quote) — **Frontend Dev**
- [ ] S5-08 — Tester: price aggregation math, alert threshold, logistics state machine — **Tester**
- [ ] S5-09 — Sprint 5 snapshot → ask for Sprint 6

---

# Sprint 6 — Quality Verification + Reviews + Notifications + Email

**Duration**: 1–2 sessions | **Depends on**: Sprint 5

## Must
- [ ] S6-01 — Verification Engineer (apply Riaya patterns): cert doc upload (private R2, consent, audit) — **Backend Dev** → Security
- [ ] S6-02 — Frontend: farmer certification upload + verification status badges on profile — **Frontend Dev**
- [ ] S6-03 — Backend: mutual review actions (post-deal only) + update profile ratings — **Backend Dev**
- [ ] S6-04 — Frontend: post-deal review prompt — **Frontend Dev**
- [ ] S6-05 — Backend: in-app notifications (bid received, counteroffer, deal agreed, payment, delivery) — **Backend Dev**
- [ ] S6-06 — Backend: Resend email (deal confirmation, payment received, delivery reminder) — **Backend Dev**
- [ ] S6-07 — Content Editor: complete fr.json + ar.json — zero gaps — **Content Editor**
- [ ] S6-08 — Tester: cert doc 403 for buyer; review RBAC; notification delivery — **Tester**
- [ ] S6-09 — Sprint 6 snapshot → ask for Sprint 7

---

# Sprint 7 — Admin Dashboard + i18n + RTL + Security + Deploy → v0.1 SHIP

**Duration**: 1–2 sessions | **Depends on**: Sprint 6

## Must
- [ ] S7-01 — Frontend: admin dashboard — GMV, active deals, dispute queue, price board management, KPIs — **Frontend Dev**
- [ ] S7-02 — Frontend: admin cert verification queue + dispute resolution — **Frontend Dev**
- [ ] S7-03 — Security: adversarial tests — bank details isolation, cert doc 403, role isolation, deal bypass — **Security Engineer**
- [ ] S7-04 — Security: price manipulation filter — outlier detection on price_points — **Security Engineer**
- [ ] S7-05 — Security: auth hardening — rate-limit, Google OAuth redirect, CSP — **Security Engineer**
- [ ] S7-06 — Frontend: RTL audit + i18n audit (zero hardcoded strings) — **Frontend Dev**
- [ ] S7-07 — Frontend: a11y — focus states, labels, contrast — **Frontend Dev**
- [ ] S7-08 — Tech Lead: performance — price board SSR cached, listing images via R2 CDN — **Tech Lead**
- [ ] S7-09 — DevOps: deploy path A (Vercel + Neon/Supabase pgvector) + B (docker compose) — **DevOps**
- [ ] S7-10 — Deployment: verify both paths; price board public; role isolation in prod — **Deployment**
- [ ] S7-11 — Tester: full regression + deal state machine + escrow + pgvector matching E2E — **Tester**
- [ ] S7-12 — README + .env.example complete — **Project Manager**
- [ ] S7-13 — Final DoD: all 22 items ✅ — **Project Monitor** → v0.1 SHIPPED

## DoD — Sprint 7 (= v0.1 SHIPPED)
- [ ] Price board: public, SSR, no auth, outlier-filtered
- [ ] Deal state machine: 100% transition coverage tested; no skip possible
- [ ] Escrow: 30%+70%=100% tested; no bypass of both-party delivery confirmation
- [ ] Farmer bank details: encrypted, farmer+admin only, access audited
- [ ] Certification docs: private R2, signed URLs, access audited
- [ ] Role isolation adversarial tests green
- [ ] Contract PDF: bilingual, all fields, hash stored
- [ ] Deploys: managed cloud AND `docker compose up -d` (pgvector)
- [ ] `pnpm build` 0 errors; `pnpm test` green; `pnpm lint` clean; gitleaks passes
