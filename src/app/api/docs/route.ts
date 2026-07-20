import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { getSession } from "@/lib/session";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API documentation — restricted access.
 *
 * V7 (round 2) FIX:
 *  - In production: requires ENABLE_API_DOCS="true" env var.
 *  - If enabled: requires authentication (session) + rate limited (1/min/IP).
 *  - Admin users get full docs; authenticated users get a stripped version.
 *  - Unauthenticated: 401.
 *  - Stripped: no internal architecture, no auth method details, no rate
 *    limit implementation, no security header values.
 *  - Only shows endpoint names + HTTP methods, not parameters or response schemas.
 */
export async function GET(req: NextRequest) {
  // ── 1. Environment toggle — in production, docs are off by default ──
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_API_DOCS !== "true") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  // ── 2. Rate limit: 1 per minute per IP ─────────────────────────────
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`docs:${ip}`, 1, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 1 minute." },
      { status: 429, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── 3. Auth check: must be authenticated ───────────────────────────
  const session = getSession(req);
  const adminSession = await getAdminSession();

  if (!session && !adminSession) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── 4. Admin gets full docs; regular users get stripped version ────
  if (adminSession) {
    // Admin: full endpoint list (but still no security/auth implementation details)
    return NextResponse.json({
      name: "SPYRO V1 API",
      version: "2.0.0",
      endpoints: [
        { path: "/api/chat", method: "POST" },
        { path: "/api/image-gen", method: "POST" },
        { path: "/api/god-mode", method: "POST" },
        { path: "/api/remove-bg", method: "POST" },
        { path: "/api/transcribe", method: "POST" },
        { path: "/api/tts", method: "POST" },
        { path: "/api/web-scout", method: "POST" },
        { path: "/api/auth/login", method: "POST" },
        { path: "/api/auth/register", method: "POST" },
        { path: "/api/auth/me", method: "GET" },
        { path: "/api/auth/logout", method: "POST" },
        { path: "/api/auth/csrf", method: "GET" },
        { path: "/api/health", method: "GET" },
        { path: "/api/docs", method: "GET" },
      ],
      note: "All endpoints require authentication except /api/auth/* and /api/health (admin-only).",
    }, { headers: buildRateLimitHeaders(rl) });
  }

  // Regular authenticated user: minimal endpoint list (no params, no internals)
  return NextResponse.json({
    name: "SPYRO V1 API",
    version: "2.0.0",
    endpoints: [
      { path: "/api/chat", method: "POST", description: "Chat with SPYRO V1" },
      { path: "/api/image-gen", method: "POST", description: "Generate an image (auth required)" },
      { path: "/api/auth/me", method: "GET", description: "Get current user" },
      { path: "/api/auth/logout", method: "POST", description: "Sign out" },
    ],
    support: "Contact support@spyrolabs.com for API access.",
  }, { headers: buildRateLimitHeaders(rl) });
}
