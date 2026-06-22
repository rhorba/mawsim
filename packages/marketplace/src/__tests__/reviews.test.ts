import { describe, expect, it } from 'vitest';
import { ReviewError, validateComment, validateRating } from '../reviews.js';

describe('validateRating', () => {
  it('accepts 1–5', () => {
    for (const r of [1, 2, 3, 4, 5]) {
      expect(() => validateRating(r)).not.toThrow();
    }
  });

  it('rejects 0', () => {
    expect(() => validateRating(0)).toThrow(ReviewError);
  });

  it('rejects 6', () => {
    expect(() => validateRating(6)).toThrow(ReviewError);
  });

  it('rejects negative', () => {
    expect(() => validateRating(-1)).toThrow(ReviewError);
  });

  it('rejects float', () => {
    expect(() => validateRating(3.5)).toThrow(ReviewError);
  });
});

describe('validateComment', () => {
  it('accepts undefined', () => {
    expect(() => validateComment(undefined)).not.toThrow();
  });

  it('accepts empty string', () => {
    expect(() => validateComment('')).not.toThrow();
  });

  it('accepts 1000 chars', () => {
    expect(() => validateComment('a'.repeat(1000))).not.toThrow();
  });

  it('rejects 1001 chars', () => {
    expect(() => validateComment('a'.repeat(1001))).toThrow(ReviewError);
  });
});

describe('ReviewError', () => {
  it('has correct name for error type identification', () => {
    const err = new ReviewError('test');
    expect(err.name).toBe('ReviewError');
    expect(err instanceof ReviewError).toBe(true);
  });
});
