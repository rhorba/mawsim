import { describe, expect, it } from 'vitest';
import { type ContractData, generateContractPDF } from '../contract.js';

const SAMPLE: ContractData = {
  dealId: '11111111-1111-1111-1111-111111111111',
  farmerName: 'Coopérative Blé du Saïs',
  farmerRegion: 'Fès-Meknès',
  buyerCompanyName: 'Atlas Food Industries SA',
  buyerICE: '001234567890123',
  productCategory: 'cereals',
  productVariety: 'Blé dur Karim',
  qualityGrade: 'grade_a',
  quantityQtx: 150,
  agreedPricePerQtx: 32000, // 320.00 MAD/qtx
  totalAmount: 4800000, // 48 000.00 MAD
  deliveryRegion: 'Casablanca-Settat',
  deliveryDate: new Date('2026-08-01T00:00:00Z'),
  contractDate: new Date('2026-06-15T00:00:00Z'),
};

describe('generateContractPDF', () => {
  it('renders a non-empty PDF document', async () => {
    const pdf = await generateContractPDF(SAMPLE);
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1000);
    // PDF magic header.
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  }, 20000);

  it('renders even without optional fields', async () => {
    const minimal: ContractData = {
      dealId: '22222222-2222-2222-2222-222222222222',
      farmerName: 'Ferme Souss',
      buyerCompanyName: 'Export Med',
      productCategory: 'citrus',
      quantityQtx: 40,
      agreedPricePerQtx: 18000,
      totalAmount: 720000,
      deliveryRegion: 'Souss-Massa',
      deliveryDate: new Date('2026-09-10T00:00:00Z'),
      contractDate: new Date('2026-06-15T00:00:00Z'),
    };
    const pdf = await generateContractPDF(minimal);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  }, 20000);
});
