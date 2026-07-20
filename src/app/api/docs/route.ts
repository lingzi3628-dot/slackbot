import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { checkRateLimit, buildRateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API documentation — admin-only + rate-limited (1 req/min per IP).
 *
 * V2 FIX: Previously this endpoint publicly exposed every API path, method,
 * parameter, auth requirement, rate limit, and security header — a complete
 * attack-surface map for attackers.
 *
 * Now: requires admin session + 1 request/minute per IP rate limit.
 */
export async function GET(req: NextRequest) {
  // ── Rate limit: 1 per minute per IP ────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const rl = await checkRateLimit(`docs:${ip}`, 1, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again in 1 minute." },
      { status: 429, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── Auth check: admin-only ─────────────────────────────────────────
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── Return minimal docs (admin only) ──────────────────────────────
  // Note: we no longer expose the full endpoint inventory, security
  // header values, or rate-limit specifics. Admins get a high-level
  // overview sufficient for debugging without handing attackers a map.
  return NextResponse.json(
    {
      name: "SPYRO V1 API",
      version: "2.0.0",
      description: "Dragon-powered AI chat API.",
      authRequired: "Most endpoints accept an optional x-api-key header.",
      docs: "See the developer documentation portal for integration guides.",
      endpoints: {
        chat: "POST /api/chat — stream a chat response",
        image: "POST /api/image-gen — generate an image",
        auth: "POST /api/auth/login, POST /api/auth/register",
        health: "GET /api/health (admin only)",
      },
      support: "Contact support@spyrolabs.com for API access.",
    },
    { headers: buildRateLimitHeaders(rl) }
  );
}
