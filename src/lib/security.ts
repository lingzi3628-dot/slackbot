/**
 * Security headers. CORS is now handled by src/middleware.ts with an origin
 * allowlist (V3 fix) — do NOT use a wildcard Access-Control-Allow-Origin here.
 *
 * These headers are applied to API route responses via NextResponse.headers.set().
 * The middleware also applies them to all responses globally.
 */

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

/**
 * CORS headers for a SPECIFIC allowed origin.
 * Pass the request's Origin header — if it's in the allowlist, the
 * Access-Control-Allow-Origin header will be set to that origin.
 * If origin is null/unknown, no CORS headers are returned (browser blocks).
 */
export function corsHeadersForOrigin(origin: string | null): Record<string, string> {
  const ALLOWED_ORIGINS = [
    "https://slackbot-seven.vercel.app",
    "https://spyro-v1.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return {}; // No CORS headers — browser will block cross-origin reads
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-csrf-token",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** Apply security headers to a Response. CORS is handled by middleware. */
export function withSecurityHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    ...headers,
  };
}
