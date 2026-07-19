import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PLANS = new Set(["", "free", "pro", "plus", "ultra", "business", "enterprise"]);

/** GET /api/admin/feature-flags — list all feature flags */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const flags = await db.featureFlag.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ flags });
}

/** POST /api/admin/feature-flags — create a new flag */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "feature_flags.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const key = (typeof body.key === "string" ? body.key : "").trim();
  const name = (typeof body.name === "string" ? body.name : "").trim();
  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  const rolloutPctRaw = Number(body.rolloutPct);
  const rolloutPct = Number.isFinite(rolloutPctRaw)
    ? Math.max(0, Math.min(100, Math.round(rolloutPctRaw)))
    : 100;
  const planRequiredRaw =
    typeof body.planRequired === "string" ? body.planRequired.trim() : "";
  const planRequired = VALID_PLANS.has(planRequiredRaw)
    ? planRequiredRaw || null
    : null;
  const enabled = body.enabled !== false; // default true

  if (!key || !name) {
    return NextResponse.json(
      { error: "key and name are required" },
      { status: 400 },
    );
  }
  if (!/^[a-zA-Z0-9_.\-]+$/.test(key)) {
    return NextResponse.json(
      { error: "key may only contain letters, numbers, dots, dashes, underscores" },
      { status: 400 },
    );
  }

  const existing = await db.featureFlag.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json(
      { error: "A flag with that key already exists" },
      { status: 409 },
    );
  }

  const flag = await db.featureFlag.create({
    data: { key, name, description, enabled, rolloutPct, planRequired },
  });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "feature.create",
      target: flag.id,
      targetType: "feature",
      result: "success",
      metadata: {
        key: flag.key,
        name: flag.name,
        enabled: flag.enabled,
        rolloutPct: flag.rolloutPct,
        planRequired: flag.planRequired,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, flag });
}

/** PUT /api/admin/feature-flags — update name/description/rolloutPct/planRequired */
export async function PUT(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "feature_flags.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.description === "string") {
    data.description = body.description.trim() || null;
  }
  if (body.rolloutPct !== undefined) {
    const pct = Number(body.rolloutPct);
    if (Number.isFinite(pct)) {
      data.rolloutPct = Math.max(0, Math.min(100, Math.round(pct)));
    }
  }
  if (body.planRequired !== undefined) {
    const plan = typeof body.planRequired === "string" ? body.planRequired.trim() : "";
    if (VALID_PLANS.has(plan)) {
      data.planRequired = plan || null;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let flag;
  try {
    flag = await db.featureFlag.update({ where: { id }, data });
  } catch {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "feature.update",
      target: flag.id,
      targetType: "feature",
      result: "success",
      metadata: { key: flag.key, changes: data } as any,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, flag });
}

/** DELETE /api/admin/feature-flags — delete a flag */
export async function DELETE(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "feature_flags.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || (await req.json().catch(() => ({}))).id;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const existing = await db.featureFlag.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  await db.featureFlag.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "feature.delete",
      target: id,
      targetType: "feature",
      result: "success",
      metadata: { key: existing.key, name: existing.name },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true });
}

/** PATCH /api/admin/feature-flags — toggle a flag (also accepts rolloutPct + planRequired for inline editing) */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "feature_flags.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : null;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const changes: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") {
    data.enabled = body.enabled;
    changes.enabled = body.enabled;
  }
  if (body.rolloutPct !== undefined) {
    const pct = Number(body.rolloutPct);
    if (Number.isFinite(pct)) {
      data.rolloutPct = Math.max(0, Math.min(100, Math.round(pct)));
      changes.rolloutPct = data.rolloutPct;
    }
  }
  if (body.planRequired !== undefined) {
    const plan = typeof body.planRequired === "string" ? body.planRequired.trim() : "";
    if (VALID_PLANS.has(plan)) {
      data.planRequired = plan || null;
      changes.planRequired = data.planRequired;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  let flag;
  try {
    flag = await db.featureFlag.update({ where: { id }, data });
  } catch {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  // Use feature.toggle action when only `enabled` changes; otherwise feature.update
  const action =
    Object.keys(changes).length === 1 && "enabled" in changes
      ? "feature.toggle"
      : "feature.update";

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action,
      target: flag.id,
      targetType: "feature",
      result: "success",
      metadata: { key: flag.key, changes } as any,
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, flag });
}
