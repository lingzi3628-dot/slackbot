import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEmail } from "@/lib/input-validation";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";
import { sendPasswordResetEmail } from "@/lib/email-service";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Forgot password — generate a reset token and email it.
 *
 * Hardening (round 3):
 *  - Rate limited: 3 requests per email per hour.
 *  - Rate limited: 5 requests per IP per hour.
 *  - NO enumeration: always returns the same success message whether
 *    the email exists or not.
 *  - Reset token: crypto.randomBytes(32) (not Math.random).
 *  - Uses shared email-service module.
 *  - Input validated (RFC 5322 email regex).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    const { email: rawEmail } = await req.json();
    const email = validateEmail(rawEmail);
    if (!email) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    // ── Rate limit: 3 per email per hour ──────────────────────────────
    const emailRl = await checkRateLimit(`forgot-email:${email}`, 3, 60 * 60 * 1000);
    if (!emailRl.allowed) {
      // Return the SAME success message (no enumeration)
      return NextResponse.json({
        ok: true,
        message: "If an account exists, a reset link has been sent to your email.",
      });
    }

    // ── Rate limit: 5 per IP per hour ──────────────────────────────────
    const ipRl = await checkRateLimit(`forgot-ip:${ip}`, 5, 60 * 60 * 1000);
    if (!ipRl.allowed) {
      return NextResponse.json({
        ok: true,
        message: "If an account exists, a reset link has been sent to your email.",
      });
    }

    // ── Look up user (NO enumeration leak) ─────────────────────────────
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      // Generate a cryptographically secure reset token
      const resetToken = randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry: expiry },
      });

      // Send the reset email
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.get("host") || "slackbot-seven.vercel.app"}`;
      const resetUrl = `${appUrl}/?reset=${resetToken}`;

      try {
        await sendPasswordResetEmail(email, user.name, resetUrl);
      } catch (err) {
        console.error("[forgot-password] Email error:", err);
        // Don't reveal the error — return the same success message
      }
    }

    // ── Always return the SAME response (no enumeration) ───────────────
    return NextResponse.json({
      ok: true,
      message: "If an account exists, a reset link has been sent to your email.",
    });
  } catch (err) {
    return handleApiError(err, "POST /api/auth/forgot-password");
  }
}
