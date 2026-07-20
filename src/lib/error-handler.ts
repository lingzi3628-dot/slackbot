/**
 * Centralized error handler — NEVER leak internal details to clients.
 *
 * #5 (hardening): All API routes should use `handleApiError()` in their
 * catch blocks. It:
 *  - Logs the full error server-side (console.error → Vercel logs)
 *  - Returns a GENERIC message to the client: { error: "Internal server error" }
 *  - NEVER includes stack traces, file paths, SQL queries, variable names,
 *    or Prisma error details in the response.
 *
 * Usage:
 *   import { handleApiError } from "@/lib/error-handler";
 *   export async function POST(req: NextRequest) {
 *     try { ... } catch (err) { return handleApiError(err, "POST /api/example"); }
 *   }
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";

/**
 * Handle an error in an API route. Logs the full error server-side,
 * returns a generic 500 to the client.
 *
 * @param err     The caught error
 * @param context A string identifying the route (e.g. "POST /api/chat")
 *                 — logged server-side only, never sent to client.
 * @param userId  Optional user ID for audit logging.
 */
export function handleApiError(
  err: unknown,
  context: string,
  userId?: string
): NextResponse {
  // ── Log the FULL error server-side (Vercel logs) ──────────────────
  const errorMessage = err instanceof Error ? err.message : String(err);
  const errorStack = err instanceof Error ? err.stack : undefined;
  const errorName = err instanceof Error ? err.name : "Unknown";

  console.error(`[error] ${context}:`, {
    name: errorName,
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
  });

  // ── Return a GENERIC message to the client ────────────────────────
  // Never include: stack traces, file paths, SQL queries, variable names,
  // Prisma error codes, or any internal detail.
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

/**
 * Handle an error AND write it to the audit log (for sensitive endpoints).
 * Use this for auth, payment, and admin routes where you want a permanent
 * record of errors.
 */
export async function handleApiErrorAudited(
  err: unknown,
  context: string,
  req: Request,
  userId?: string
): Promise<NextResponse> {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";
  const errorMessage = err instanceof Error ? err.message : String(err);

  // Log to audit table (best-effort — don't fail if DB is down)
  try {
    await db.activityLog.create({
      data: {
        userId: userId || "unknown",
        type: "error",
        description: `[${context}] ${errorMessage.slice(0, 200)}`,
        metadata: {
          ip,
          userAgent: userAgent.slice(0, 200),
          errorName: err instanceof Error ? err.name : "Unknown",
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch {
    // Audit logging must never break the error response.
  }

  return handleApiError(err, context, userId);
}

/**
 * Return a 400 Bad Request with a specific message.
 * Use for user-facing validation errors (safe to show).
 */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Return a 401 Unauthorized with a generic message.
 */
export function unauthorized(message: string = "Authentication required"): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Return a 403 Forbidden with a generic message.
 */
export function forbidden(message: string = "Access denied"): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Return a 404 Not Found with a generic message.
 * Never reveal whether a resource exists but is unauthorized vs. truly missing.
 */
export function notFound(message: string = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Return a 429 Too Many Requests with rate limit headers.
 */
export function tooManyRequests(
  message: string,
  rateLimitHeaders: Record<string, string>
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: rateLimitHeaders }
  );
}
