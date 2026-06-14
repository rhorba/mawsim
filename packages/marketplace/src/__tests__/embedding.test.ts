import { describe, expect, it } from 'vitest';
import { EMBEDDING_DIM, cosineSimilarity, embedProduct } from '../embedding.js';

describe('embedProduct', () => {
  it('produces a vector of the pgvector column dimension', () => {
    const v = embedProduct({ productCategory: 'cereals', productVariety: 'Blé dur Karim' });
    expect(v).toHaveLength(EMBEDDING_DIM);
  });

  it('is deterministic — same input yields identical vector', () => {
    const input = {
      productCategory: 'olives' as const,
      productVariety: 'Picholine',
      region: 'Marrakech-Safi',
    };
    expect(embedProduct(input)).toEqual(embedProduct(input));
  });

  it('is L2-normalized (unit length) for non-empty input', () => {
    const v = embedProduct({ productCategory: 'dates', productVariety: 'Mejhoul' });
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 5);
  });

  it('places same-category products closer than cross-category', () => {
    const wheat1 = embedProduct({ productCategory: 'cereals', productVariety: 'Blé dur Karim' });
    const wheat2 = embedProduct({ productCategory: 'cereals', productVariety: 'Blé dur Cham' });
    const dates = embedProduct({ productCategory: 'dates', productVariety: 'Mejhoul' });
    expect(cosineSimilarity(wheat1, wheat2)).toBeGreaterThan(cosineSimilarity(wheat1, dates));
  });

  it('treats diacritic variants of a region as similar', () => {
    const a = embedProduct({ productCategory: 'cereals', region: 'Meknès-Tafilalet' });
    const b = embedProduct({ productCategory: 'cereals', region: 'Meknes-Tafilalet' });
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });
});

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });
  it('returns 0 when either vector is zero', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
  it('throws on length mismatch', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow(/length mismatch/i);
  });
});
