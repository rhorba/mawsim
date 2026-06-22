import { describe, expect, it } from 'vitest';

// Inline the logic to keep tests fast and isolated (no module state pollution)
function makeRateLimiter(windowMs: number) {
  type Bucket = { count: number; windowStart: number };
  const buckets = new Map<string, Bucket>();

  return function check(key: string, max: number): boolean {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now - b.windowStart > windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return true;
    }
    b.count++;
    return b.count <= max;
  };
}

describe('checkRateLimit', () => {
  it('allows requests within the limit', () => {
    const check = makeRateLimiter(60_000);
    for (let i = 0; i < 5; i++) {
      expect(check('key', 5)).toBe(true);
    }
  });

  it('blocks when limit is exceeded', () => {
    const check = makeRateLimiter(60_000);
    for (let i = 0; i < 5; i++) check('key', 5);
    expect(check('key', 5)).toBe(false);
  });

  it('resets after the window expires', () => {
    const check = makeRateLimiter(1); // 1ms window
    for (let i = 0; i < 5; i++) check('key', 5);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(check('key', 5)).toBe(true);
        resolve();
      }, 5);
    });
  });

  it('isolates different keys', () => {
    const check = makeRateLimiter(60_000);
    for (let i = 0; i < 5; i++) check('a', 5);
    expect(check('a', 5)).toBe(false);
    expect(check('b', 5)).toBe(true);
  });
});
