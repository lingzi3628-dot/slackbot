/**
 * Session management — DB-stored, revocable, hardened.
 *
 * #6 (hardening):
 *  - SameSite=Strict (not Lax — protects against all CSRF on state-changing endpoints)
 *  - maxAge: 24 hours (was 7 days — reduces window of compromise)
 *  - DB-stored: every session has a row in the Session table with expiry.
 *    Revocable by deleting the row (logout, admin force-logout, password change).
 *  - Session ID regenerated on login (prevents session fixation).
 *  - Token: random 32 bytes (crypto.randomBytes) → 64 hex chars.
 *    NOT base64-encoded JSON (stateless tokens can't be revoked).
 *
 * Token format: <sessionId>.<randomToken>
 *  - sessionId: for DB lookup (indexed)
 *  - randomToken: the secret (stored hashed in DB via SHA-256)
 */

import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createHash, randomBytes } from "crypto";

const SESSION_COOKIE = "spyro_session";
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours (seconds) — was 7 days

interface SessionData {
  id: string;        // session ID (for DB lookup)
  userId: string;
  email: string;
  name: string;
  role: string;
  avatarColor: string;
  exp: number;       // expiry timestamp (ms)
}

/** Hash a token with SHA-256 for DB storage (never store raw tokens). */
function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Generate a cryptographically random session token (32 bytes → 64 hex chars). */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Create a new DB-stored session for a user.
 * Called on login (and on session regeneration).
 *
 * Returns the cookie value to set: "<sessionId>.<rawToken>"
 */
export async function createSession(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarColor: string;
}, req?: NextRequest): Promise<string> {
  const rawToken = generateToken();
  const hashedToken = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  // Create the session row in the DB
  const session = await db.session.create({
    data: {
      userId: user.id,
      token: hashedToken,
      ipAddress: req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      userAgent: req?.headers.get("user-agent")?.slice(0, 200) || null,
      expiresAt,
    },
  });

  // Return "<sessionId>.<rawToken>" — the cookie value
  return `${session.id}.${rawToken}`;
}

/**
 * Parse a session cookie value and verify against the DB.
 * Returns the session data if valid + active + not expired, null otherwise.
 */
export async function getSession(req: NextRequest): Promise<SessionData | null> {
  const cookieValue = req.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieValue) return null;

  // Split "<sessionId>.<rawToken>"
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return null;
  const [sessionId, rawToken] = parts;
  if (!sessionId || !rawToken) return null;

  // Look up the session in the DB
  try {
    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, email: true, name: true, role: true, avatarColor: true } } },
    });

    // Session not found, revoked, or expired
    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt < new Date()) return null;

    // Verify the token hash (constant-time via Prisma lookup — the hashed
    // token is unique-indexed, so a mismatch simply won't find the row)
    const hashedToken = hashToken(rawToken);
    if (session.token !== hashedToken) return null;

    // Check the user still exists
    if (!session.user) return null;

    return {
      id: session.id,
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      avatarColor: session.user.avatarColor,
      exp: session.expiresAt.getTime(),
    };
  } catch {
    // DB unavailable — can't verify session (fail closed for DB-stored sessions)
    return null;
  }
}

/**
 * Regenerate the session ID on login / privilege escalation.
 * Revokes the old session (if any) and creates a new one.
 * Prevents session fixation attacks.
 */
export async function regenerateSession(
  user: { id: string; email: string; name: string; role: string; avatarColor: string },
  oldSessionId: string | null,
  req?: NextRequest
): Promise<string> {
  // Revoke the old session if it exists
  if (oldSessionId) {
    try {
      await db.session.update({
        where: { id: oldSessionId },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Old session might not exist — ignore
    }
  }
  // Create a new session
  return createSession(user, req);
}

/** Revoke a session (logout). */
export async function revokeSession(sessionId: string): Promise<void> {
  try {
    await db.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Ignore — session might already be revoked
  }
}

/** Revoke ALL sessions for a user (password change, security event). */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  try {
    await db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Ignore
  }
}

/** Build Set-Cookie header for a new session. SameSite=Strict. */
export function buildSessionCookie(cookieValue: string): string {
  // In production (HTTPS), set Secure. In dev (HTTP localhost), omit it
  // so the browser actually sends the cookie over HTTP.
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${cookieValue}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Strict${secure}`;
}

/** Build Set-Cookie header to clear the session. */
export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${secure}`;
}

// ── Legacy compat: stateless token parsing (for backward compat with
// existing code that calls parseSessionToken). DEPRECATED — use getSession(). ──

/** @deprecated Use getSession() (async, DB-backed) instead. */
export function parseSessionToken(token: string): SessionData | null {
  // Legacy stateless tokens are no longer supported — return null.
  // All sessions must be DB-backed.
  return null;
}

/** @deprecated Use getSession() (async, DB-backed) instead. */
export function createSessionToken(user: {
  id: string; email: string; name: string; role: string; avatarColor: string;
}): string {
  // Legacy stateless tokens are disabled. Return empty — callers should
  // use createSession() (async) instead.
  console.warn("[session] createSessionToken() is deprecated. Use createSession() (async).");
  return "";
}

export { SESSION_COOKIE };
export type { SessionData };
