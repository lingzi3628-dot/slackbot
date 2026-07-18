/**
 * Admin session management — completely separate from user auth.
 * Uses a separate HTTP-only cookie + bcrypt password hashing.
 */
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "spyro-admin-session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function createAdminSession(admin: { id: string; email: string; name: string; role: string }) {
  const token = Buffer.from(JSON.stringify({
    ...admin,
    exp: Date.now() + SESSION_DURATION,
  })).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/", // Must be "/" so the cookie is sent to /api/admin/* routes too
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = JSON.parse(Buffer.from(token, "base64url").toString());
    if (decoded.exp < Date.now()) return null;

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function verifyAdminPassword(email: string, password: string) {
  const admin = await db.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin || !admin.active) return null;

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) return null;

  // Update last login
  await db.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  };
}

/** Create the initial super admin (called once via setup script) */
export async function createAdmin(email: string, name: string, password: string, role: string = "super") {
  const hash = await bcrypt.hash(password, 12);
  return db.admin.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: hash,
      role,
    },
  });
}

/** Role permissions matrix */
export const ADMIN_PERMISSIONS: Record<string, string[]> = {
  support: ["users.view", "tickets.view", "tickets.reply", "support.*", "announcements.view"],
  moderator: ["users.view", "users.suspend", "users.ban", "moderation.view", "moderation.act", "audit.view"],
  operations: ["users.view", "users.act", "feature_flags.*", "system.health", "announcements.*", "analytics.view", "billing.*"],
  security: ["users.view", "users.act", "security.*", "audit.view", "audit.export"],
  developer: ["system.*", "feature_flags.*", "analytics.view", "ai_training.view"],
  super: ["*"], // all permissions
};

export function hasPermission(role: string, permission: string): boolean {
  const perms = ADMIN_PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  // Check wildcard (e.g. "feature_flags.*" matches "feature_flags.toggle")
  const prefix = permission.split(".")[0];
  if (perms.includes(`${prefix}.*`)) return true;
  return false;
}
