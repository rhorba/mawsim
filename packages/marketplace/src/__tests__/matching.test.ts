import { describe, expect, it } from 'vitest';
import { embedProduct } from '../embedding.js';
import {
  type MatchableListing,
  type RfqCriteria,
  gradeRank,
  matchRfq,
  rfqHardFilter,
} from '../matching.js';

const NOW = new Date('2026-06-14T00:00:00Z');
const FUTURE = new Date('2026-09-01T00:00:00Z');
const PAST = new Date('2026-01-01T00:00:00Z');

function listing(overrides: Partial<MatchableListing> = {}): MatchableListing {
  return {
    id: 'l1',
    productCategory: 'cereals',
    quantityQtx: 500,
    askPricePerQtx: 40000, // 400 MAD in centimes
    qualityGrade: 'grade_a',
    certificationIds: [],
    region: 'Meknès-Tafilalet',
    status: 'active',
    availableUntil: FUTURE,
    productVector: null,
    ...overrides,
  };
}

function rfq(overrides: Partial<RfqCriteria> = {}): RfqCriteria {
  return {
    productCategory: 'cereals',
    quantityQtxMin: 100,
    quantityQtxMax: 600,
    maxPricePerQtx: 50000,
    requiredQualityGrade: 'grade_b',
    requiredCertifications: [],
    deliveryRegion: 'Meknès-Tafilalet',
    productVector: null,
    ...overrides,
  };
}

describe('gradeRank', () => {
  it('orders premium > grade_a > grade_b > standard', () => {
    expect(gradeRank('premium')).toBeGreaterThan(gradeRank('grade_a'));
    expect(gradeRank('grade_a')).toBeGreaterThan(gradeRank('grade_b'));
    expect(gradeRank('grade_b')).toBeGreaterThan(gradeRank('standard'));
  });
});

describe('rfqHardFilter', () => {
  it('accepts a fully matching active listing', () => {
    expect(rfqHardFilter(rfq(), listing(), NOW)).toBe(true);
  });
  it('rejects non-active listings', () => {
    expect(rfqHardFilter(rfq(), listing({ status: 'draft' }), NOW)).toBe(false);
    expect(rfqHardFilter(rfq(), listing({ status: 'sold' }), NOW)).toBe(false);
  });
  it('rejects expired listings', () => {
    expect(rfqHardFilter(rfq(), listing({ availableUntil: PAST }), NOW)).toBe(false);
  });
  it('rejects category mismatch', () => {
    expect(rfqHardFilter(rfq(), listing({ productCategory: 'dates' }), NOW)).toBe(false);
  });
  it('rejects insufficient grade but accepts equal/higher grade', () => {
    expect(rfqHardFilter(rfq({ requiredQualityGrade: 'premium' }), listing(), NOW)).toBe(false);
    expect(
      rfqHardFilter(
        rfq({ requiredQualityGrade: 'grade_a' }),
        listing({ qualityGrade: 'premium' }),
        NOW
      )
    ).toBe(true);
  });
  it('rejects when listing cannot supply the minimum quantity', () => {
    expect(rfqHardFilter(rfq({ quantityQtxMin: 600 }), listing({ quantityQtx: 500 }), NOW)).toBe(
      false
    );
  });
  it('rejects when ask price exceeds buyer max', () => {
    expect(rfqHardFilter(rfq({ maxPricePerQtx: 30000 }), listing(), NOW)).toBe(false);
  });
  it('treats a null buyer max as no price ceiling', () => {
    expect(
      rfqHardFilter(rfq({ maxPricePerQtx: null }), listing({ askPricePerQtx: 999999 }), NOW)
    ).toBe(true);
  });
  it('requires every requested certification to be present', () => {
    expect(
      rfqHardFilter(
        rfq({ requiredCertifications: ['organic'] }),
        listing({ certificationIds: [] }),
        NOW
      )
    ).toBe(false);
    expect(
      rfqHardFilter(
        rfq({ requiredCertifications: ['organic'] }),
        listing({ certificationIds: ['organic', 'global_gap'] }),
        NOW
      )
    ).toBe(true);
  });
});

describe('matchRfq ranking', () => {
  it('ranks same-region semantic matches above off-region/off-variety ones', () => {
    const r = rfq({
      productVector: embedProduct({ productCategory: 'cereals', productVariety: 'Blé dur Karim' }),
    });
    const best = listing({
      id: 'best',
      region: 'Meknès-Tafilalet',
      productVector: embedProduct({ productCategory: 'cereals', productVariety: 'Blé dur Karim' }),
    });
    const worst = listing({
      id: 'worst',
      region: 'Souss-Massa',
      productVector: embedProduct({ productCategory: 'cereals', productVariety: 'Orge commune' }),
    });
    const ranked = matchRfq(r, [worst, best], { now: NOW });
    expect(ranked.map((m) => m.listing.id)).toEqual(['best', 'worst']);
    expect(ranked[0]?.score ?? 0).toBeGreaterThan(ranked[1]?.score ?? 0);
  });

  it('excludes ineligible listings entirely', () => {
    const ranked = matchRfq(
      rfq(),
      [listing({ id: 'ok' }), listing({ id: 'expired', availableUntil: PAST })],
      {
        now: NOW,
      }
    );
    expect(ranked.map((m) => m.listing.id)).toEqual(['ok']);
  });

  it('honors the limit', () => {
    const many = Array.from({ length: 5 }, (_, i) => listing({ id: `l${i}` }));
    expect(matchRfq(rfq(), many, { now: NOW, limit: 3 })).toHaveLength(3);
  });
});
