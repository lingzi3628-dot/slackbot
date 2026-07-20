import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Security audit endpoint — admin-only, minimal disclosure.
 *
 * V1 (round 2) FIX: Previously this endpoint leaked:
 *  - Which env vars exist (DATABASE_URL, GMAIL_USER, GMAIL_APP_PASSWORD, FIREBASE_API_KEY)
 *  - CORS configuration ("Access-Control-Allow-Origin": "*")
 *  - Rate limiting implementation ("In-memory Map (resets on cold start)")
 *  - Authentication method details (bcrypt, cookie config, api_key)
 *  - Data privacy info
 *  - Known issues
 *
 * Now: requires admin session, logs every access, returns ONLY:
 *  - timestamp
 *  - security_headers (safe to disclose — they're response headers anyway)
 *  - generic status
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  // ── Auth check: admin-only ─────────────────────────────────────────
  const session = await getAdminSession();
  if (!session) {
    // Log unauthorized access attempt
    try {
      await db.activityLog.create({
        data: {
          userId: "unknown",
          type: "security",
          description: `Unauthorized /api/security access from ${ip} (UA: ${userAgent.slice(0, 100)})`,
        },
      });
    } catch {
      /* ignore audit errors */
    }
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  // ── Log authorized access ──────────────────────────────────────────
  try {
    await db.activityLog.create({
      data: {
        userId: session.id,
        type: "security",
        description: `Admin ${session.email} accessed /api/security from ${ip}`,
      },
    });
  } catch {
    /* ignore audit errors */
  }

  // ── Return minimal, safe information ───────────────────────────────
  // NO env var details, NO CORS config, NO rate limit implementation,
  // NO authentication method details, NO data privacy info, NO known issues.
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    security_headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    },
  });
}
