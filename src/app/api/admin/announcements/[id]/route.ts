import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["info", "maintenance", "feature", "security", "welcome"];
const VALID_PLANS = ["", "free", "pro", "plus", "ultra", "business", "enterprise"];

/** PATCH /api/admin/announcements/[id] — update an existing announcement. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "announcements.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const {
    title,
    message,
    type,
    targetPlan,
    targetWorkspace,
    scheduledFor,
    published,
  } = body as {
    title?: string;
    message?: string;
    type?: string;
    targetPlan?: string | null;
    targetWorkspace?: string | null;
    scheduledFor?: string | null;
    published?: boolean;
  };

  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  const update: any = {};
  if (typeof title === "string" && title.trim()) update.title = title.trim();
  if (typeof message === "string" && message.trim()) update.message = message.trim();
  if (typeof type === "string" && VALID_TYPES.includes(type)) update.type = type;
  if (targetPlan !== undefined) {
    update.targetPlan =
      targetPlan === null || targetPlan === "" || !VALID_PLANS.includes(targetPlan)
        ? null
        : targetPlan;
  }
  if (targetWorkspace !== undefined) {
    update.targetWorkspace =
      targetWorkspace === null || !String(targetWorkspace).trim()
        ? null
        : String(targetWorkspace).trim();
  }
  if (scheduledFor !== undefined) {
    update.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
  }
  if (typeof published === "boolean") update.published = published;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, announcement: existing, noop: true });
  }

  const announcement = await db.announcement.update({ where: { id }, data: update });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "announcement.update",
      target: id,
      targetType: "announcement",
      result: "success",
      metadata: {
        changes: update,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, announcement });
}

/** DELETE /api/admin/announcements/[id] — permanently delete an announcement. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "announcements.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await db.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  await db.announcement.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "announcement.delete",
      target: id,
      targetType: "announcement",
      result: "success",
      metadata: { title: existing.title, type: existing.type },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true });
}
