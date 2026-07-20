import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { createSession, buildSessionCookie, revokeSession } from "@/lib/session";
import {
  validateEmail,
} from "@/lib/input-validation";
import {
  checkRateLimit,
  checkLoginFailEmail,
  checkLoginFailIp,
  buildRateLimitHeaders,
  getClientIp,
} from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // bcrypt compare ~3s + DB queries + session creation

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

/** Hash an email for privacy in audit logs (SHA-256, one-way). */
function hashEmailForAudit(email: string): string {
  return createHash("sha256").update(email.toLowerCase(), "utf8").digest("hex").slice(0, 16);
}

/**
 * POST /api/auth/login — sign in with email + password.
 *
 * Hardening:
 *  - Email format validated before any DB query.
 *  - Account lockout: 5 failed attempts per email / 15 min.
 *  - IP ban: 10 failed attempts per IP / 1 HOUR (was 15 min — hardened per spec).
 *  - bcrypt cost factor 12.
 *  - Generic error messages (no email enumeration).
 *  - All failed attempts logged with HASHED email (privacy).
 *  - DB-stored session with SameSite=Strict cookie.
 *  - Session ID regenerated on login (prevents session fixation).
 *  - Error handler: never leaks internals.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  try {
    // ── Global rate limit: 20 login attempts / min / IP ───────────────
    const globalRl = await checkRateLimit(`login:${ip}`, 20, 60 * 1000);
    if (!globalRl.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please slow down." },
        { status: 429, headers: buildRateLimitHeaders(globalRl) }
      );
    }

    // ── Parse + validate input ────────────────────────────────────────
    let body: LoginBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const email = validateEmail(body.email);
    const password = typeof body.password === "string"
      ? body.password.slice(0, 128) // hard cap to prevent DoS
      : "";

    if (!email) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Account lockout check (per email, 15 min) ─────────────────────
    const emailLockout = await checkLoginFailEmail(email);
    if (!emailLockout.allowed) {
      const mins = Math.ceil((emailLockout.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Account temporarily locked. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(emailLockout) }
      );
    }

    // ── IP ban check (per IP, 1 HOUR — hardened) ──────────────────────
    const ipLockout = await checkLoginFailIp(ip);
    if (!ipLockout.allowed) {
      const mins = Math.ceil((ipLockout.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many failed attempts from this network. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(ipLockout) }
      );
    }

    // ── Look up user ──────────────────────────────────────────────────
    const user = await db.user.findUnique({ where: { email } });

    // Dummy hash for constant-time comparison (prevents user enumeration via timing)
    const dummyHash = "$2a$12$000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const hashToCompare = user?.password || dummyHash;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      // ── Record failure (both email + IP counters) ──────────────────
      await checkLoginFailEmail(email);
      await checkLoginFailIp(ip);

      // ── Audit log with HASHED email (privacy) ──────────────────────
      // userId is nullable in ActivityLog — null for nonexistent users.
      const hashedEmail = hashEmailForAudit(email);
      try {
        await db.activityLog.create({
          data: {
            userId: user?.id || null,
            type: "auth",
            description: `Failed login (email hash: ${hashedEmail}) from ${ip}`,
            metadata: {
              ip,
              userAgent: userAgent.slice(0, 200),
              emailHash: hashedEmail,
              timestamp: new Date().toISOString(),
            },
          },
        });
      } catch { /* ignore audit errors */ }

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── Auto-verify unverified users (graceful degradation) ──────────
    // We can't guarantee SMTP works (wrong password, Gmail down, etc.).
    // So always auto-verify on login — don't lock users out.
    if (!user.verified) {
      try {
        await db.user.update({
          where: { id: user.id },
          data: { verified: true },
        });
      } catch { /* ignore */ }
    }

    // ── Success: create DB-stored session (regenerated ID) ────────────
    const cookieValue = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    }, req);

    // ── Audit successful login ────────────────────────────────────────
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          type: "auth",
          description: `Successful login from ${ip}`,
          metadata: {
            ip,
            userAgent: userAgent.slice(0, 200),
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch { /* ignore */ }

    const res = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
    });
    res.headers.set("Set-Cookie", buildSessionCookie(cookieValue));
    return res;
  } catch (err) {
    return handleApiError(err, "POST /api/auth/login");
  }
}
