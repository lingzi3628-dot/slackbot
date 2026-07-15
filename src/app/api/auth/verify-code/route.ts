import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, buildSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Verify the 6-digit email code. If valid, set a session cookie
 * and return the user data → frontend redirects to dashboard.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "No account found" }, { status: 404 });
    }

    // Check the code + expiry.
    if (user.resetToken !== code || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    // Clear the code + create session.
    await db.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    });

    const res = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
      verified: true,
    });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch {
    return NextResponse.json(
      { error: "Verification failed. Database may not be configured." },
      { status: 500 }
    );
  }
}
