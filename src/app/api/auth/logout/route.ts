import { NextRequest, NextResponse } from "next/server";
import { getSession, revokeSession, clearSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Logout — revoke the DB session + clear the cookie.
 * #6 (hardening): DB-stored sessions are revoked (not just cookie-cleared).
 */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (session) {
    await revokeSession(session.id); // revoke in DB
  }
  const res = NextResponse.json({ ok: true, message: "Logged out" });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
