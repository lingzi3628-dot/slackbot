import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["spam", "abuse", "prompt_injection", "malicious_upload", "rate_limit"];
const VALID_STATUSES = ["pending", "reviewing", "resolved", "dismissed"];

/** GET /api/admin/reports — list content reports with filters & enriched user info. */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "moderation.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";
  const range = searchParams.get("range") || "all";

  const where: any = {};
  if (search) {
    where.content = { contains: search, mode: "insensitive" };
  }
  if (type && VALID_TYPES.includes(type)) where.type = type;
  if (status && VALID_STATUSES.includes(status)) where.status = status;

  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    where.createdAt = { gte: start };
  } else if (range === "7d") {
    where.createdAt = { gte: new Date(now.getTime() - 7 * 86_400_000) };
  } else if (range === "30d") {
    where.createdAt = { gte: new Date(now.getTime() - 30 * 86_400_000) };
  }

  const reports = await db.contentReport.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Resolve reported users + reporters in a single round-trip each.
  const reportedIds = Array.from(
    new Set(reports.map((r) => r.reportedUserId).filter(Boolean)),
  ) as string[];
  const reporterIds = Array.from(
    new Set(reports.map((r) => r.reporterId).filter(Boolean)),
  ) as string[];

  const [reportedUsers, reporterUsers] = await Promise.all([
    reportedIds.length
      ? db.user.findMany({
          where: { id: { in: reportedIds } },
          select: { id: true, name: true, email: true, plan: true, role: true },
        })
      : Promise.resolve([]),
    reporterIds.length
      ? db.user.findMany({
          where: { id: { in: reporterIds } },
          select: { id: true, name: true, email: true },
        })
      : Promise.resolve([]),
  ]);

  const reportedMap = new Map(reportedUsers.map((u) => [u.id, u]));
  const reporterMap = new Map(reporterUsers.map((u) => [u.id, u]));

  const enriched = reports.map((r) => ({
    ...r,
    reportedUser: r.reportedUserId ? reportedMap.get(r.reportedUserId) || null : null,
    reporter: r.reporterId ? reporterMap.get(r.reporterId) || null : null,
  }));

  return NextResponse.json({ reports: enriched });
}
