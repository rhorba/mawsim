import { describe, expect, it } from 'vitest';
import { embedProduct } from '../embedding.js';
import { type RfqRerankInput, computeMatchScore } from '../matching.js';

function input(overrides: Partial<RfqRerankInput> = {}): RfqRerankInput {
  return {
    similarity: 1,
    listingGrade: 'grade_a',
    requiredGrade: 'grade_b',
    sellerRating: 5,
    askPricePerQtx: 30000,
    maxPricePerQtx: 60000,
    ...overrides,
  };
}

describe('computeMatchScore', () => {
  it('returns a value in [0,1]', () => {
    const s = computeMatchScore(input());
    expect(s).toBeGreaterThanOrEqual(0);
    expect(s).toBeLessThanOrEqual(1);
  });

  it('weights similarity at 50%', () => {
    // Hold everything else equal; similarity 1 vs 0 should differ by ~0.5.
    const hi = computeMatchScore(input({ similarity: 1 }));
    const lo = computeMatchScore(input({ similarity: 0 }));
    expect(hi - lo).toBeCloseTo(0.5, 5);
  });

  it('rewards higher quality grade', () => {
    const premium = computeMatchScore(input({ listingGrade: 'premium' }));
    const standard = computeMatchScore(input({ listingGrade: 'standard' }));
    expect(premium).toBeGreaterThan(standard);
  });

  it('rewards a higher seller rating', () => {
    const good = computeMatchScore(input({ sellerRating: 5 }));
    const poor = computeMatchScore(input({ sellerRating: 0 }));
    expect(good).toBeGreaterThan(poor);
  });

  it('rewards a cheaper price relative to the ceiling', () => {
    const cheap = computeMatchScore(input({ askPricePerQtx: 10000, maxPricePerQtx: 60000 }));
    const dear = computeMatchScore(input({ askPricePerQtx: 59000, maxPricePerQtx: 60000 }));
    expect(cheap).toBeGreaterThan(dear);
  });

  it('uses a neutral price score when no ceiling is set', () => {
    const a = computeMatchScore(input({ maxPricePerQtx: null, askPricePerQtx: 10000 }));
    const b = computeMatchScore(input({ maxPricePerQtx: null, askPricePerQtx: 90000 }));
    expect(a).toBe(b); // price component is constant 0.5 either way
  });

  it('clamps out-of-range similarity', () => {
    expect(computeMatchScore(input({ similarity: 2 }))).toBe(
      computeMatchScore(input({ similarity: 1 }))
    );
    expect(computeMatchScore(input({ similarity: -1 }))).toBe(
      computeMatchScore(input({ similarity: 0 }))
    );
  });
});

describe('computeMatchScore — embedding-driven ranking fixture', () => {
  // An IAA buyer wants "Blé dur" in Meknès. The closer listing (same variety +
  // region) must out-rank a generic cereals listing once fed through the scorer.
  const rfqVec = embedProduct({
    productCategory: 'cereals',
    productVariety: 'Blé dur Karim',
    qualityGrade: 'grade_a',
    region: 'Meknès-Tafilalet',
  });

  function sim(listingVec: number[]): number {
    // mirror the server mapping: cosine distance ∈ [0,2] → similarity ∈ [0,1]
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < rfqVec.length; i++) {
      const a = rfqVec[i] ?? 0;
      const b = listingVec[i] ?? 0;
      dot += a * b;
      na += a * a;
      nb += b * b;
    }
    const cosine = na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
    return (cosine + 1) / 2;
  }

  it('ranks the semantically closer listing first', () => {
    const close = embedProduct({
      productCategory: 'cereals',
      productVariety: 'Blé dur Karim',
      qualityGrade: 'grade_a',
      region: 'Meknès-Tafilalet',
    });
    const far = embedProduct({
      productCategory: 'cereals',
      productVariety: 'Maïs',
      qualityGrade: 'grade_a',
      region: 'Souss-Massa',
    });

    const closeScore = computeMatchScore({
      similarity: sim(close),
      listingGrade: 'grade_a',
      requiredGrade: 'grade_a',
      sellerRating: 4,
      askPricePerQtx: 40000,
      maxPricePerQtx: 50000,
    });
    const farScore = computeMatchScore({
      similarity: sim(far),
      listingGrade: 'grade_a',
      requiredGrade: 'grade_a',
      sellerRating: 4,
      askPricePerQtx: 40000,
      maxPricePerQtx: 50000,
    });

    expect(closeScore).toBeGreaterThan(farScore);
  });
});
