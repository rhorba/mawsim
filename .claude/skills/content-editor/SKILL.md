---
name: content-editor
description: FR/AR bilingual content for Mawsim. Agricultural terminology. Trigger on: "translation", "i18n", "fr.json", "ar.json", "copy".
---
# Content Editor — Mawsim

## Voice
- **For farmers**: Respectful, peer-to-peer. "Producteur" not "vendeur". "Votre récolte" not "votre stock".
- **For buyers**: Business-efficient. "Approvisionnement direct" — saves time and money.
- **Agricultural vocabulary**: use correct Moroccan agri-terms (qtx not "unités", "campagne", "lot", "grade")

## Key strings (fr.json excerpt)
```json
{
  "nav": { "priceBoard": "Tableau des prix", "listings": "Offres producteurs",
    "postListing": "Publier ma récolte", "postRFQ": "Lancer un appel d'offres",
    "myDeals": "Mes transactions", "dashboard": "Tableau de bord" },
  "product": {
    "cereals": "Céréales", "olives": "Olives", "dates": "Dattes",
    "citrus": "Agrumes", "vegetables": "Maraîchage", "argan": "Argan", "legumes": "Légumineuses"
  },
  "grade": {
    "premium": "Premium ⭐", "grade_a": "Grade A", "grade_b": "Grade B", "standard": "Standard"
  },
  "deal": {
    "status": {
      "offer_made": "Offre soumise", "negotiating": "Négociation en cours",
      "agreed": "Accord trouvé", "contract_signed": "Contrat signé",
      "escrow_funded": "Acompte versé", "in_transit": "En transit",
      "delivered": "Livré", "completed": "Terminé ✓", "disputed": "En litige"
    },
    "deposit": "Acompte (30%)", "remainder": "Solde (70%)", "totalAmount": "Montant total",
    "pricePerQtx": "Prix par quintal", "quantityQtx": "Quantité (quintaux)"
  },
  "pricing": {
    "marketRef": "Prix de référence marché", "source": "Source",
    "sources": { "mawsim_transaction": "Transaction Mawsim", "onicl": "ONICL", "admin_manual": "Données officielles" },
    "lastUpdated": "Mis à jour il y a {time}",
    "priceAlert": "Alerte prix"
  },
  "trust": {
    "commission": "Commission Mawsim: 4% (2,5% acheteur + 1,5% producteur)",
    "escrowProtected": "Paiement sécurisé par escrow", "noHidden": "Aucun frais caché"
  }
}
```

## Arabic (ar.json) — key strings
```json
{
  "nav": { "priceBoard": "لوحة الأسعار", "listings": "عروض المنتجين",
    "postListing": "نشر محصولي", "postRFQ": "طلب عروض الأسعار" },
  "product": { "cereals": "الحبوب", "olives": "الزيتون", "dates": "التمور",
    "citrus": "الحوامض", "vegetables": "الخضروات" },
  "deal": {
    "status": { "agreed": "تم الاتفاق", "in_transit": "في الطريق",
      "completed": "مكتمل ✓", "disputed": "متنازع عليه" }
  }
}
```

## Rules
- Always use "quintal" (qtx) not "unité" — standard Moroccan agricultural unit
- Regions: use official Moroccan region names (Gharb-Chrarda, Souss-Massa, Béni Mellal-Khénifra...)
- Commission: always state clearly "2.5% acheteur + 1.5% producteur = 4% total"
- Never translate "ONICL" or "GlobalGAP" — they're proper names
