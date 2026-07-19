import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];
const VALID_STATUSES = ["open", "pending", "resolved", "closed"];

/** PATCH /api/admin/tickets/[id] — update priority, status, assignee, notes. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "support.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { priority, status, assignedTo, notes, reply } = body as {
    priority?: string;
    status?: string;
    assignedTo?: string | null;
    notes?: string;
    reply?: string;
  };

  const update: any = {};
  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    update.priority = priority;
  }
  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = status;
  }
  if (assignedTo !== undefined) {
    // Allow null (unassign) or a non-empty string (admin id)
    update.assignedTo = assignedTo === null || assignedTo === "" ? null : assignedTo;
  }

  // Notes / reply — both appended to the notes field as a timestamped log
  const stamp = new Date().toISOString();
  const existing = await db.supportTicket.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const noteLines: string[] = [];
  if (notes !== undefined && notes.trim() && notes !== existing.notes) {
    noteLines.push(`[${stamp}] ${session.name} updated notes:\n${notes.trim()}`);
  }
  if (reply !== undefined && reply.trim()) {
    noteLines.push(`[${stamp}] ${session.name} replied:\n${reply.trim()}`);
    // Sending a reply bumps status to pending (awaiting user response) unless caller overrode it
    if (status === undefined) update.status = "pending";
  }

  if (noteLines.length) {
    const prevNotes = existing.notes ? existing.notes + "\n\n" : "";
    update.notes = prevNotes + noteLines.join("\n\n");
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, ticket: existing, noop: true });
  }

  const ticket = await db.supportTicket.update({
    where: { id },
    data: update,
  });

  // Audit log
  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: "ticket.update",
      target: id,
      targetType: "ticket",
      result: "success",
      metadata: {
        changes: {
          ...(priority !== undefined ? { priority } : {}),
          ...(status !== undefined ? { status } : {}),
          ...(assignedTo !== undefined ? { assignedTo } : {}),
          ...(reply !== undefined ? { replied: true } : {}),
        },
      },
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, ticket });
}
