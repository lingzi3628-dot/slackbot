/**
 * Distributed rate limiting with Upstash Redis (Vercel KV) + in-memory fallback.
 *
 * - In production with UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set,
 *   limits are enforced across ALL Vercel instances (survive cold starts).
 * - Without those env vars, falls back to in-memory (per-instance) limiting.
 *   This is less strict but still blocks abuse within a single instance.
 *
 * Algorithms:
 *   - Sliding window (Upstash): accurate, distributed.
 *   - Fixed window (fallback): per-instance, resets on cold start.
 *
 * Identifiers:
 *   - Anonymous: per IP
 *   - Authenticated: per API key (or per user ID)
 *   - Image generation: per IP (stricter)
 *   - Login attempts: per email + per IP (account lockout / IP ban)
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Limits ────────────────────────────────────────────────────────────
const ANON_LIMIT = 20; // per minute
const AUTH_LIMIT = 100; // per minute
const IMAGE_LIMIT = 10; // per hour
const LOGIN_FAIL_PER_EMAIL = 5; // per 15 min
const LOGIN_FAIL_PER_IP = 10; // per 15 min
const WEBHOOK_SET_LIMIT = 1; // per 5 min

const WINDOW_MS = 60 * 1000; // 1 minute
const HOUR_MS = 60 * 60 * 1000; // 1 hour
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// ── Upstash Redis client (optional) ───────────────────────────────────
let redis: Redis | null = null;
let ratelimiters: Record<string, Ratelimit> = {};

function getRedis(): Redis | null {
  if (redis !== null) return redis; // cached (or null if missing)
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redis = null;
    return null;
  }
  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (err) {
    console.warn("[rate-limit] Upstash Redis init failed, using in-memory fallback:", err);
    redis = null;
    return null;
  }
}

/** Get or create a Ratelimiter for a named limit. */
function getLimiter(name: string, limit: number, windowSec: number): Ratelimit | null {
  if (ratelimiters[name]) return ratelimiters[name];
  const r = getRedis();
  if (!r) return null;
  // slidingWindow(tokens, window) — window is a Duration string like "60 s"
  const windowDuration = `${windowSec} s` as `${number} s`;
  ratelimiters[name] = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, windowDuration),
    prefix: `spyro:${name}`,
    analytics: true,
  });
  return ratelimiters[name];
}

// ── In-memory fallback ────────────────────────────────────────────────
interface MemoryEntry {
  count: number;
  resetAt: number;
}
const memoryMap = new Map<string, MemoryEntry>();

function memoryCheck(identifier: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    memoryMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: entry.resetAt };
  }
  entry.count++;
  return { allowed: true, remaining: limit - entry.count, limit, resetAt: entry.resetAt };
}

// Periodic cleanup of expired in-memory entries.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryMap.entries()) {
      if (now > entry.resetAt) memoryMap.delete(key);
    }
  }, 5 * 60 * 1000);
}

// ── Public API ────────────────────────────────────────────────────────
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
}

/**
 * Check rate limit for an identifier. Uses Upstash if configured, else memory.
 *
 * @param identifier  Unique key (e.g. "ip:1.2.3.4" or "key:abc123")
 * @param limit       Max requests allowed
 * @param windowMs    Window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = ANON_LIMIT,
  windowMs: number = WINDOW_MS
): Promise<RateLimitResult> {
  // Try Upstash (distributed, sliding window)
  const limiter = getLimiter(`${limit}/${windowMs}`, limit, Math.ceil(windowMs / 1000));
  if (limiter) {
    try {
      const { success, remaining, reset } = await limiter.limit(identifier);
      return {
        allowed: success,
        remaining,
        limit,
        resetAt: reset ? reset * 1000 : Date.now() + windowMs,
      };
    } catch (err) {
      // Upstash failed — fall back to memory (graceful degradation)
      console.warn("[rate-limit] Upstash error, falling back to memory:", err);
    }
  }
  // In-memory fallback
  return memoryCheck(identifier, limit, windowMs);
}

/** Synchronous in-memory check (for routes that can't await). Deprecated — prefer async checkRateLimit. */
export function checkRateLimitSync(
  identifier: string,
  limit: number = ANON_LIMIT,
  windowMs: number = WINDOW_MS
): RateLimitResult {
  return memoryCheck(identifier, limit, windowMs);
}

/** Get rate limit for a chat/api request (anonymous or authenticated). */
export async function getRateLimitForRequest(
  ip: string,
  apiKey?: string | null
): Promise<RateLimitResult> {
  if (apiKey) {
    return checkRateLimit(`key:${apiKey}`, AUTH_LIMIT, WINDOW_MS);
  }
  return checkRateLimit(`ip:${ip}`, ANON_LIMIT, WINDOW_MS);
}

/** Synchronous version for backward compat (uses memory only). */
export function getRateLimitForRequestSync(
  ip: string,
  apiKey?: string | null
): RateLimitResult {
  if (apiKey) {
    return memoryCheck(`key:${apiKey}`, AUTH_LIMIT, WINDOW_MS);
  }
  return memoryCheck(`ip:${ip}`, ANON_LIMIT, WINDOW_MS);
}

/** Image generation rate limit (10/hour per IP). */
export async function checkImageRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`img:${ip}`, IMAGE_LIMIT, HOUR_MS);
}

/** Login failure tracking — per email (account lockout). */
export async function checkLoginFailEmail(email: string): Promise<RateLimitResult> {
  return checkRateLimit(`login-email:${email.toLowerCase()}`, LOGIN_FAIL_PER_EMAIL, LOCKOUT_MS);
}

/** Login failure tracking — per IP (IP ban). */
export async function checkLoginFailIp(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(`login-ip:${ip}`, LOGIN_FAIL_PER_IP, LOCKOUT_MS);
}

/** Telegram webhook setup rate limit (1 per 5 min per user). */
export async function checkWebhookSetLimit(userId: string): Promise<RateLimitResult> {
  return checkRateLimit(`webhook-set:${userId}`, WEBHOOK_SET_LIMIT, 5 * 60 * 1000);
}

/** Build standard X-RateLimit-* response headers. */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(Math.max(0, result.remaining)),
    "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
    "Retry-After": result.allowed ? "0" : String(Math.ceil((result.resetAt - Date.now()) / 1000)),
  };
}

/** Get client IP from a Next.js request (handles Vercel's x-forwarded-for). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}
