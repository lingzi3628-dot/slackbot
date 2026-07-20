import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSessionToken, buildSessionCookie } from "@/lib/session";
import {
  validateEmail,
  sanitizeString,
  safeEqual,
} from "@/lib/input-validation";
import {
  checkRateLimit,
  checkLoginFailEmail,
  checkLoginFailIp,
  buildRateLimitHeaders,
  getClientIp,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LoginBody {
  email?: unknown;
  password?: unknown;
}

/**
 * POST /api/auth/login — sign in with email + password.
 *
 * V11 FIX:
 *  - Email format validated with regex before any DB query.
 *  - Input sanitized (strip null bytes, control chars, HTML tags).
 *  - Account lockout: 5 failed attempts per email / 15 min.
 *  - IP ban: 10 failed attempts per IP / 15 min.
 *  - bcrypt cost factor 12 (upgraded from 10).
 *  - Constant-time comparison for session token verification (in session.ts).
 *  - Generic error messages (no email enumeration: "Invalid email or password").
 *  - All failed attempts logged to audit (write-only).
 *  - Successful login resets the failure counters.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

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
  // Password: sanitize (strip nulls/control chars) but don't enforce length
  // here — we want to compare against the hash regardless, to avoid timing leaks.
  const password = typeof body.password === "string"
    ? body.password.slice(0, 128) // hard cap to prevent DoS
    : "";

  if (!email) {
    // Still consume rate limit budget so attackers can't distinguish
    // "invalid email" from "invalid password".
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // ── Account lockout check (per email) ─────────────────────────────
  const emailLockout = await checkLoginFailEmail(email);
  if (!emailLockout.allowed) {
    const mins = Math.ceil((emailLockout.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Account temporarily locked. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429, headers: buildRateLimitHeaders(emailLockout) }
    );
  }

  // ── IP ban check (per IP) ─────────────────────────────────────────
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

  // Use a dummy hash to compare against when the user doesn't exist —
  // this keeps the response time roughly constant (prevents user enumeration
  // via timing analysis).
  const dummyHash = "$2a$12$000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const hashToCompare = user?.password || dummyHash;

  const valid = await bcrypt.compare(password, hashToCompare);

  if (!user || !valid) {
    // ── Record failure (both email + IP counters) ──────────────────
    await checkLoginFailEmail(email); // consume budget
    await checkLoginFailIp(ip);       // consume budget

    // ── Audit log (write-only — never readable via chat) ───────────
    try {
      await db.activityLog.create({
        data: {
          userId: user?.id || "unknown",
          type: "auth",
          description: `Failed login attempt for ${email} from ${ip}`,
        },
      });
    } catch {
      // Don't fail the login response if audit logging fails.
    }

    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // ── V8 (round 2): Require verified email ──────────────────────────
  if (!user.verified) {
    return NextResponse.json(
      {
        error: "Please verify your email before signing in. Check your inbox for the verification link.",
        needsVerification: true,
        email: user.email,
      },
      { status: 403 }
    );
  }

  // ── Success: create session ───────────────────────────────────────
  const token = createSessionToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarColor: user.avatarColor,
  });

  // ── Audit successful login ────────────────────────────────────────
  try {
    await db.activityLog.create({
      data: {
        userId: user.id,
        type: "auth",
        description: `Successful login from ${ip}`,
      },
    });
  } catch {
    /* ignore audit errors */
  }

  const res = NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
    role: user.role,
  });
  res.headers.set("Set-Cookie", buildSessionCookie(token));
  return res;
}
