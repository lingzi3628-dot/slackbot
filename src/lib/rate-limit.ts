/**
 * Rate limiting + API key authentication middleware.
 *
 * Rate limits:
 *   - Anonymous (no API key): 20 requests / minute per IP
 *   - Authenticated (with API key): 100 requests / minute per key
 *   - Image generation: 10 / hour per IP (handled in the route)
 *
 * API keys are stored in the Neon DB (User.resetToken field, prefixed
 * with 'spyro-'). When an API key is provided via the x-api-key header,
 * the request is authenticated and the rate limit is per-key.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const ANON_LIMIT = 20; // per minute
const AUTH_LIMIT = 100; // per minute
const WINDOW_MS = 60 * 1000; // 1 minute

const rateMap = new Map<string, RateLimitEntry>();

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = ANON_LIMIT
): RateLimitResult {
  const now = Date.now();
  const entry = rateMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateMap.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, limit, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, limit, resetAt: entry.resetAt };
}

/** Get rate limit for a request (anonymous or authenticated). */
export function getRateLimitForRequest(
  ip: string,
  apiKey?: string | null
): RateLimitResult {
  if (apiKey) {
    return checkRateLimit(`key:${apiKey}`, AUTH_LIMIT);
  }
  return checkRateLimit(`ip:${ip}`, ANON_LIMIT);
}

/** Build rate limit headers for the response. */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

/** Clean up expired entries periodically (every 5 minutes). */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap.entries()) {
      if (now > entry.resetAt) {
        rateMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
