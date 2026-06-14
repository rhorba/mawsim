# Mawsim — موسم — Claude Code Project Bible

> This is the root business document. All specialists read this first.
> `.claude/CLAUDE.md` governs HOW the team works.
>
> **Mawsim** (موسم — "harvest season") is Morocco's first B2B agri-food marketplace —
> connecting 1.4 million small farmers directly to processors, cooperatives, and exporters,
> eliminating the costly intermediary chain that traps farmers in poverty while Morocco
> imports 27 billion MAD of food it could grow.

---

## §1 — The Problem (grounded in HCP 2025/2026 data)

Morocco's agricultural sector is structurally disconnected:

- **1.4 million agricultural exploitations** generating +15 billion MAD revenue — but
  average farm revenue is just ~10,700 MAD/year
- **90 million quintaux** of cereal expected in 2025/2026 — but Morocco still imports
  **27 billion MAD** of cereals annually (29% of food import bill — Office des Changes)
- **Agri-food industry growing at +3.5% in 2026** (HCP) — but can't find reliable
  local raw material supply chains
- **+55% date production in 2025/2026** — but most goes through 3–4 intermediary layers
  before reaching processors, each taking 15–30% margin
- Agricultural value added at **+4.7% in 2025** — the sector is growing but the value
  doesn't reach farmers
- **70% of cultivated surfaces** are cereals — mono-culture risk, price volatility

**The structural gap**: There is no price transparency, no direct farmer-to-processor
connection, no collective purchasing for inputs. A wheat farmer in Meknès-Tafilalet
sells at whatever the local middleman offers — with zero market intelligence.

**Mawsim's thesis**: Eliminate 2–3 intermediary layers via a digital marketplace.
Farmers get 20–40% more per quintal. Processors get reliable supply at better prices.
Morocco reduces its import dependency. Everyone wins except the rent-seeking middlemen.

---

## §2 — Project Identity

**Name**: Mawsim
**Domain**: mawsim.ma
**Tagline (FR)**: "De la terre à l'usine. Sans intermédiaires inutiles."
**Tagline (AR)**: "من الأرض إلى المصنع. بدون وسطاء غير ضروريين."
**Type**: B2B two-sided marketplace (Farmers + Buyers) with logistics coordination.
**Audience**:
  - **Farmers / Fellahs (producers)**: Small-to-medium agricultural operators
    (1–50 hectares), cooperatives (coopératives agricoles), regional groupings (GIE).
    Products: wheat/barley/corn, olives, dates, citrus, vegetables, argan.
  - **Buyers (industrial/commercial)**: Agri-food processors (IAA), cooperatives,
    exporters (exportateurs), large distributors, hotel/restaurant chains (CHR).
  - **Logistics providers**: Cold chain operators, truck owners, warehouses.
  - **Platform admin**: Internal — quality verification, dispute resolution, KPIs.
**Language**: French primary (`fr`), Arabic (`ar`), Amazigh/Tamazight stub (`ber`).
**Tone**: Professional, practical, farmer-respectful. No startup jargon. The farmer
  has been exploited for decades — Mawsim must feel like an ally, not another tech extracting value.

### Positioning
> "Morocco produces enough. The problem is the chain between field and factory.
> Mawsim is that chain — transparent, efficient, and fair."

---

## §3 — Core Features (v0.1 scope)

### Module A — Farmer Profiles & Listings
- Registration: farm name, owner name, region, GPS coordinates (optional), farm size (ha)
- Products grown: category + variety + annual production capacity (quintaux/tonnes)
- Certifications: organic, GlobalGAP, Label Maroc, fair trade (uploaded docs)
- Current harvest listing: **what is available NOW**, quantity, quality grade, price ask
- Availability calendar: expected harvest date per product (seasonal planning)
- History: completed transactions + ratings from buyers

### Module B — Buyer Profiles
- Company name, sector (IAA/exporter/distributor/CHR), ICE, region
- Procurement needs: standing demand by product + volume + quality requirements
- Verification: professional existence (RC/ICE verified)
- Bid history + ratings from farmers

### Module C — Marketplace (Heart of Platform)
- **Browse listings**: filter by product, region, quantity, quality grade, price range, certifications
- **Post demand (RFQ)**: buyer posts a Request for Quotation → farmers respond
- **Direct offer**: farmer posts listing → buyers browse and bid or buy now
- **Price transparency**: market reference price per product per region (computed from recent transactions)
- **Auction mode**: farmer sets reserve price, buyers bid over X hours (for premium lots)
- **Negotiation**: counter-offer system (farmer ↔ buyer direct negotiation)
- **Contract generation**: auto-generated bilingual (FR/AR) purchase contract once agreed

### Module D — Market Price Intelligence
- **Price board (Tableau des prix)**: real-time average transaction prices per product + region
  — sourced from completed Mawsim transactions + ONICL (Office National Interprofessionnel des Céréales et Légumineuses) public data
- **Price history charts**: 12-month trend per product
- **Price alerts**: farmer sets "notify me when blé dur in Meknès reaches X MAD/quintal"
- **Harvest forecast integration**: expected production volumes by region (from Ministère de l'Agriculture public data)
- This module alone has massive standalone value — even farmers not transacting on Mawsim
  will use it, building the network effect

### Module E — Logistics Coordination
- **Logistics request**: once a deal closes → auto-generate transport request
  (origin, destination, product, tonnage, required truck type, urgency)
- **Logistics provider network**: verified truck owners / transporters can register
  and receive logistics requests (future: cold chain operators, entrepôts frigorifiques)
- **Quote & match**: logistics providers respond with price + availability
- **Tracking** (v0.2): GPS-based shipment tracking

### Module F — Payments & Escrow
- Deal value deposited in escrow by buyer on contract signature
- Released to farmer on delivery confirmation (+ quality check acceptance)
- Platform commission: 2.5% from buyer + 1.5% from farmer (total 4% — below current middleman margin)
- Partial payment: deposit (30%) on signature, remainder on delivery
- Moroccan-compliant invoice generated per transaction (ICE, TVA)
- Dispute: quality dispute → escrow held → admin + optional third-party quality inspector

### Module G — Quality & Verification
- **Product quality grading**: standardized grades per product (blé dur grade 1/2/3, olive grade A/B/C)
- **Lot documentation**: humidity %, protein content, weight certificate (optional photo)
- **Certification verification**: admin verifies organic/GlobalGAP certificates
- **Buyer verification**: RC/ICE existence check (DGI mock in dev, real in prod)
- **Transaction rating**: both parties rate quality, accuracy, communication

### Module H — Admin Dashboard
- Transaction monitoring (GMV, active deals, dispute queue)
- Price board management (add ONICL reference prices manually)
- Quality verification queue
- Dispute resolution
- Partner/logistics provider management
- KPIs: farmers connected, tonnes traded, import substitution estimate

### Cross-cutting (v0.1, non-negotiable)
- **Auth + RBAC** (farmer / buyer / logistics / admin)
- **Bilingual FR/AR with RTL**
- **Moroccan payment rails** (CMI/CashPlus + bank transfer for large deals)
- **Offline-friendly**: listings and price board viewable without login; deal management
  works on 3G (agri areas have limited connectivity)
- Audit log on all financial mutations

---

## §4 — Out of Scope (v0.1)

| Deferred | Feature |
|---|---|
| **v0.2** | Mobile app (React Native) — web-first for v0.1 |
| **v0.2** | GPS shipment tracking |
| **v0.2** | Collective input purchasing (fertilizers, seeds as a group) |
| **v0.2** | Satellite crop monitoring integration (NDVI) |
| **v0.2** | Financing / agricultural credit (Crédit Agricole du Maroc integration) |
| **v0.2** | Direct DGI/ICE API verification for buyers |
| **v0.2** | Amazigh (Tamazight) full translation |
| **v0.3** | Export facilitation (customs documents, certifications) |
| **v0.3** | B2C farmer shops (consumer-facing) |
| **out** | Consumer food delivery, restaurant ordering, retail grocery |

---

## §5 — Tech Stack (FINAL)

| Concern | Choice | Why |
|---|---|---|
| Web | Next.js 15 App Router, TypeScript strict | SSR for price board SEO |
| Styling | Tailwind v4 + shadcn/ui | |
| DB | PostgreSQL 16 + Drizzle ORM + RLS + pgvector | pgvector for product matching/similarity |
| Auth | Auth.js v5 (email+password + Google OAuth) | B2B buyers use email; farmers too |
| Money | Integer centimes (MAD) via `Money` type | Never floats |
| Pricing engine | `packages/pricing` — transaction aggregates + ONICL reference | Statistical, no external ML |
| Marketplace matching | pgvector (product embeddings for RFQ matching) | Match RFQs to relevant listings |
| Escrow | DB state machine in `packages/payments` | Same pattern as Naql/Riaya |
| Logistics | `packages/logistics` — request/quote/match | Similar to booking engine |
| Contract | PDF generation in `packages/marketplace` | FR/AR bilingual contract |
| Jobs | pg-boss (price alerts, auction close, escrow sweep, logistics sweep) | |
| Email | Resend | |
| Storage | Cloudflare R2 (product photos, certificates, contracts — private + public) | |
| i18n | next-intl (fr/ar), RTL mandatory | |
| Testing | Vitest + Playwright | |
| Container | Docker Compose (postgres + web + worker + caddy) | |
| PM | pnpm workspaces | |
| Linting | Biome | |
| CI | GitHub Actions (pgvector/pgvector:pg16) | |

---

## §6 — Data Model (core entities)

```typescript
// packages/core/src/types.ts

type Money = number  // integer centimes (MAD). NEVER a float.

type Role = 'farmer' | 'buyer' | 'logistics' | 'admin'

type ProductCategory =
  | 'cereals'    // blé, orge, maïs
  | 'olives'     // olive, huile d'olive
  | 'dates'
  | 'citrus'     // oranges, clémentines
  | 'vegetables' // tomates, poivrons...
  | 'argan'
  | 'legumes'    // lentilles, pois chiches
  | 'other'

type QualityGrade = 'premium' | 'grade_a' | 'grade_b' | 'standard'

type ListingStatus = 'draft' | 'active' | 'negotiating' | 'sold' | 'expired' | 'cancelled'

type DealStatus =
  | 'offer_made'
  | 'negotiating'
  | 'agreed'            // both parties confirmed price + terms
  | 'contract_signed'   // contract PDF generated + signed
  | 'escrow_funded'     // buyer payment in escrow
  | 'in_transit'        // goods being transported
  | 'delivered'         // farmer confirms dispatch; buyer confirms receipt
  | 'completed'         // reviews done; escrow released
  | 'disputed'          // quality/quantity dispute
  | 'cancelled'

type User = {
  id: string; email: string; name: string; role: Role
  phone?: string; region?: string; city?: string
  isActive: boolean; emailVerified: boolean; createdAt: Date
}

type FarmerProfile = {
  id: string; userId: string
  farmName: string
  region: string; commune?: string
  farmSizeHa?: number
  products: string[]          // categories grown
  certifications: FarmerCertification[]
  bankDetails?: BankDetails   // for payout (encrypted)
  avgRating: number; reviewCount: number; completedDeals: number
  createdAt: Date; updatedAt: Date
}

type FarmerCertification = {
  id: string; farmerId: string
  type: 'organic' | 'global_gap' | 'label_maroc' | 'fair_trade' | 'other'
  issuedBy: string; validUntil: Date
  documentKey: string         // R2 private key
  verified: boolean; adminNote?: string
}

type BuyerProfile = {
  id: string; userId: string
  companyName: string; ice?: string; rc?: string
  sector: 'processor' | 'exporter' | 'distributor' | 'chr' | 'cooperative' | 'other'
  city: string
  verifiedBusiness: boolean
  avgRating: number; reviewCount: number; completedDeals: number
  createdAt: Date
}

type Listing = {
  id: string; farmerId: string
  productCategory: ProductCategory
  productVariety?: string        // "Blé dur Karim", "Olive Picholine"
  quantityQtx: number            // quintaux available
  qualityGrade: QualityGrade
  askPricePerQtx: Money          // farmer's asking price per quintal
  minOrderQtx: number
  harvestDate?: Date
  availableUntil: Date
  region: string
  description?: string
  photoKeys: string[]            // R2 public (product photos)
  certifications: string[]       // certification IDs attached
  status: ListingStatus
  viewCount: number
  productVector?: number[]       // pgvector for RFQ matching
  createdAt: Date; updatedAt: Date
}

type RFQ = {                     // Request for Quotation from buyer
  id: string; buyerId: string
  productCategory: ProductCategory
  productVariety?: string
  quantityQtxMin: number; quantityQtxMax: number
  maxPricePerQtx?: Money
  requiredQualityGrade: QualityGrade
  requiredCertifications: string[]
  deliveryRegion: string
  neededBy: Date
  description?: string
  status: 'open' | 'matched' | 'closed'
  matchedListingIds: string[]    // pgvector-matched listings
  createdAt: Date
}

type Deal = {
  id: string
  listingId?: string; rfqId?: string    // origin
  farmerId: string; buyerId: string
  productCategory: ProductCategory
  productVariety?: string
  quantityQtx: number
  agreedPricePerQtx: Money
  totalAmount: Money              // quantityQtx * agreedPricePerQtx
  deliveryRegion: string
  deliveryDate: Date
  status: DealStatus
  contractKey?: string            // R2 key for signed PDF
  logisticsRequestId?: string
  notes?: string
  createdAt: Date; updatedAt: Date
}

type Escrow = {
  id: string; dealId: string
  buyerId: string; farmerId: string
  grossAmount: Money
  deposit: Money                  // 30% paid upfront
  remainder: Money                // 70% on delivery
  platformFeeFromBuyer: Money     // 2.5%
  platformFeeFromFarmer: Money    // 1.5%
  farmerPayout: Money
  status: 'pending' | 'deposit_paid' | 'fully_funded' | 'released' | 'refunded' | 'disputed'
  depositPaidAt?: Date; fullyFundedAt?: Date
  releasedAt?: Date
  createdAt: Date
}

type PricePoint = {              // market price intelligence
  id: string
  productCategory: ProductCategory
  productVariety?: string
  region: string
  pricePerQtx: Money             // transaction price OR ONICL reference
  source: 'mawsim_transaction' | 'onicl' | 'admin_manual'
  recordedAt: Date
}

type LogisticsRequest = {
  id: string; dealId: string
  originRegion: string; destinationRegion: string
  productCategory: ProductCategory
  weightTonnes: number
  truckType: 'standard' | 'refrigerated' | 'bulk'
  pickupDate: Date
  urgent: boolean
  status: 'open' | 'quoted' | 'assigned' | 'in_transit' | 'delivered'
  assignedProviderId?: string
  agreedPrice?: Money
  createdAt: Date
}

type Review = {
  id: string; dealId: string
  reviewerId: string; revieweeId: string
  rating: number  // 1-5
  comment?: string
  reviewerRole: 'farmer' | 'buyer'
  createdAt: Date
}

type AuditLog = {
  id: string; actorUserId: string
  entity: string; entityId: string
  action: 'create' | 'update' | 'bid' | 'agree' | 'fund' | 'release' | 'dispute'
  before?: unknown; after?: unknown; at: Date
}
```

---

## §7 — Roles & Permissions

| Capability | farmer | buyer | logistics | admin |
|---|---|---|---|---|
| Post listing | ✅ | — | — | ✅ |
| Post RFQ | — | ✅ | — | ✅ |
| Browse listings (public) | ✅ | ✅ | read | ✅ |
| Make offer / negotiate | ✅↔️ | ✅↔️ | — | ✅ |
| Sign contract + fund escrow | — | ✅ | — | ✅ |
| Confirm delivery | ✅ | ✅ | ✅ | ✅ |
| View price board (public) | ✅ | ✅ | ✅ | ✅ |
| Set price alert | ✅ | ✅ | — | ✅ |
| Register as logistics provider | — | — | ✅ | — |
| View logistics requests | — | — | ✅ | ✅ |
| Submit logistics quote | — | — | ✅ | — |
| Upload certification docs | ✅ | — | — | — |
| Verify certifications | — | — | — | ✅ |
| Resolve disputes | — | — | — | ✅ |
| View platform GMV / KPIs | — | — | — | ✅ |

---

## §8 — Seed / Demo Data

- 6 farmer profiles (wheat/Meknès, olives/Marrakech, dates/Errachidia, citrus/Souss, vegetables/Agadir, argan/Essaouira)
- 4 buyer profiles (IAA processor/Casablanca, exporter/Tanger, cooperative/Meknès, CHR chain/Rabat)
- 12 listings (mix of active/negotiating/sold)
- 4 RFQs from buyers
- 6 deals (2 completed with reviews + escrow released, 2 in_transit, 2 negotiating)
- Price board: 6 months of price history for top 5 products
- 2 logistics providers
- Demo farmer: mehdi.fellah@demo.mawsim.ma / demo1234 (wheat farmer, Meknès)
- Demo buyer: atlas.food@demo.mawsim.ma / demo1234 (IAA processor, Casablanca)

---

## §9 — Design Identity

- **Aesthetic**: Earthy, premium, modern agri-tech. Warm ochre + deep olive green + natural linen.
  Inspired by Moroccan agricultural landscapes — the Atlas, the Souss valley, the Gharb plains.
- **Colors**: Ochre/warm gold primary (#C8873A) — wheat, earth, harvest.
  Deep olive secondary (#3D5A3E) — fields, growth, life.
  Cream surfaces, warm gray data tables.
- **Typography**: "Playfair Display" for headings (editorial gravitas, premium market feel).
  "Inter" for data/tables (precise, readable). "Noto Kufi Arabic" for AR.
- **Data-forward**: price charts, transaction volumes, grade badges are visual heroes.
- **Trust signals**: verification badges, rating stars, completed deal counters on all profiles.
- **Maps**: region-based search (Gharb, Souss-Massa, Meknès...) with visual map interface.

---

## §10 — UX Principles

1. **Price transparency is the hook**: price board is public, no login required → farmers come for prices, stay for deals
2. **Farmer dignity**: farmers are called "Producteurs" not "vendeurs". Their profiles show farm photos, certifications — they are professionals
3. **Mobile-first for farmers**: Moroccan farmers use Android phones in the field; the app must work on 3G
4. **Deal certainty**: every step of the deal (offer → negotiation → contract → payment → delivery) is visible and auditable
5. **Regional search**: Moroccan geography is how farmers think — by region and product
6. **No buyer identity until deal intent**: price board and listings are public; contact/company info unlocks at deal stage
7. **RTL equal**: Arabic-speaking farmers are the majority of the target base
8. **Seasonal cadence**: UI adapts to current agricultural season (céréales campaign, olive harvest, etc.)

---

## §11 — Legal & Financial Integrity

1. **CNDP (Law 09-08)**: bank details of farmers encrypted at rest; role-gated; access audit-logged
2. **Escrow safety**: 30% deposit on contract signature, 70% on delivery confirmation. State machine strict. No shortcuts.
3. **Contract compliance**: auto-generated purchase contracts include: parties (ICE/RC), product specs, quantity, price, delivery terms, payment terms, dispute clause. Bilingual FR/AR.
4. **Platform is not a financial institution**: Mawsim processes payments but does not hold money beyond deal completion. Escrow funds held in dedicated account.
5. **Price board data**: transaction prices are aggregated + anonymized (no individual transaction prices visible to third parties). ONICL reference prices properly attributed.
6. **Certification documents**: private R2 bucket; served via signed URLs; admin + document owner only.
7. **No price manipulation**: platform commission is fixed (4% total); no bid rigging; auction rules enforced by code.

---

## §12 — Definition of Done (v0.1 — 22 items)

- [ ] Auth: signup/login for farmer + buyer + logistics + admin; email verification
- [ ] Farmer profile: create, edit, products, farm size, region, certifications
- [ ] Buyer profile: create, edit, company, ICE, sector
- [ ] Listing: create, edit, publish, manage (farmer side) — product, quantity, grade, price, photos
- [ ] Listing browse: public, filterable (product/region/grade/price), SSR+SEO
- [ ] RFQ: buyer posts demand → pgvector-matched listings surfaced
- [ ] Offer & negotiation: counter-offer system (farmer ↔ buyer)
- [ ] Deal agreement: both parties confirm → contract PDF generated (FR/AR bilingual)
- [ ] Escrow: deposit (30%) on contract sign, remainder (70%) on delivery confirmation
- [ ] Delivery confirmation: both parties confirm → reviews → escrow released
- [ ] Price board: public market reference prices per product + region + 12-month chart
- [ ] Price alerts: user sets threshold → pg-boss notifies when hit
- [ ] Logistics request: auto-generated on deal close → logistics providers quote
- [ ] Quality verification: admin reviews certification docs
- [ ] Reviews: mutual post-deal; feed rating on profiles
- [ ] Notifications: in-app for all key events (bid, counteroffer, deal agreed, payment, delivery)
- [ ] Email: deal confirmation, payment received, delivery reminder (Resend)
- [ ] Admin dashboard: GMV, active deals, dispute queue, price board management
- [ ] Money integer centimes; all financial mutations audited
- [ ] French + Arabic + RTL complete
- [ ] `pnpm build` 0 TS errors; `pnpm test` green; `pnpm lint` clean; demo seed loads
- [ ] Deploy: Vercel + managed Postgres (pgvector enabled) OR `docker compose up -d`

---

## §13 — Sprint Roadmap

| Sprint | Goal |
|---|---|
| **Sprint 0** | Scaffold + Auth + RBAC + RLS + pgvector setup |
| **Sprint 1** | Data model + Farmer & Buyer profiles + demo seed |
| **Sprint 2** | Marketplace: listings (post + browse public SSR) + RFQ |
| **Sprint 3** | Offer/negotiation engine + contract PDF generation |
| **Sprint 4** | Payments & Escrow (deposit + delivery + release) |
| **Sprint 5** | Price board + alerts + logistics coordination |
| **Sprint 6** | Quality verification + reviews + notifications + email |
| **Sprint 7** | Admin dashboard + i18n FR/AR + RTL + security + deploy → v0.1 ship |

---

## §14 — Repository Structure

```
mawsim/
├── CLAUDE.md
├── .claude/
├── apps/
│   └── web/
│       └── src/app/
│           ├── [locale]/(public)/     ← Price board + listing browse (SSR, no auth)
│           ├── [locale]/(farmer)/     ← Farmer dashboard
│           ├── [locale]/(buyer)/      ← Buyer dashboard
│           ├── [locale]/(logistics)/  ← Logistics provider dashboard
│           └── [locale]/(admin)/      ← Admin dashboard
└── packages/
    ├── core/          ← Money, Role, RBAC, Zod schemas
    ├── db/            ← Drizzle schema, migrations, RLS, pgvector, seed
    ├── marketplace/   ← Listing logic, RFQ matching, deal state machine, contract PDF
    ├── pricing/       ← Price board aggregation, ONICL reference, alert engine
    ├── logistics/     ← Logistics request/quote/match state machine
    ├── payments/      ← Escrow state machine (30%/70% split), CMI adapter
    ├── verification/  ← Certification document workflow
    └── notifications/ ← In-app + Resend email
```

---

## §15 — Auth & Access Model

- **Auth.js v5**: email+password (Argon2id) + Google OAuth
- Session: `{ userId, role }` — role server-side only
- Four roles: farmer / buyer / logistics / admin
- `withRole(session, allowedRoles, handler)` factory
- Certification documents: private R2; signed URLs; admin + document owner only
- Bank details: encrypted at rest; farmer + admin only
- Price board data: public (no auth required)
- Admin provisioned via seed or direct DB only
