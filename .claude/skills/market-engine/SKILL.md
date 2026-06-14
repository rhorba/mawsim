---
name: market-engine
description: RFQ matching (pgvector), deal state machine, contract PDF, offer/negotiation logic. Trigger on: "RFQ", "matching", "deal", "negotiation", "contract", "offer", "auction".
---
# Market Engine — Mawsim

## Role
Own `packages/marketplace`. The matching and deal engine is what separates Mawsim
from a classified ads site. An RFQ from an IAA processor in Casablanca looking for
50 tonnes of Blé dur grade A from Gharb should surface the 3 best-matched listings
automatically, rank them by quality grade + certifications + price, and notify those farmers.

## RFQ Matching (pgvector)

```typescript
// packages/marketplace/src/rfq-matching.ts
export async function matchListingsToRFQ(
  tx: DB,
  rfq: RFQ,
  limit = 10
): Promise<ScoredListing[]> {
  if (!rfq.requirementVector) return []

  // 1. pgvector ANN search
  const candidates = await tx.execute(sql`
    SELECT l.*, 1 - (l.product_vector <=> ${rfq.requirementVector}::vector) AS similarity
    FROM listings l
    WHERE l.status = 'active'
      AND l.product_category = ${rfq.productCategory}
      AND l.region = ${rfq.deliveryRegion}
      AND l.quantity_qtx >= ${rfq.quantityQtxMin}
      AND (${rfq.maxPricePerQtx} IS NULL OR l.ask_price_per_qtx <= ${rfq.maxPricePerQtx})
    ORDER BY l.product_vector <=> ${rfq.requirementVector}::vector
    LIMIT ${limit * 2}
  `)

  // 2. Re-rank: similarity (50%) + grade match (25%) + seller rating (15%) + price competitiveness (10%)
  return candidates
    .map(l => ({ ...l, score: computeMatchScore(l, rfq) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
```

## Deal State Machine

```
OFFER_MADE ──[buyer counter or accepts]──→ NEGOTIATING
NEGOTIATING ──[both agree on price]──────→ AGREED
AGREED ──[contract PDF generated]─────────→ CONTRACT_SIGNED
CONTRACT_SIGNED ──[buyer pays 30%]────────→ ESCROW_FUNDED (deposit)
ESCROW_FUNDED ──[goods dispatched]─────────→ IN_TRANSIT
IN_TRANSIT ──[buyer confirms receipt + quality OK]──→ DELIVERED
DELIVERED ──[both review]──────────────────→ COMPLETED (escrow released)
DELIVERED ──[quality dispute raised]───────→ DISPUTED
DISPUTED ──[admin resolves]────────────────→ COMPLETED | CANCELLED
AGREED | CONTRACT_SIGNED ──[either cancels]─→ CANCELLED
```

All transitions: AuditLog in same tx.

## Contract PDF Generation

```typescript
// packages/marketplace/src/contract.ts
// Using @react-pdf/renderer
// Template includes: parties (ICE/RC), product specs, quantity, price per quintal,
// total amount, payment terms (30% + 70%), delivery address + date, quality grade,
// dispute clause (admin mediation), signatures placeholder.
// Bilingual: FR on left column, AR on right column (RTL).
export async function generateContractPDF(deal: Deal, farmer: FarmerProfile, buyer: BuyerProfile): Promise<Buffer>
```

## Negotiation Rules
- Max 10 counter-offer rounds (then expires → deal abandoned)
- Each round: 24h to respond (then reminder, then deal expires)
- Price can only change by ±15% per round (prevents gaming)
- Once AGREED: price is locked; quantity can adjust ±5%

## Checklist
- [ ] pgvector matching returns relevant results for standard RFQ fixtures
- [ ] Deal cannot skip states
- [ ] Contract PDF: bilingual, all required fields
- [ ] Negotiation: max rounds enforced; expiry via pg-boss
- [ ] Match score shown to buyer (transparency)

## Handoff Points
- **← DBA**: pgvector columns on listings + RFQs
- **← Payments Engineer**: deal agreement → escrow creation
- **→ Frontend Dev**: deal UI, negotiation interface, contract download
- **→ Tester**: matching fixtures, state machine coverage
