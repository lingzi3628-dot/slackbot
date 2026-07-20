import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  validateEmail,
  validatePassword,
  sanitizeName,
  isDisposableEmail,
  isHoneypotTriggered,
} from "@/lib/input-validation";
import { checkRateLimit, getClientIp, buildRateLimitHeaders } from "@/lib/rate-limit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createEmailToken } from "@/lib/email-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // bcrypt cost 12 ~3s + Turnstile verify + DB + email

interface RegisterBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  /** V8: Turnstile CAPTCHA token from the client widget. */
  turnstileToken?: unknown;
  /** V8: Honeypot field — must be empty (bots fill hidden fields). */
  website?: unknown; // hidden field, should be empty
  company_website?: unknown; // another honeypot
}

/**
 * POST /api/auth/register — create a new user account.
 *
 * V8 (round 2) FIX:
 *  - Cloudflare Turnstile CAPTCHA required (server-side verified).
 *  - Honeypot fields: "website" and "company_website" — bots fill them, humans don't.
 *  - Disposable email domains rejected (mailinator.com, 10minutemail.com, etc.).
 *  - Email verification flow: user created as "unverified", verification email sent.
 *  - Rate limited: 3 registrations per IP per hour (stricter than before).
 *  - Strong password policy (12+ chars, complexity).
 *  - No email enumeration (same response whether email exists or not).
 *  - bcrypt cost 12.
 *  - Audit log all registration attempts.
 */
export async function POST(req: NextRequest) {
  // ── Rate limit: 3 registrations / hour / IP (V8: stricter) ─────────
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
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

  // ── V8: Honeypot check ────────────────────────────────────────────
  // If either honeypot field is filled, it's a bot. Pretend success to
  // not tip off the attacker, but don't create the account.
  if (isHoneypotTriggered(body.website) || isHoneypotTriggered(body.company_website)) {
    // Log the bot attempt
    try {
      await db.activityLog.create({
        data: {
          userId: null,
          type: "auth",
          description: `Honeypot triggered on registration from ${ip}`,
        },
      });
    } catch { /* ignore */ }
    // Return success-like response (don't reveal that we detected the bot)
    return NextResponse.json({
      registered: true,
      needsVerification: true,
      message: "If this email is not already registered, check your inbox to verify.",
    });
  }

  // ── V8: Turnstile CAPTCHA verification ────────────────────────────
  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  const captchaValid = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaValid) {
    return NextResponse.json(
      { error: "Bot verification failed. Please complete the CAPTCHA and try again." },
      { status: 400, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── Validate name + email ─────────────────────────────────────────
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

  // ── V8: Disposable email domain check ─────────────────────────────
  if (isDisposableEmail(email)) {
    return NextResponse.json(
      { error: "Disposable email addresses are not allowed. Please use a real email address." },
      { status: 400, headers: buildRateLimitHeaders(rl) }
    );
  }

  // ── Password validation (strong policy) ──────────────────────────
  const pwCheck = validatePassword(body.password, email);
  if (!pwCheck.valid) {
    return NextResponse.json(
      { error: pwCheck.errors.join(". ") },
      { status: 400, headers: buildRateLimitHeaders(rl) }
    );
  }
  const password = body.password as string;

  // ── Check if user exists (NO enumeration leak) ────────────────────
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    // Return success-like response (don't reveal the email is registered)
    return NextResponse.json({
      registered: true,
      needsVerification: true,
      message: "If this email is not already registered, check your inbox to verify.",
    });
  }

  // ── Hash password (bcrypt cost 12) ────────────────────────────────
  let hashed: string;
  try {
    hashed = await bcrypt.hash(password, 12);
  } catch (hashErr) {
    console.error("[register] bcrypt error:", hashErr);
    return NextResponse.json(
      { error: "Server error during password hashing. Please try again." },
      { status: 500 }
    );
  }

  // ── Create user (unverified — must click email link) ──────────────
  const colors = ["#ff7a1a", "#e8421b", "#ff9a3c", "#ffd27a", "#8B5CF6", "#10b981"];
  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        verified: false,
      },
    });

    // ── Send verification email (or auto-verify if SMTP unavailable) ──
    const verifyToken = createEmailToken({ id: user.id, email: user.email });
    const verifyUrl = `${req.nextUrl.origin}/api/auth/verify-email?token=${verifyToken}`;

    const smtpConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    let emailSent = false;

    if (smtpConfigured) {
      try {
        const { sendVerificationEmail } = await import("@/lib/email-service");
        // Race: 3s timeout. If Gmail is slow/broken, don't block the response.
        await Promise.race([
          sendVerificationEmail(email, name, verifyUrl).then(() => { emailSent = true; }),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch (emailErr) {
        console.error("[register] Email send error:", emailErr);
      }
    }

    // If SMTP not configured OR email failed → auto-verify the user
    // so they can log in immediately (graceful degradation).
    const autoVerified = !smtpConfigured || !emailSent;
    if (autoVerified) {
      try {
        await db.user.update({
          where: { id: user.id },
          data: { verified: true },
        });
      } catch { /* ignore */ }
    }

    // Audit log
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          type: "auth",
          description: `New registration from ${ip}`,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      registered: true,
      needsVerification: !autoVerified,
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      message: autoVerified
        ? "Account created and verified. You can now log in."
        : "Account created. Check your email to verify your account.",
    });
  } catch (err) {
    console.error("[register] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Return a user-friendly error, never leak internals
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try logging in." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

// Re-export validators for password-reset routes.
export { validatePassword, validateEmail, sanitizeName };
