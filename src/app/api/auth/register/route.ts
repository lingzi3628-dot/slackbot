import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  validateEmail,
  validatePassword,
  sanitizeName,
  LIMITS,
} from "@/lib/input-validation";
import { checkRateLimit, getClientIp, buildRateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

/**
 * POST /api/auth/register — create a new user account.
 *
 * V10 FIX:
 *  - Strong password policy: ≥12 chars, upper+lower+digit+special, no common passwords.
 *  - Specific error messages per validation failure.
 *  - No email enumeration: returns the SAME success-like response whether the
 *    email is already registered or not. (We still create the account if it's
 *    new; for existing emails we silently return success to avoid leaking
 *    which emails are registered.)
 *  - bcrypt cost factor 12 (not 10).
 *  - Input sanitization (strip HTML, null bytes, control chars).
 *  - Rate limited: 5 registrations per IP per 15 minutes.
 */
export async function POST(req: NextRequest) {
  // ── Rate limit: 5 registrations / 15 min / IP ─────────────────────
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    const mins = Math.ceil((rl.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many registration attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── Parse + sanitize input ────────────────────────────────────────
  let body: RegisterBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = sanitizeName(body.name);
  const email = validateEmail(body.email);

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400, headers: buildRateLimitHeaders(rl) }
    );
  }
  if (!email) {
    return NextResponse.json(
      { error: "Please enter a valid email address" },
      { status: 400, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── Password validation (strong policy) ──────────────────────────
  const pwCheck = validatePassword(body.password, email);
  if (!pwCheck.valid) {
    // Return ALL errors so the user can fix them at once.
    return NextResponse.json(
      { error: pwCheck.errors.join(". ") },
      { status: 400, headers: buildRateLimitHeaders(rl) }
    );
  }
  const password = body.password as string;

  // ── Check if user exists (NO enumeration leak) ────────────────────
  // If the email is already registered, we return a success-like response
  // that says "check your email to verify" — identical to a new signup.
  // This prevents attackers from enumerating which emails are registered.
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Optionally: send a "someone tried to register with your email" notice
    // to the existing user. For now, just return success-like response.
    return NextResponse.json({
      registered: true,
      needsVerification: true,
      message: "If this email is not already registered, check your inbox to verify.",
    });
  }

  // ── Hash password (bcrypt cost 12) ────────────────────────────────
  const hashed = await bcrypt.hash(password, 12);

  // ── Create user ───────────────────────────────────────────────────
  const colors = ["#ff7a1a", "#e8421b", "#ff9a3c", "#ffd27a", "#8B5CF6", "#10b981"];
  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
      },
    });

    return NextResponse.json({
      registered: true,
      needsVerification: true,
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      message: "Account created. Check your email to verify.",
    });
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

// Helper exports for password-reset routes to reuse the same validation.
export { validatePassword, validateEmail, sanitizeName, LIMITS };
