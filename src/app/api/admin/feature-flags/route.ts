import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/feature-flags — list all feature flags */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await db.featureFlag.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ flags });
}

/** PATCH /api/admin/feature-flags — toggle a flag */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "feature_flags.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, enabled } = await req.json();

  const flag = await db.featureFlag.update({
    where: { id },
    data: { enabled },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: `feature.toggle`,
      target: id,
      targetType: "feature",
      metadata: { key: flag.key, enabled },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, flag });
}
