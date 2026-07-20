import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { validatePassword, sanitizeString } from "@/lib/input-validation";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/error-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ResetBody {
  token?: string;
  password?: unknown;
}

/**
 * Reset password — validate token + set new password.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  try {
    // ── Rate limit ─────────────────────────────────────────────────────
    const rl = await checkRateLimit(`reset-password:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      const mins = Math.ceil((rl.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Too many reset attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────
    let body: ResetBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    const rawToken = body.token;
    const password = typeof body.password === "string" ? body.password : "";

    if (!rawToken || typeof rawToken !== "string") {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    const token = sanitizeString(rawToken, 200);
    if (!token) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── Validate password ──────────────────────────────────────────────
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      return NextResponse.json(
        { error: pwCheck.errors.join(". ") },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── Find user by reset token ───────────────────────────────────────
    let user;
    try {
      user = await db.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpiry: { gt: new Date() },
        },
      });
    } catch (dbErr) {
      console.error("[reset-password] DB error finding user:", dbErr);
      return handleApiError(dbErr, "POST /api/auth/reset-password (findFirst)");
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new reset link." },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── Hash new password (bcrypt cost 12) ─────────────────────────────
    let hashed: string;
    try {
      hashed = await bcrypt.hash(password, 12);
    } catch (hashErr) {
      console.error("[reset-password] bcrypt error:", hashErr);
      return handleApiError(hashErr, "POST /api/auth/reset-password (bcrypt)");
    }

    // ── Update password + clear reset token ────────────────────────────
    try {
      await db.user.update({
        where: { id: user.id },
        data: {
          password: hashed,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    } catch (updateErr) {
      console.error("[reset-password] DB error updating password:", updateErr);
      return handleApiError(updateErr, "POST /api/auth/reset-password (update)");
    }

    // ── Revoke all sessions (best-effort, non-fatal) ───────────────────
    try {
      await db.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }).catch(() => {});
    } catch {
      // Session table might not exist or might be empty — ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (err) {
    console.error("[reset-password] FATAL:", err);
    return handleApiError(err, "POST /api/auth/reset-password");
  }
}
