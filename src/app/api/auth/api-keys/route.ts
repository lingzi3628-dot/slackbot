import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  createApiKeyForUser,
  listApiKeysForUser,
} from "@/lib/api-auth";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/input-validation";
import { handleApiError } from "@/lib/error-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auth/api-keys — list the current user's API keys (masked).
 * POST /api/auth/api-keys — generate a new API key (returned ONCE).
 *
 * #7 (hardening):
 *  - Keys are SHA-256 hashed before storage (never stored raw).
 *  - The raw key is returned EXACTLY ONCE on creation.
 *  - List endpoint never reveals the key (not even the hash).
 *  - Rate limited: 5 key generations per hour per user.
 *  - Audit logged.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const keys = await listApiKeysForUser(session.userId);
    return NextResponse.json({ keys });
  } catch (err) {
    return handleApiError(err, "GET /api/auth/api-keys");
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // ── Rate limit: 5 key generations / hour / user ──────────────────
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`apikey-gen:${session.userId}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      const mins = Math.ceil((rl.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many API key generations. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── Parse + sanitize the key name ────────────────────────────────
    let body: { name?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const name = sanitizeString(body.name, 80) || "Default";

    // ── Create the key ───────────────────────────────────────────────
    const { rawKey, record } = await createApiKeyForUser(session.userId, name);

    // ── Audit log ────────────────────────────────────────────────────
    try {
      await db.activityLog.create({
        data: {
          userId: session.userId,
          type: "api_key",
          description: `Generated API key "${name}" from ${ip}`,
          metadata: { keyId: record.id, ip },
        },
      });
    } catch { /* ignore */ }

    // ── Return the raw key ONCE ──────────────────────────────────────
    return NextResponse.json({
      key: rawKey, // ← shown once, never again
      id: record.id,
      name: record.name,
      message: "Save this key securely. It will not be shown again.",
    });
  } catch (err) {
    return handleApiError(err, "POST /api/auth/api-keys");
  }
}
