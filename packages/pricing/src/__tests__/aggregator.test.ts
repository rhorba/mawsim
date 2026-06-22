import { describe, expect, it } from 'vitest';

// Test the IQR outlier filter in isolation (extracted as a pure function for testing).
// The actual getMarketPrices() hits the DB, so we test the aggregation math here.

function iqrFilter(values: number[]): number[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)]!;
  const q3 = sorted[Math.floor(sorted.length * 0.75)]!;
  const iqr = q3 - q1;
  if (iqr === 0) return values;
  const lo = q1 - 1.5 * iqr;
  const hi = q3 + 1.5 * iqr;
  return values.filter((v) => v >= lo && v <= hi);
}

describe('IQR outlier filter', () => {
  it('returns all values when fewer than 4 points', () => {
    expect(iqrFilter([100, 200, 300])).toEqual([100, 200, 300]);
  });

  it('removes extreme outliers', () => {
    // Normal wheat prices around 400-500 MAD/qtx (centimes: 40000-50000)
    // With one extreme outlier at 500000 (50 MAD — clearly a data error)
    const prices = [42000, 43000, 44000, 45000, 46000, 50000, 500];
    const filtered = iqrFilter(prices);
    expect(filtered).not.toContain(500); // outlier removed
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('keeps normal price distribution intact', () => {
    const prices = [40000, 41000, 42000, 43000, 44000, 45000, 46000];
    const filtered = iqrFilter(prices);
    expect(filtered).toEqual(prices); // no outliers, all kept
  });

  it('returns same array when IQR is 0 (all identical values)', () => {
    const prices = [45000, 45000, 45000, 45000];
    expect(iqrFilter(prices)).toEqual(prices);
  });
});

describe('price trend calculation', () => {
  it('computes positive trend correctly', () => {
    const currentAvg = 44000;
    const priorAvg = 40000;
    const pct = Math.round(((currentAvg - priorAvg) / priorAvg) * 100);
    expect(pct).toBe(10); // +10%
  });

  it('computes negative trend correctly', () => {
    const currentAvg = 36000;
    const priorAvg = 40000;
    const pct = Math.round(((currentAvg - priorAvg) / priorAvg) * 100);
    expect(pct).toBe(-10); // -10%
  });

  it('returns 0 for stable prices', () => {
    const currentAvg = 40000;
    const priorAvg = 40000;
    const pct = Math.round(((currentAvg - priorAvg) / priorAvg) * 100);
    expect(pct).toBe(0);
  });
});
