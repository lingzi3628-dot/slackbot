import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { validatePassword, sanitizeString } from "@/lib/input-validation";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";
import { revokeAllUserSessions } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ResetBody {
  token?: string;
  password?: string;
}

/**
 * Reset password — validate token + set new password.
 *
 * Hardening (round 3):
 *  - Strong password policy (12+ chars, complexity, common-password check).
 *  - bcrypt cost 12.
 *  - Rate limited: 5 attempts per IP per 15 min.
 *  - Token sanitized (strip null bytes).
 *  - Revokes ALL existing sessions for the user after password change.
 *  - Error handler: never leaks internals.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // ── Rate limit: 5 per IP per 15 min ────────────────────────────────
    const rl = await checkRateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      const mins = Math.ceil((rl.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many reset attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(rl) }
      );
    }

    const { token: rawToken, password } = (await req.json()) as ResetBody;
    const token = sanitizeString(rawToken, 100);

    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400, headers: buildRateLimitHeaders(rl) });
    }

    // ── Strong password validation ─────────────────────────────────────
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.errors.join(". ") },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── Find user by reset token (not expired) ─────────────────────────
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400, headers: buildRateLimitHeaders(rl) });
    }

    // ── Hash + update password (bcrypt cost 12) ────────────────────────
    const hashed = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // ── Revoke ALL existing sessions (force re-login everywhere) ────────
    await revokeAllUserSessions(user.id);

    return NextResponse.json({ ok: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    return handleApiError(err, "POST /api/auth/reset-password");
  }
}
