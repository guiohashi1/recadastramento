/**
 * Simple in-memory rate limiter (single Node instance).
 * Enough for v1 convenience auth; replace with Redis if multi-instance.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const current = buckets.get(params.key);

  if (!current || current.resetAt <= now) {
    buckets.set(params.key, {
      count: 1,
      resetAt: now + params.windowMs,
    });
    return { ok: true, remaining: params.limit - 1, retryAfterMs: 0 };
  }

  if (current.count >= params.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: current.resetAt - now,
    };
  }

  current.count += 1;
  return {
    ok: true,
    remaining: params.limit - current.count,
    retryAfterMs: 0,
  };
}
