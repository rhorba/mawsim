# Mawsim — موسم

**De la terre à l'usine. Sans intermédiaires inutiles.**
_From farm to factory. Without unnecessary middlemen._

Mawsim is Morocco's first B2B agri-food marketplace — connecting 1.4 million farmers
directly to processors, cooperatives and exporters through transparent pricing,
secure escrow, and AI-powered matching.

Built on HCP Budget Économique Prévisionnel 2026 data.

---

## The Problem We Solve

- **1.4 million** Moroccan agricultural exploitations (Ministère Agriculture)
- **90 million quintaux** of cereals expected in 2025/2026 — yet Morocco imports **27 billion MAD** of cereals
- Agri-food industry growing at **+3.5% in 2026** (HCP) — but can't access reliable local supply
- Typical intermediary margin: **15–30% per layer**, 3–4 layers between farmer and processor
- Result: farmers earn ~10,700 MAD/year average while processors pay premium prices

Mawsim eliminates 2–3 intermediary layers. Farmers earn 20–40% more. Processors pay less. Morocco imports less.

---

## Quick Start

```bash
git clone https://github.com/your-org/mawsim.git && cd mawsim
cp .env.example .env
pnpm install
docker compose up -d postgres   # uses pgvector/pgvector:pg16 — REQUIRED
pnpm db:migrate
pnpm db:seed
pnpm dev   # http://localhost:3000
```

| Role | Email | Password |
|---|---|---|
| Farmer | mehdi.fellah@demo.mawsim.ma | demo1234 |
| Buyer (IAA) | atlas.food@demo.mawsim.ma | demo1234 |
| Admin | admin@mawsim.ma | demo1234 |

**⚠️ Note**: Use `pgvector/pgvector:pg16` (not `postgres:16-alpine`) everywhere — both Docker and CI.

---

## Architecture

```
mawsim/
├── apps/web/
│   ├── (public)/       Price board + listing browse (SSR, no auth)
│   ├── (farmer)/       Farmer dashboard
│   ├── (buyer)/        Buyer dashboard
│   ├── (logistics)/    Logistics provider dashboard
│   └── (admin)/        Admin dashboard
└── packages/
    ├── core/           Money, RBAC, Zod schemas
    ├── db/             Drizzle + RLS + pgvector
    ├── marketplace/    Listings, RFQ matching, deal state machine, contract PDF
    ├── pricing/        Price board aggregation + ONICL reference
    ├── logistics/      Request/quote/match state machine
    ├── payments/       Escrow (30%/70%) + CMI adapter
    ├── verification/   Certification document workflow
    └── notifications/  In-app + Resend email
```

---

## What makes Mawsim different from the other 3 frameworks

| | Mahara | Riaya | Kasb | **Mawsim** |
|---|---|---|---|---|
| Market | Skills/jobs | Childcare | Fintech | **Agri-food B2B** |
| Deal complexity | Simple gig | Booking session | Credit application | **Multi-step deal + contract** |
| Escrow | Simple | Simple | None | **30% + 70% split** |
| AI matching | pgvector skills | pgvector care types | None (SQL) | **pgvector product varieties** |
| Unique package | matching-engine | booking-engine | credit-engine + pwa | **market-engine + logistics** |
| Public data | No | No | Prices (locked) | **Price board (fully public)** |
| Contract | None | None | None | **Bilingual PDF generation** |

---

## Commission Structure

| Party | Fee |
|---|---|
| Buyer | 2.5% of deal value |
| Farmer/Seller | 1.5% of deal value |
| **Total** | **4%** (vs 15–30% per intermediary layer) |

---

v0.1 — Built with Claude Code · Powered by HCP BEP 2026 + Ministère Agriculture data
