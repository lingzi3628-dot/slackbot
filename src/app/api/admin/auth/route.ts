import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, clearAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/auth — check if admin is authenticated.
 *  Pass ?includeAdmins=1 to also get a list of active admins (for assignee dropdowns). */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const includeAdmins = searchParams.get("includeAdmins") === "1";

  if (includeAdmins && hasPermission(session.role, "support.*")) {
    const admins = await db.admin.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ authenticated: true, ...session, admins });
  }

  return NextResponse.json({ authenticated: true, ...session });
}

/** POST /api/admin/auth — logout */
export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
