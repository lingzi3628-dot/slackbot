import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/audit — list audit logs */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const logs = await db.auditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { admin: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ logs });
}
