import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check — admin-only. Returns ONLY { status, timestamp }.
 *
 * V1 FIX: Previously this endpoint leaked the existence of every env var
 * (DATABASE_URL, GMAIL_USER, GMAIL_APP_PASSWORD, FIREBASE_API_KEY) in the
 * response body. That's an information-disclosure vulnerability — attackers
 * could enumerate which secrets to target.
 *
 * Now: requires admin session, returns no env details whatsoever.
 * Public unauthenticated requests get a 401 with no info.
 */
export async function GET(req: NextRequest) {
  // ── Auth check: admin-only ─────────────────────────────────────────
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json(
      { status: "unauthorized" },
      { status: 401 }
    );
  }

  // ── Public (admin-visible) response — no env details ──────────────
  const base = {
    status: "ok" as "ok" | "degraded" | "down",
    timestamp: new Date().toISOString(),
  };

  // ── Optional: quick DB ping (admin only, no counts or details) ────
  try {
    const { db } = await import("@/lib/db");
    // A trivial query — just checks the connection is alive.
    await db.$queryRaw`SELECT 1`;
    base.status = "ok";
  } catch {
    base.status = "degraded";
  }

  return NextResponse.json(base);
}
