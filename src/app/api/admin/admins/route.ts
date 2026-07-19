import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission, ADMIN_PERMISSIONS } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_ROLES = Object.keys(ADMIN_PERMISSIONS);

/** GET /api/admin/admins — list all admins (no passwordHash) */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "settings.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const admins = await db.admin.findMany({
    orderBy: { createdAt: "desc" },
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
      updatedAt: true,
    },
  });

  return NextResponse.json({ admins });
}

/** POST /api/admin/admins — create a new admin */
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "settings.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, email, password, role } = body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name || !email || !password || !role) {
    return NextResponse.json(
      { error: "Missing required fields: name, email, password, role" },
      { status: 400 },
    );
  }

  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
      { status: 400 },
    );
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  // Check for duplicate
  const existing = await db.admin.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An admin with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await db.admin.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      active: true,
      mfaEnabled: false,
    },
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

  // Audit log
  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "admin.create",
      target: admin.id,
      targetType: "admin",
      result: "success",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      metadata: { email: admin.email, role: admin.role, name: admin.name } as any,
    },
  });

  return NextResponse.json({ admin }, { status: 201 });
}
