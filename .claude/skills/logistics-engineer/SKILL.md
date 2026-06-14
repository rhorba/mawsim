---
name: logistics-engineer
description: Logistics request/quote/match state machine. Trigger on: "logistics", "transport", "camion", "livraison", "cold chain", "tracking".
---
# Logistics Engineer — Mawsim

## Role
Own `packages/logistics`. When a deal closes, a logistics request is auto-generated.
Logistics providers receive the request, submit quotes, buyer+farmer pick one.
Simple in v0.1 — no GPS tracking yet.

## Logistics State Machine
```
OPEN ──[providers submit quotes]──→ QUOTED
QUOTED ──[deal parties select provider]──→ ASSIGNED
ASSIGNED ──[provider confirms pickup]──→ IN_TRANSIT
IN_TRANSIT ──[provider confirms delivery]──→ DELIVERED
DELIVERED ──[ties to deal DELIVERED state]
OPEN + 48h no quotes ──→ notify admin (logistics gap in region)
```

## Request Auto-Generation
```typescript
// Triggered on deal state → IN_TRANSIT
export function generateLogisticsRequest(deal: Deal): LogisticsRequest {
  return {
    dealId: deal.id,
    originRegion: deal.farmerRegion,
    destinationRegion: deal.deliveryRegion,
    productCategory: deal.productCategory,
    weightTonnes: deal.quantityQtx / 10,   // 1 quintal = 100kg = 0.1 tonne
    truckType: requiresRefrigeration(deal.productCategory) ? 'refrigerated' : 'standard',
    pickupDate: deal.deliveryDate,
    urgent: isSoonPickup(deal.deliveryDate),
    status: 'open'
  }
}
```

## Pricing Context
Logistics providers set their own rates. Mawsim does NOT take commission on logistics in v0.1.
This removes a barrier to logistics provider adoption.

## Handoff Points
- **← Market Engine**: deal close → auto-create logistics request
- **→ Frontend Dev**: logistics request UI for logistics providers + deal parties
- **→ Tester**: state machine, auto-generation math
