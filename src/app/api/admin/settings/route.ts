import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminSession, ADMIN_PERMISSIONS } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/settings — settings panel data */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Current admin profile
  const admin = await db.admin.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      mfaEnabled: true,
      active: true,
      lastLoginAt: true,
      lastLoginIP: true,
      createdAt: true,
    },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Platform config — derived from env
  const platform = {
    database: "Neon Postgres",
    vps: "64.181.198.8 (Oracle)",
    payment: process.env.PAYSTACK_SECRET_KEY ? "Paystack (Live)" : "Not configured",
    aiProvider: "SPYRO AI Engine",
    currency: "KES (Kenyan Shilling)",
    note: "Configuration is managed via environment variables",
  };

  // Roles & permissions matrix
  const allPermissionKeys = Array.from(
    new Set(
      Object.values(ADMIN_PERMISSIONS).flatMap((perms) =>
        perms.map((p) => (p === "*" ? "*" : p.split(".")[0])),
      ),
    ),
  ).sort();

  const roles = Object.entries(ADMIN_PERMISSIONS).map(([roleKey, perms]) => {
    const hasWildcard = perms.includes("*");
    return {
      key: roleKey,
      label: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
      permissions: allPermissionKeys.map((pk) => ({
        key: pk,
        granted: hasWildcard || perms.includes(pk) || perms.includes(`${pk}.*`),
      })),
    };
  });

  return NextResponse.json({
    profile: admin,
    platform,
    roles,
    allPermissionKeys,
    security: {
      mfaSetupAvailable: true,
      sessionTimeoutHours: 8,
      passwordPolicy: {
        algorithm: "bcrypt (12 rounds)",
        minLength: 8,
      },
    },
  });
}

/** PATCH /api/admin/settings — change own password */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "currentPassword and newPassword are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const admin = await db.admin.findUnique({
    where: { id: session.id },
    select: { id: true, passwordHash: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) {
    // Audit log the failed attempt
    await db.auditLog.create({
      data: {
        adminId: session.id,
        action: "password.change",
        target: session.id,
        targetType: "admin",
        result: "failed",
        ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      },
    });
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.admin.update({
    where: { id: session.id },
    data: { passwordHash: newHash },
  });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "password.change",
      target: session.id,
      targetType: "admin",
      result: "success",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true });
}
