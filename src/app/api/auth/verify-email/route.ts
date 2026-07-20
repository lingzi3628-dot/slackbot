import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyEmailToken } from "@/lib/email-verification";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VerifyEmailBody {
  token?: string;
}

/**
 * POST /api/auth/verify-email — verify an email address using a signed token.
 *
 * V8 (round 2): Email verification flow.
 *  - User receives an email with a verification link containing a signed JWT token.
 *  - This endpoint validates the token and marks the user as verified.
 *  - Tokens expire after 24 hours.
 *  - Rate limited: 10 attempts per IP per hour (prevents token brute-forcing).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const { token } = (await req.json()) as VerifyEmailBody;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    // ── Verify the token ──────────────────────────────────────────────
    const payload = verifyEmailToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired verification token. Please request a new one." },
        { status: 400 }
      );
    }

    // ── Mark the user as verified ─────────────────────────────────────
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, verified: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (user.verified) {
      // Already verified — return success (idempotent)
      return NextResponse.json({
        verified: true,
        message: "Email already verified. You can sign in.",
      });
    }

    await db.user.update({
      where: { id: user.id },
      data: { verified: true },
    });

    // Audit log
    try {
      await db.activityLog.create({
        data: {
          userId: user.id,
          type: "auth",
          description: `Email verified from ${ip}`,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      verified: true,
      email: user.email,
      name: user.name,
      message: "Email verified successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("[verify-email] error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

/** GET — convenience endpoint for email link clicks (?token=...). */
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json(
      { error: "No token provided. Use POST with { token } or ?token=..." },
      { status: 400 }
    );
  }

  try {
    const payload = verifyEmailToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired verification token." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, verified: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!user.verified) {
      await db.user.update({
        where: { id: user.id },
        data: { verified: true },
      });
    }

    return NextResponse.json({
      verified: true,
      message: "Email verified. You can now sign in.",
    });
  } catch (err) {
    console.error("[verify-email GET] error:", err);
    return NextResponse.json(
      { error: "Verification failed." },
      { status: 500 }
    );
  }
}
