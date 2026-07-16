import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSessionToken, buildSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface GoogleAuthBody {
  email: string;
  name: string;
  uid: string;
  photoUrl?: string;
}

/**
 * Google Sign-In endpoint.
 * Receives the Firebase user data (email, name, uid) after the client
 * signs in with Google. Creates or finds the user in Neon DB, then sets
 * a session cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name, uid } = (await req.json()) as GoogleAuthBody;

    if (!email?.trim() || !name?.trim()) {
      return NextResponse.json({ error: "Missing Google account data" }, { status: 400 });
    }

    // Check if user exists.
    let user = await db.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      // Create a new user with a random password (Google users don't need one).
      const colors = ["#ff7a1a", "#e8421b", "#ff9a3c", "#ffd27a"];
      user = await db.user.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase(),
          password: `google-${uid}-${Date.now()}`, // Placeholder (not used for Google users)
          avatarColor: colors[Math.floor(Math.random() * colors.length)],
          role: "user",
        },
      });
    }

    // Create session + set cookie.
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
      avatarColor: user.avatarColor,
      role: user.role,
    });
    res.headers.set("Set-Cookie", buildSessionCookie(token));
    return res;
  } catch (err) {
    console.error("[google-auth] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Google sign-in failed" },
      { status: 500 }
    );
  }
}
