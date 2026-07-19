import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TYPES = ["info", "maintenance", "feature", "security", "welcome"];
const VALID_PLANS = ["", "free", "pro", "plus", "ultra", "business", "enterprise"];

/** GET /api/admin/announcements — list announcements with optional filters. */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "announcements.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const type = searchParams.get("type") || "";
  const status = searchParams.get("status") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { message: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type && VALID_TYPES.includes(type)) where.type = type;

  const now = new Date();
  if (status === "published") {
    where.published = true;
  } else if (status === "draft") {
    where.published = false;
    where.scheduledFor = null;
  } else if (status === "scheduled") {
    where.published = false;
    where.scheduledFor = { gt: now };
  }

  const announcements = await db.announcement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ announcements });
}

/** POST /api/admin/announcements — create a new announcement. */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "announcements.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

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
    targetPlan?: string;
    targetWorkspace?: string;
    scheduledFor?: string;
    published?: boolean;
  };

  if (!title || !title.trim() || !message || !message.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  const safeType = type && VALID_TYPES.includes(type) ? type : "info";
  const safePlan =
    targetPlan === undefined || targetPlan === "" || targetPlan === null
      ? null
      : VALID_PLANS.includes(targetPlan)
        ? targetPlan
        : null;
  const safeWorkspace =
    targetWorkspace && String(targetWorkspace).trim()
      ? String(targetWorkspace).trim()
      : null;
  const safeScheduled = scheduledFor ? new Date(scheduledFor) : null;
  // A scheduled-for date in the future means the announcement is queued, not
  // immediately visible. The `published` flag still has to be set explicitly
  // when the scheduler runs.
  const isPublished = !!published && !safeScheduled;

  const announcement = await db.announcement.create({
    data: {
      title: title.trim(),
      message: message.trim(),
      type: safeType,
      targetPlan: safePlan,
      targetWorkspace: safeWorkspace,
      scheduledFor: safeScheduled,
      published: isPublished,
    },
  });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "announcement.create",
      target: announcement.id,
      targetType: "announcement",
      result: "success",
      metadata: {
        title: announcement.title,
        type: safeType,
        targetPlan: safePlan,
        targetWorkspace: safeWorkspace,
        scheduledFor: safeScheduled ? safeScheduled.toISOString() : null,
        published: isPublished,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ announcement });
}
