---
name: tech-lead
description: Architecture, ADRs, stack. Trigger on: "architecture", "ADR", "tech stack".
---
# Tech Lead — Mawsim

## Stack (FINAL)
| Concern | Choice |
|---|---|
| Web | Next.js 15, TypeScript strict |
| DB | PostgreSQL 16 + Drizzle + RLS + **pgvector** (use pgvector/pgvector:pg16 in CI) |
| Auth | Auth.js v5 (email + Argon2id + Google OAuth) |
| Money | Integer centimes, `Money` type |
| RFQ matching | pgvector cosine similarity on product embeddings |
| Deal state machine | `packages/marketplace` |
| Escrow (30%/70%) | `packages/payments` |
| Logistics state machine | `packages/logistics` |
| Pricing | `packages/pricing` — SQL aggregates + ONICL manual data |
| Contract PDF | `@react-pdf/renderer` in `packages/marketplace` |
| Jobs | pg-boss (price alerts, auction close, escrow sweeps, logistics sweep) |
| Email | Resend |
| Storage | R2 private (certs, contracts, bank details encrypted) + R2 public (farm photos) |
| i18n | next-intl (fr/ar), RTL mandatory |

## Key ADRs

### ADR-01: pgvector for RFQ matching
RFQ has product category + variety + requirements. Listings have product data.
Embed both as 384-dim vectors. Match = cosine similarity. Much better than string matching
for "Blé dur Karim" matching "Blé dur grade A Gharb".

### ADR-02: Escrow is 30% + 70% split
Agricultural deals have delivery risk. Full escrow upfront would deter farmers (long lock-up).
30% deposit secures commitment; 70% on delivery protects buyer.
Tracks as two separate payment events in the state machine.

### ADR-03: Price board is public SSR, no auth required
Price transparency is the core acquisition hook. Farmers and buyers come for prices.
SSR + caching means price board loads fast even on 3G. No login friction at top of funnel.

### ADR-04: Contract PDF is server-generated bilingual FR/AR
@react-pdf/renderer generates the contract on deal agreement.
Stored in private R2. Both parties get a download link (signed URL).
This gives legal validity and differentiates from informal spot markets.

### ADR-05: Listings and RFQs have both vector and structured search
Browse = structured filters (product, region, grade, price range).
RFQ matching = pgvector similarity to surface relevant listings automatically.
Both are needed: farmers search manually, buyers want auto-matching.

## Data Flow
```
Public visitor → Price board (SSR/cached) → Sign up → Post listing / RFQ
Buyer posts RFQ → pgvector matches top-5 listings → notifications sent to farmers
Farmer makes offer / buyer bids → negotiation rounds → both agree → contract generated
Buyer funds 30% deposit → escrow DEPOSIT_PAID → goods in transit
Delivery confirmed by both → buyer pays 70% → escrow RELEASED → farmer paid
pg-boss sweeps: price alerts, auction close, escrow overdue, logistics orphans
```
