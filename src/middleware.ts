/**
 * SPYRO V1 — Edge middleware
 *
 * Responsibilities:
 *  1. CORS allowlist (V3): only specific origins may make cross-origin requests.
 *     Reject OPTIONS preflight from unknown origins with 403.
 *  2. CSRF protection (V6): all state-changing requests (POST/PUT/DELETE/PATCH)
 *     to /api/auth/* must include an x-csrf-token header matching the csrf-token
 *     HttpOnly cookie. Tokens are issued by GET /api/auth/csrf.
 *  3. Security headers on all responses.
 */

import { NextResponse, type NextRequest } from "next/server";

// ── CORS allowlist (V3) ───────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://slackbot-seven.vercel.app",
  "https://spyro-v1.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

// In dev, allow any vercel.app preview deployment.
const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+-spyro[a-z0-9-]*\.vercel\.app$/i;
const VERCEL_PREVIEW_ALT = /^https:\/\/[a-z0-9-]+-slackbot[a-z0-9-]*\.vercel\.app$/i;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    if (VERCEL_PREVIEW.test(origin) || VERCEL_PREVIEW_ALT.test(origin)) return true;
  }
  return false;
}

// ── CSRF protection (V6) ──────────────────────────────────────────────
const CSRF_COOKIE = "spyro-csrf";
const CSRF_HEADER = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32; // bytes → 64 hex chars
const CSRF_MAX_AGE = 60 * 60; // 1 hour (seconds)

/** Generate a cryptographically random CSRF token. */
function generateCsrfToken(): string {
  // Use Web Crypto API (available in Edge runtime)
  const arr = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Paths that require CSRF protection (state-changing auth operations). */
function isCsrfProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth/") &&
    // Exclude the CSRF issuer itself + GET-only endpoints
    !pathname.endsWith("/csrf") &&
    !pathname.endsWith("/me") &&
    !pathname.endsWith("/google") // OAuth flow has its own protection
  );
}

// ── Security headers ──────────────────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export async function middleware(req: NextRequest) {
  const { method, url, headers } = req;
  const pathname = new URL(url).pathname;
  const origin = headers.get("origin");

  // ── 1. Handle CORS preflight (OPTIONS) ──────────────────────────────
  if (method === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      // Reject preflight from unknown origins
      return new NextResponse(JSON.stringify({ error: "Origin not allowed" }), {
        status: 403,
        headers: { "content-type": "application/json", ...SECURITY_HEADERS },
      });
    }
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": origin as string,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key, x-csrf-token",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    };
    return new NextResponse(null, { status: 204, headers: { ...SECURITY_HEADERS, ...corsHeaders } });
  }

  // ── 2. CSRF check (state-changing auth requests) ───────────────────
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && isCsrfProtectedPath(pathname)) {
    const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
    const headerToken = headers.get(CSRF_HEADER);
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid CSRF token" }),
        {
          status: 403,
          headers: { "content-type": "application/json", ...SECURITY_HEADERS },
        }
      );
    }
  }

  // ── 3. Issue CSRF token on GET /api/auth/csrf ──────────────────────
  if (method === "GET" && pathname === "/api/auth/csrf") {
    const token = generateCsrfToken();
    const res = NextResponse.json({ csrfToken: token }, { headers: SECURITY_HEADERS });
    res.cookies.set(CSRF_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: CSRF_MAX_AGE,
      path: "/",
    });
    return res;
  }

  // ── 4. Build response with CORS + security headers ─────────────────
  const res = NextResponse.next();
  // Apply security headers to all responses
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    res.headers.set(k, v);
  }
  // CORS: only set Allow-Origin if the origin is allowlisted
  if (isAllowedOrigin(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin as string);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }
  // If origin is not allowed, we don't set any CORS headers — the browser
  // will block the response from being read by the cross-origin script.

  return res;
}

export const config = {
  // Run on all API routes + all pages. We need it on /api/* for CORS+CSRF,
  // and on pages so security headers apply to HTML responses too.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};
