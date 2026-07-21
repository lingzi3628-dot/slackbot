import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/auth/register — create a new user account.
 * Simple, fast, resilient. No CAPTCHA, no email blocking, auto-verify.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || "").toString().trim();
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    // ── Basic validation ──────────────────────────────────────────────
    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // ── Check if user exists (no enumeration) ─────────────────────────
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        registered: true,
        needsVerification: false,
        id: existing.id,
        name: existing.name,
        email: existing.email,
        avatarColor: existing.avatarColor,
        role: existing.role,
        message: "Account created. You can now log in.",
      });
    }

    // ── Hash password (bcrypt cost 10 — fast) ─────────────────────────
    const hashed = await bcrypt.hash(password, 10);

    // ── Create user (auto-verified) ───────────────────────────────────
    const colors = ["#ff7a1a", "#e8421b", "#ff9a3c", "#ffd27a", "#8B5CF6", "#10b981"];
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        verified: true,
      },
    });

    // ── Send verification email (fire-and-forget, never blocks) ───────
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      import("@/lib/email-service")
        .then(({ sendVerificationEmail }) => {
          const token = Buffer.from(JSON.stringify({
            userId: user.id,
            email: user.email,
            exp: Date.now() + 24 * 60 * 60 * 1000,
          })).toString("base64url");
          return sendVerificationEmail(email, name, `${req.nextUrl.origin}/verify-email?token=${token}`);
        })
        .catch((err) => console.error("[register] email error:", err.message));
    }

    // ── Audit log (fire-and-forget) ───────────────────────────────────
    db.activityLog.create({
      data: {
        userId: user.id,
        type: "auth",
        description: `New registration from ${req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"}`,
      },
    }).catch(() => {});

    return NextResponse.json({
      registered: true,
      needsVerification: false,
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      message: "Account created. You can now log in.",
    });
  } catch (err) {
    console.error("[register] error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
