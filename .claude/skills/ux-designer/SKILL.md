---
name: ux-designer
description: Farmer + buyer flows, mobile-first, price board wireframes. Trigger on: "user flow", "wireframe", "UX", "navigation".
---
# UX Designer — Mawsim

## Landing / Price Board (public)
```
┌────────────────────────────────────────────────────────────┐
│  mawsim.ma          [Se connecter]  [Vendre ma récolte]    │
│────────────────────────────────────────────────────────────│
│  Tableau des prix — blé dur · orge · maïs · olive · dattes │
│                                                            │
│  Produit        Région     Prix/qtx  Var 7j   Tendance     │
│  Blé dur        Gharb      350 MAD   +12%     📈           │
│  Blé dur        Meknès     345 MAD   +8%      📈           │
│  Orge           Chaouia    280 MAD   -3%      📉           │
│────────────────────────────────────────────────────────────│
│  De la terre à l'usine. Sans intermédiaires inutiles.      │
│  [Je suis producteur]          [Je cherche des produits]   │
└────────────────────────────────────────────────────────────┘
```

## Farmer Listing Flow
```
Dashboard → [Publier une offre] →
  Product category + variety → Quantity (qtx) → Quality grade →
  Price ask/qtx → Harvest date → Region → Photos (optional) →
  Preview → Publish → "Votre offre est en ligne ✓"
```

## Buyer RFQ Flow
```
Dashboard → [Lancer un appel d'offres] →
  Product → Qty range → Max price → Grade required → Region → Deadline →
  Submit → Top-5 matched listings surfaced → Contact/Bid
```

## Deal Flow (both sides see)
```
Offer received → Counter/Accept → Agreed → [Signer le contrat] (PDF) →
[Payer l'acompte 30%] → [Expédition confirmée] →
[Réception confirmée + qualité OK] → [Laisser un avis] → Paiement libéré ✓
```

## Handoff Points
- **→ UI Designer**: visual treatment
- **→ Frontend Dev**: screen specs
