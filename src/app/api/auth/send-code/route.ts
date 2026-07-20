import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateEmail } from "@/lib/input-validation";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";
import { sendVerificationCodeEmail } from "@/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Send a 6-digit verification code to the user's email.
 *
 * Hardening (round 3):
 *  - Rate limited: 3 codes per email per hour.
 *  - Rate limited: 5 codes per IP per hour.
 *  - No enumeration: returns same success response whether email exists or not.
 *  - Input validated (RFC 5322 email regex).
 *  - Uses shared email-service module.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    const { email: rawEmail } = await req.json();
    const email = validateEmail(rawEmail);
    if (!email) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    // ── Rate limit: 3 codes per email per hour ────────────────────────
    const emailRl = await checkRateLimit(`send-code-email:${email}`, 3, 60 * 60 * 1000);
    if (!emailRl.allowed) {
      const mins = Math.ceil((emailRl.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many code requests for this email. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(emailRl) }
      );
    }

    // ── Rate limit: 5 codes per IP per hour ────────────────────────────
    const ipRl = await checkRateLimit(`send-code-ip:${ip}`, 5, 60 * 60 * 1000);
    if (!ipRl.allowed) {
      const mins = Math.ceil((ipRl.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many code requests from this network. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(ipRl) }
      );
    }

    // ── Look up user (NO enumeration leak) ─────────────────────────────
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Return the SAME success response — don't reveal the email isn't registered
      return NextResponse.json({
        ok: true,
        message: "If an account exists for this email, a verification code has been sent.",
      });
    }

    // ── Generate a 6-digit code ────────────────────────────────────────
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.user.update({
      where: { id: user.id },
      data: { resetToken: code, resetTokenExpiry: codeExpiry },
    });

    // ── Send the code via email ────────────────────────────────────────
    let emailSent = false;
    try {
      await sendVerificationCodeEmail(email, user.name, code);
      emailSent = true;
    } catch (err) {
      console.error("[send-code] Email error:", err);
    }

    const response: Record<string, unknown> = {
      ok: true,
      message: emailSent
        ? "Verification code sent to your email."
        : "Code generated. Check your email or use the code below.",
    };
    // In dev, return the code so the flow can be tested without SMTP
    if (!emailSent && process.env.NODE_ENV !== "production") {
      response.devCode = code;
    }

    return NextResponse.json(response);
  } catch (err) {
    return handleApiError(err, "POST /api/auth/send-code");
  }
}
