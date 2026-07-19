import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission, ADMIN_PERMISSIONS } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ROLES = Object.keys(ADMIN_PERMISSIONS);

/** PATCH /api/admin/admins/[id] — update an admin (active, role, mfaEnabled; NOT password) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "settings.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing admin id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const update: { active?: boolean; role?: string; mfaEnabled?: boolean } = {};

  if (typeof body.active === "boolean") update.active = body.active;
  if (typeof body.role === "string") {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 },
      );
    }
    update.role = body.role;
  }
  if (typeof body.mfaEnabled === "boolean") update.mfaEnabled = body.mfaEnabled;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  // Prevent self-deactivation / self-demotion (admins shouldn't lock themselves out)
  if (id === session.id && (update.active === false || (update.role && update.role !== session.role))) {
    return NextResponse.json(
      { error: "You cannot deactivate or change your own role" },
      { status: 400 },
    );
  }

  // If demoting the last super admin, block
  if (update.role && update.role !== "super") {
    const target = await db.admin.findUnique({ where: { id }, select: { role: true } });
    if (target?.role === "super") {
      const superCount = await db.admin.count({ where: { role: "super", active: true } });
      if (superCount <= 1) {
        return NextResponse.json(
          { error: "Cannot demote the last super admin" },
          { status: 400 },
        );
      }
    }
  }

  const updated = await db.admin.update({
    where: { id },
    data: update,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      active: true,
      lastLoginAt: true,
      lastLoginIP: true,
    },
  });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "admin.update",
      target: id,
      targetType: "admin",
      result: "success",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      metadata: { changes: update } as any,
    },
  });

  return NextResponse.json({ admin: updated });
}

/** DELETE /api/admin/admins/[id] — delete an admin (prevent self-delete + last super admin) */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "settings.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing admin id" }, { status: 400 });
  }

  // Prevent self-delete
  if (id === session.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  // Prevent deleting the last super admin
  const target = await db.admin.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!target) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }
  if (target.role === "super") {
    const superCount = await db.admin.count({ where: { role: "super" } });
    if (superCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last super admin" },
        { status: 400 },
      );
    }
  }

  await db.admin.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "admin.delete",
      target: id,
      targetType: "admin",
      result: "success",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      metadata: { email: target.email } as any,
    },
  });

  return NextResponse.json({ ok: true });
}
