// Bilingual (FR/AR) purchase-contract PDF — CLAUDE.md §11.3.
// Generated when a deal reaches `agreed` and the buyer signs (→ contract_signed).
//
// Authored with React.createElement (no JSX) so this stays a plain .ts module.
// Arabic glyph shaping needs an Arabic-capable font: register one by setting
// CONTRACT_AR_FONT_URL (path or URL to a Noto Kufi Arabic .ttf). Without it the
// document still renders — the FR side is fully valid and the AR section keeps
// the legally-required bilingual structure — so generation never hard-fails.

import { computeEscrowSplit, formatMAD } from '@mawsim/core';
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { createElement as h } from 'react';

export interface ContractData {
  dealId: string;
  farmerName: string;
  farmerRegion?: string;
  buyerCompanyName: string;
  buyerICE?: string;
  productCategory: string;
  productVariety?: string;
  qualityGrade?: string;
  quantityQtx: number;
  agreedPricePerQtx: number; // centimes
  totalAmount: number; // centimes
  deliveryRegion: string;
  deliveryDate: Date;
  contractDate: Date;
}

// Register an Arabic font once if the deployment provides one.
let AR_FONT = 'Helvetica';
const arFontSrc = process.env['CONTRACT_AR_FONT_URL'];
if (arFontSrc) {
  try {
    Font.register({ family: 'NotoArabic', src: arFontSrc });
    AR_FONT = 'NotoArabic';
  } catch {
    // keep Helvetica fallback
  }
}

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: 'Helvetica', color: '#2b2b2b' },
  title: { fontSize: 16, marginBottom: 2, fontFamily: 'Helvetica-Bold', color: '#3D5A3E' },
  titleAr: { fontSize: 14, marginBottom: 12, textAlign: 'right', fontFamily: AR_FONT },
  ref: { fontSize: 9, color: '#7a7a7a', marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    marginTop: 14,
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
    color: '#C8873A',
  },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: '40%', fontFamily: 'Helvetica-Bold' },
  value: { width: '60%' },
  ar: { textAlign: 'right', fontFamily: AR_FONT, color: '#555' },
  para: { marginTop: 4, lineHeight: 1.4 },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40 },
  signBox: { width: '45%', borderTopWidth: 1, borderTopColor: '#999', paddingTop: 4, fontSize: 9 },
});

function field(labelFr: string, value: string) {
  return h(
    View,
    { style: styles.row },
    h(Text, { style: styles.label }, labelFr),
    h(Text, { style: styles.value }, value)
  );
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Render the bilingual purchase contract to a PDF Buffer. */
export async function generateContractPDF(data: ContractData): Promise<Buffer> {
  const { deposit, remainder } = computeEscrowSplit(data.totalAmount);
  const product = data.productVariety
    ? `${data.productCategory} — ${data.productVariety}`
    : data.productCategory;

  const doc = h(
    Document,
    { title: `Contrat ${data.dealId}`, author: 'Mawsim' },
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Text, { style: styles.title }, "Contrat d'achat agricole — Mawsim"),
      h(Text, { style: styles.titleAr }, 'عقد شراء فلاحي — موسم'),
      h(
        Text,
        { style: styles.ref },
        `Réf. / المرجع: ${data.dealId} · ${dateStr(data.contractDate)}`
      ),

      // Parties
      h(Text, { style: styles.sectionTitle }, 'Parties / الأطراف'),
      field(
        'Producteur (vendeur)',
        data.farmerName + (data.farmerRegion ? ` — ${data.farmerRegion}` : '')
      ),
      field('Acheteur', data.buyerCompanyName),
      data.buyerICE ? field('ICE acheteur', data.buyerICE) : null,

      // Product
      h(Text, { style: styles.sectionTitle }, 'Produit / المنتج'),
      field('Produit', product),
      data.qualityGrade ? field('Qualité / grade', data.qualityGrade) : null,
      field('Quantité', `${data.quantityQtx} quintaux`),
      field('Prix unitaire', `${formatMAD(data.agreedPricePerQtx, 'fr')} / quintal`),
      field('Montant total', formatMAD(data.totalAmount, 'fr')),

      // Delivery
      h(Text, { style: styles.sectionTitle }, 'Livraison / التسليم'),
      field('Région de livraison', data.deliveryRegion),
      field('Date de livraison', dateStr(data.deliveryDate)),

      // Payment terms (escrow 30/70)
      h(Text, { style: styles.sectionTitle }, 'Paiement (séquestre) / الأداء'),
      field('Acompte à la signature (30%)', formatMAD(deposit, 'fr')),
      field('Solde à la livraison (70%)', formatMAD(remainder, 'fr')),
      h(
        Text,
        { style: styles.para },
        "Les fonds sont conservés en séquestre par Mawsim. L'acompte de 30% est versé à la signature, le solde de 70% est libéré au producteur après confirmation de la livraison."
      ),
      h(
        Text,
        { style: [styles.para, styles.ar] },
        'تُحفظ المبالغ لدى موسم كضمان. يُدفع 30٪ عند التوقيع، ويُحرَّر الرصيد 70٪ للمنتِج بعد تأكيد التسليم.'
      ),

      // Dispute clause
      h(Text, { style: styles.sectionTitle }, 'Litiges / النزاعات'),
      h(
        Text,
        { style: styles.para },
        'Tout litige sur la qualité ou la quantité suspend la libération du séquestre et est soumis à la médiation de Mawsim, avec recours possible à un inspecteur qualité indépendant.'
      ),
      h(
        Text,
        { style: [styles.para, styles.ar] },
        'يوقف أي نزاع حول الجودة أو الكمية تحرير الضمان ويُحال إلى وساطة موسم، مع إمكانية اللجوء إلى مفتش جودة مستقل.'
      ),

      // Signatures
      h(
        View,
        { style: styles.signRow },
        h(Text, { style: styles.signBox }, 'Producteur / المنتِج'),
        h(Text, { style: styles.signBox }, 'Acheteur / المشتري')
      )
    )
  );

  return renderToBuffer(doc);
}
