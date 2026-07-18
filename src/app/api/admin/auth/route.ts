import { NextResponse } from "next/server";
import { getAdminSession, clearAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/auth — check if admin is authenticated */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, ...session });
}

/** POST /api/admin/auth — logout */
export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
