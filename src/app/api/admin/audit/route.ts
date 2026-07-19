import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = [
  "user.verify", "user.unverify", "user.suspend", "user.unsuspend",
  "user.ban", "user.unban", "user.promote_admin",
  "feature.create", "feature.update", "feature.toggle", "feature.delete",
  "announcement.send", "announcement.update", "announcement.delete",
  "auth.login", "auth.logout", "auth.failed",
  "system.*",
];

function rangeToWhere(range: string): { gte?: Date } {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { gte: start };
  }
  if (range === "7d") {
    return { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  }
  if (range === "30d") {
    return { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
  }
  return {};
}

/** GET /api/admin/audit — list audit logs with filters + pagination */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "audit.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const admin = (searchParams.get("admin") || "").trim();
  const action = (searchParams.get("action") || "").trim();
  const result = (searchParams.get("result") || "").trim();
  const range = searchParams.get("range") || "all";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 200);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10) || 0, 0);

  const where: any = {};

  if (result === "success" || result === "failed") {
    where.result = result;
  }

  const createdAt = rangeToWhere(range);
  if (createdAt.gte) where.createdAt = createdAt;

  if (action && action !== "all") {
    if (action.endsWith(".*")) {
      const prefix = action.slice(0, -2);
      where.action = { startsWith: prefix + "." };
    } else {
      where.action = action;
    }
  }

  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { target: { contains: search, mode: "insensitive" } },
      { targetType: { contains: search, mode: "insensitive" } },
      { ipAddress: { contains: search, mode: "insensitive" } },
      { admin: { name: { contains: search, mode: "insensitive" } } },
      { admin: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (admin && admin !== search) {
    // additional admin filter (separate from search)
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          { admin: { name: { contains: admin, mode: "insensitive" } } },
          { admin: { email: { contains: admin, mode: "insensitive" } } },
        ],
      },
    ];
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { name: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return NextResponse.json({ logs, total, limit, offset, actions: ACTIONS });
}
