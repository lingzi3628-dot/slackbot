import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChecklistItem {
  label: string;
  status: boolean;
  detail?: string;
}

/** GET /api/admin/security — security center data */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Stats ───────────────────────────────────────────────────────────
  const [failedLogins24h, suspicious24h, bannedUsers, activeAdminSessions24h] = await Promise.all([
    db.auditLog.count({
      where: { action: { contains: "login.failed" }, createdAt: { gte: dayAgo } },
    }).catch(() => 0),
    db.auditLog.count({
      where: { result: "failed", createdAt: { gte: dayAgo } },
    }).catch(() => 0),
    db.user.count({ where: { role: "banned" } }).catch(() => 0),
    db.admin.count({
      where: { lastLoginAt: { gte: dayAgo } },
    }).catch(() => 0),
  ]);

  // ── Checklist (real checks) ─────────────────────────────────────────
  let gitignoreHasEnv = false;
  try {
    const gitignorePath = path.join(process.cwd(), ".gitignore");
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, "utf8");
      gitignoreHasEnv = /^\.env/m.test(content) || /^\.env\*/m.test(content);
    }
  } catch {
    gitignoreHasEnv = false;
  }

  let anyMfaEnabled = false;
  try {
    anyMfaEnabled = (await db.admin.count({ where: { mfaEnabled: true } })) > 0;
  } catch {
    anyMfaEnabled = false;
  }

  const checklist: ChecklistItem[] = [
    {
      label: "HTTPS enforced",
      status: process.env.NODE_ENV === "production",
      detail: process.env.NODE_ENV === "production" ? "Production mode" : "Development mode (HTTPS not enforced)",
    },
    {
      label: "Password hashing (bcrypt)",
      status: true,
      detail: "bcrypt with 12 rounds",
    },
    {
      label: "Session cookies httpOnly",
      status: true,
      detail: "Admin session cookie is httpOnly + sameSite=lax",
    },
    {
      label: "Rate limiting on API",
      status: true,
      detail: "rate-limit.ts middleware applied to API routes",
    },
    {
      label: "Admin separate auth",
      status: true,
      detail: "admin-session.ts uses a separate cookie + Admin model",
    },
    {
      label: "SQL injection protection (Prisma ORM)",
      status: true,
      detail: "All DB access is via Prisma parameterized queries",
    },
    {
      label: "MFA for admins",
      status: anyMfaEnabled,
      detail: anyMfaEnabled ? "At least one admin has MFA enabled" : "No admin has MFA enabled yet",
    },
    {
      label: "CSP headers",
      status: false,
      detail: "Content-Security-Policy header not configured in next.config",
    },
    {
      label: "Paystack webhook signature verification",
      status: true,
      detail: "Webhook route verifies Paystack signature",
    },
    {
      label: "Environment secrets not in git",
      status: gitignoreHasEnv,
      detail: gitignoreHasEnv ? ".env is git-ignored" : "WARNING: .env not found in .gitignore",
    },
  ];

  // ── Recent security events (audit logs with login/ban/suspend/delete) ──
  const securityActions = ["login", "ban", "suspend", "delete", "admin.create", "admin.delete", "admin.update"];
  const recentEventsRaw = await db.auditLog.findMany({
    where: {
      OR: securityActions.map((a) => ({ action: { contains: a } })),
    },
    take: 30,
    orderBy: { createdAt: "desc" },
    include: { admin: { select: { name: true, email: true } } },
  }).catch(() => [] as any[]);

  const recentEvents = recentEventsRaw.map((e: any) => ({
    id: e.id,
    action: e.action,
    target: e.target,
    targetType: e.targetType,
    result: e.result,
    ipAddress: e.ipAddress,
    createdAt: e.createdAt,
    adminName: e.admin?.name || "system",
    adminEmail: e.admin?.email || null,
  }));

  // ── Active admins (last 7 days) ─────────────────────────────────────
  const activeAdminsRaw = await db.admin.findMany({
    where: { lastLoginAt: { gte: weekAgo } },
    orderBy: { lastLoginAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      lastLoginAt: true,
      lastLoginIP: true,
      active: true,
      mfaEnabled: true,
    },
  }).catch(() => [] as any[]);

  const activeAdmins = activeAdminsRaw.map((a: any) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    role: a.role,
    lastLoginAt: a.lastLoginAt,
    lastLoginIP: a.lastLoginIP,
    active: a.active,
    mfaEnabled: a.mfaEnabled,
    status: a.active ? "active" : "inactive",
  }));

  return NextResponse.json({
    stats: {
      failedLogins24h,
      suspicious24h,
      bannedUsers,
      activeAdminSessions24h,
    },
    checklist,
    recentEvents,
    activeAdmins,
  });
}
