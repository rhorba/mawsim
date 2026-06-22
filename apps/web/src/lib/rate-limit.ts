// Simple in-memory token-bucket rate limiter (per-key, fixed window).
// Suitable for v0.1 single-instance deploy. Move to Redis for horizontal scale.

type Bucket = { count: number; windowStart: number };

const BUCKETS = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000; // 15-minute windows

let sweepCounter = 0;

function sweep() {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [k, b] of BUCKETS) {
    if (b.windowStart < cutoff) BUCKETS.delete(k);
  }
}

/**
 * Returns true if the request is within the allowed rate.
 * key     — unique discriminator (e.g. `signup:1.2.3.4` or `login:user@example.com`)
 * max     — maximum requests per 15-minute window
 */
export function checkRateLimit(key: string, max: number): boolean {
  if (++sweepCounter % 500 === 0) sweep();

  const now = Date.now();
  const bucket = BUCKETS.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    BUCKETS.set(key, { count: 1, windowStart: now });
    return true;
  }

  bucket.count++;
  return bucket.count <= max;
}

/** Extract best-effort client IP from request headers (behind Caddy/proxy). */
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}
