import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Clear the session cookie → logs the user out. */
export async function POST() {
  const res = NextResponse.json({ ok: true, message: "Logged out" });
  res.headers.set("Set-Cookie", clearSessionCookie());
  return res;
}
