/**
 * Audit logging helper — write-only audit trail for sensitive actions.
 *
 * #9 (hardening): Every sensitive action is logged with:
 *  - timestamp (createdAt, auto)
 *  - actor_id (userId)
 *  - action_type (type)
 *  - ip_address (in metadata.ip)
 *  - user_agent (in metadata.userAgent)
 *  - metadata (JSON blob)
 *
 * The audit log is WRITE-ONLY from the application. No endpoint exposes
 * audit logs directly (admin /api/admin/audit is separate, admin-only).
 *
 * Usage:
 *   import { auditLog } from "@/lib/audit";
 *   await auditLog({ userId, type: "auth", action: "login", req, metadata: { ... } });
 */

import { db } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";

export interface AuditLogParams {
  userId: string | null;  // null for unauthenticated actions
  type: string;
  action: string;
  req?: Request;
  metadata?: Record<string, unknown>;
}

/**
 * Write an entry to the audit log. Best-effort — never throws.
 * The audit log is WRITE-ONLY: no application endpoint reads it.
 */
export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    const ip = params.req ? getClientIp(params.req) : "unknown";
    const userAgent = params.req
      ? (params.req.headers.get("user-agent") || "unknown").slice(0, 200)
      : "unknown";

    await db.activityLog.create({
      data: {
        userId: params.userId,
        type: params.type,
        description: params.action,
        metadata: {
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
          ...params.metadata,
        },
      },
    });
  } catch (err) {
    // Audit logging must NEVER break the application flow.
    console.error("[audit] Failed to write audit log:", err);
  }
}
