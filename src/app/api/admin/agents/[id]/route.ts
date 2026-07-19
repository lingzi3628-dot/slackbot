import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/agents/[id]
 * Delete an AI agent owned by any user. Requires agents.* permission.
 * Writes an audit log entry (agent.delete).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "agents.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing agent id" }, { status: 400 });
  }

  // Confirm the agent exists + capture snapshot for audit log
  const existing = await db.agent.findUnique({
    where: { id },
    select: { id: true, name: true, userId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  await db.agent.delete({ where: { id } });

  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "agent.delete",
      target: id,
      targetType: "agent",
      result: "success",
      metadata: {
        agentName: existing.name,
        ownerId: existing.userId,
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, id });
}
