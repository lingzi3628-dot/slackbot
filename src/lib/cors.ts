/**
 * CORS allowlist utility — shared by middleware.ts and API routes.
 *
 * V2 (round 2): Extracted into a dedicated module so all routes can use
 * the same allowlist logic. Reads additional origins from CORS_ORIGINS
 * env var (comma-separated).
 */

// ── Static allowlist ──────────────────────────────────────────────────
const STATIC_ORIGINS = [
  "https://slackbot-seven.vercel.app",
  "https://spyro-v1.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// Vercel preview deployment patterns (dev/staging only)
const VERCEL_PREVIEW_PATTERNS = [
  /^https:\/\/[a-z0-9-]+-spyro[a-z0-9-]*\.vercel\.app$/i,
  /^https:\/\/[a-z0-9-]+-slackbot[a-z0-9-]*\.vercel\.app$/i,
];

/** Get the full allowlist (static + env-var + preview patterns in dev). */
export function getAllowedOrigins(): string[] {
  const origins = [...STATIC_ORIGINS];
  // Add env-var origins (comma-separated)
  const envOrigins = process.env.CORS_ORIGINS;
  if (envOrigins) {
    for (const o of envOrigins.split(",")) {
      const trimmed = o.trim();
      if (trimmed && !origins.includes(trimmed)) {
        origins.push(trimmed);
      }
    }
  }
  return origins;
}

/** Check if an origin is allowed (static, env-var, or preview pattern). */
export function isAllowedOrigin(origin: string | null | undefined): boolean {
  if (!origin) return false;
  if (STATIC_ORIGINS.includes(origin)) return true;
  // Env-var origins
  const envOrigins = process.env.CORS_ORIGINS;
  if (envOrigins) {
    const envList = envOrigins.split(",").map((o) => o.trim());
    if (envList.includes(origin)) return true;
  }
  // Vercel preview patterns (dev/staging only)
  if (process.env.NODE_ENV !== "production") {
    if (VERCEL_PREVIEW_PATTERNS.some((p) => p.test(origin))) return true;
  }
  return false;
}

/** Build CORS headers for a specific origin (if allowed). Empty if not. */
export function corsHeadersForOrigin(origin: string | null | undefined): Record<string, string> {
  if (!isAllowedOrigin(origin)) {
    return {}; // No CORS headers — browser blocks cross-origin reads
  }
  return {
    "Access-Control-Allow-Origin": origin as string,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-csrf-token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Handle OPTIONS preflight — returns 204 for allowed, 403 for disallowed. */
export function handlePreflight(origin: string | null | undefined): Response {
  if (!isAllowedOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response(null, {
    status: 204,
    headers: corsHeadersForOrigin(origin),
  });
}
