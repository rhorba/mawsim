---
name: payments-engineer
description: Escrow (30%/70% split), deal payments, CMI adapter, farmer payout. Trigger on: "payment", "escrow", "deposit", "payout", "fee", "CMI", "refund", "dispute".
---
# Payments Engineer — Mawsim

## Escrow: 30% Deposit + 70% Delivery

```typescript
export function computeDealEscrow(
  totalAmount: Money,
  config = { buyerFeeRate: 0.025, farmerFeeRate: 0.015 }
): EscrowAmounts {
  const platformFeeFromBuyer  = Money.mul(totalAmount, config.buyerFeeRate)   // 2.5%
  const platformFeeFromFarmer = Money.mul(totalAmount, config.farmerFeeRate)  // 1.5%
  const farmerPayout          = Money.add(totalAmount, -platformFeeFromFarmer)
  const deposit               = Money.mul(totalAmount, 0.30)   // 30%
  const remainder             = Money.add(totalAmount, -deposit) // 70%
  const buyerTotalWithFee     = Money.add(totalAmount, platformFeeFromBuyer)
  return { totalAmount, deposit, remainder, platformFeeFromBuyer, platformFeeFromFarmer,
           farmerPayout, buyerTotalWithFee }
}
```

## State Machine
```
PENDING ──[buyer pays deposit via CMI]──────→ DEPOSIT_PAID (30%)
DEPOSIT_PAID ──[buyer pays remainder]────────→ FULLY_FUNDED (100%)
FULLY_FUNDED ──[delivery confirmed + review]─→ RELEASED (farmer payout)
DEPOSIT_PAID | FULLY_FUNDED ──[dispute]──────→ DISPUTED
DISPUTED ──[admin resolves]──────────────────→ RELEASED | REFUNDED
CONTRACT_SIGNED + no payment in 72h ─────────→ → CANCELLED (pg-boss sweep)
```

## Farmer Payout
Bank transfer (virement bancaire) to farmer's verified bank account.
Encrypted at rest. Farmer + admin access only.
Payout triggered after RELEASED state + 24h buffer (dispute window).

## Checklist
- [ ] No float currency; all via `Money`
- [ ] 30% + 70% splits sum to 100% (test)
- [ ] Farmer bank details encrypted; access audit-logged
- [ ] Every transition writes AuditLog in same tx
- [ ] Payment abandoned sweep: 72h no deposit → cancel deal

## Handoff Points
- **← Market Engine**: deal AGREED → trigger escrow creation
- **← DBA**: escrow table (bigint columns)
- **→ Frontend Dev**: escrow status banner, payment flow
- **→ Test Architect**: deposit edge cases, failed payout
