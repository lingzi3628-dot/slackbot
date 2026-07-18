import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/tickets — list support tickets with filters & joined user info. */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "support.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = (searchParams.get("search") || "").trim();
  const priority = searchParams.get("priority") || ""; // low | medium | high | urgent
  const status = searchParams.get("status") || ""; // open | pending | resolved | closed
  const assignee = searchParams.get("assignee") || ""; // any | unassigned | me
  const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);

  const where: any = {};
  if (priority) where.priority = priority;
  if (status) where.status = status;
  if (assignee === "unassigned") where.assignedTo = null;
  else if (assignee === "me") where.assignedTo = session.id;

  // First fetch the tickets
  const tickets = await db.supportTicket.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  // If search is requested, filter on subject/message OR user (name/email)
  let filtered = tickets;
  if (search) {
    const lower = search.toLowerCase();
    // Find users whose name/email matches the search
    const matchingUsers = await db.user.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    const userIds = new Set(matchingUsers.map((u) => u.id));
    filtered = tickets.filter(
      (t) =>
        t.subject.toLowerCase().includes(lower) ||
        t.message.toLowerCase().includes(lower) ||
        userIds.has(t.userId),
    );
  }

  // Fetch user info for all filtered tickets
  const userIds = Array.from(new Set(filtered.map((t) => t.userId)));
  const users = userIds.length
    ? await db.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, plan: true, createdAt: true },
      })
    : [];
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Optionally include assignee name (Admin table)
  const adminIds = Array.from(
    new Set(filtered.map((t) => t.assignedTo).filter(Boolean) as string[]),
  );
  const admins = adminIds.length
    ? await db.admin.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, name: true, email: true },
      })
    : [];
  const adminMap = new Map(admins.map((a) => [a.id, a]));

  const enriched = filtered.map((t) => {
    const u = userMap.get(t.userId);
    const a = t.assignedTo ? adminMap.get(t.assignedTo) : null;
    return {
      id: t.id,
      subject: t.subject,
      message: t.message,
      priority: t.priority,
      status: t.status,
      assignedTo: t.assignedTo,
      assignedToName: a?.name || null,
      notes: t.notes,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      user: u
        ? {
            id: u.id,
            name: u.name,
            email: u.email,
            plan: u.plan,
            createdAt: u.createdAt,
          }
        : null,
    };
  });

  return NextResponse.json({
    tickets: enriched,
    total: enriched.length,
    counts: {
      open: tickets.filter((t) => t.status === "open").length,
      pending: tickets.filter((t) => t.status === "pending").length,
      resolved7d: tickets.filter(
        (t) =>
          t.status === "resolved" &&
          t.updatedAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
    },
  });
}
