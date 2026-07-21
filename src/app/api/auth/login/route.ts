import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createSession, buildSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/auth/login — sign in with email + password.
 * Simple, fast, resilient. Works for old users (6-char passwords) and new.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // ── Look up user ──────────────────────────────────────────────────
    const user = await db.user.findUnique({ where: { email } });

    // Dummy hash for constant-time comparison (prevents timing attacks)
    const dummyHash = "$2a$10$000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const hashToCompare = user?.password || dummyHash;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // ── Auto-verify if not verified (graceful degradation) ────────────
    if (!user.verified) {
      db.user.update({
        where: { id: user.id },
        data: { verified: true },
      }).catch(() => {});
    }

    // ── Create DB-backed session ──────────────────────────────────────
    const cookieValue = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    }, req);

    // ── Audit log (fire-and-forget) ───────────────────────────────────
    db.activityLog.create({
      data: {
        userId: user.id,
        type: "auth",
        description: `Successful login from ${req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"}`,
      },
    }).catch(() => {});

    const res = NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
    });
    res.headers.set("Set-Cookie", buildSessionCookie(cookieValue));
    return res;
  } catch (err) {
    console.error("[login] error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
