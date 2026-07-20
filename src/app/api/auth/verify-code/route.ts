import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession, buildSessionCookie } from "@/lib/session";
import { validateEmail, sanitizeString } from "@/lib/input-validation";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verify the 6-digit email code. If valid, create a DB-backed session
 * and return the user data.
 *
 * Hardening (round 3):
 *  - Rate limited: 10 attempts per IP per 15 minutes.
 *  - Input validated + sanitized.
 *  - Uses DB-backed session (createSession async).
 *  - Generic error messages (no enumeration).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // ── Rate limit: 10 per IP per 15 min ──────────────────────────────
    const rl = await checkRateLimit(`verify-code:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      const mins = Math.ceil((rl.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many verification attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(rl) }
      );
    }

    const { email: rawEmail, code: rawCode } = await req.json();
    const email = validateEmail(rawEmail);
    const code = sanitizeString(rawCode, 10);

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400, headers: buildRateLimitHeaders(rl) });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Generic error — don't reveal whether the email exists
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400, headers: buildRateLimitHeaders(rl) });
    }

    // Check the code + expiry
    if (user.resetToken !== code || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400, headers: buildRateLimitHeaders(rl) });
    }

    // Clear the code + mark verified
    await db.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null, verified: true },
    });

    // ── Create DB-backed session ───────────────────────────────────────
    const cookieValue = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    }, req);

    const res = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
      verified: true,
    });
    res.headers.set("Set-Cookie", buildSessionCookie(cookieValue));
    return res;
  } catch (err) {
    return handleApiError(err, "POST /api/auth/verify-code");
  }
}
