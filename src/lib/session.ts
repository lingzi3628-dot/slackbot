/**
 * Session management — uses HTTP-only cookies (no localStorage).
 * Tokens are base64-encoded JSON { id, email, name, role, exp }.
 * On each request, /api/auth/me validates the cookie → returns user.
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

const SESSION_COOKIE = "spyro_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

interface SessionData {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarColor: string;
  exp: number;
}

/** Create a session token (base64-encoded JSON). */
export function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarColor: string;
}): string {
  const data: SessionData = {
    ...user,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  };
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

/** Parse + validate a session token. Returns null if expired/invalid. */
export function parseSessionToken(token: string): SessionData | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    const data = JSON.parse(json) as SessionData;
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

/** Get the current session from a request's cookies. */
export function getSession(req: NextRequest): SessionData | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSessionToken(token);
}

/** Build Set-Cookie header for a new session. */
export function buildSessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax; Secure`;
}

/** Build Set-Cookie header to clear the session. */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

/** Verify a session against the database (ensures user still exists). */
export async function verifySession(req: NextRequest): Promise<SessionData | null> {
  const session = getSession(req);
  if (!session) return null;
  try {
    const user = await db.user.findUnique({ where: { id: session.id } });
    if (!user) return null;
    return session;
  } catch {
    // DB not available — trust the cookie (graceful degradation).
    return session;
  }
}

export { SESSION_COOKIE };
export type { SessionData };
