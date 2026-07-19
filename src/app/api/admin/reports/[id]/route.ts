import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = ["pending", "reviewing", "resolved", "dismissed"];
const VALID_ACTIONS = ["warn", "suspend", "ban", "delete", "none"];

/**
 * PATCH /api/admin/reports/[id] — update a report's status / action / notes.
 * When the action is `ban` or `suspend`, the reported user's `role` field is
 * also updated so the rest of the app can enforce the suspension. Both
 * successful and no-op updates are audit-logged.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "moderation.act")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, action, notes } = body as {
    status?: string;
    action?: string;
    notes?: string;
  };

  const existing = await db.contentReport.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const update: any = {};
  if (status && VALID_STATUSES.includes(status)) update.status = status;
  if (action && VALID_ACTIONS.includes(action)) update.action = action;
  if (typeof notes === "string") update.notes = notes.trim() || null;

  // Closing states stamp `resolvedAt`.
  if (status === "resolved" || status === "dismissed") {
    update.resolvedAt = new Date();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, report: existing, noop: true });
  }

  const report = await db.contentReport.update({ where: { id }, data: update });

  // Side-effects on the reported user.
  let userAffected: { id: string; role: string } | null = null;
  if (report.reportedUserId) {
    if (action === "ban") {
      userAffected = await db.user.update({
        where: { id: report.reportedUserId },
        data: { role: "banned" },
        select: { id: true, role: true },
      });
    } else if (action === "suspend") {
      userAffected = await db.user.update({
        where: { id: report.reportedUserId },
        data: { role: "suspended" },
        select: { id: true, role: true },
      });
    }
  }

  const auditAction =
    status === "dismissed" ? "report.dismiss" : action ? `report.${action}` : "report.update";

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: auditAction,
      target: id,
      targetType: "report",
      result: "success",
      metadata: {
        status: report.status,
        action: report.action,
        notes: report.notes,
        reportedUserId: report.reportedUserId,
        userAffected: userAffected ? { id: userAffected.id, role: userAffected.role } : null,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, report });
}
