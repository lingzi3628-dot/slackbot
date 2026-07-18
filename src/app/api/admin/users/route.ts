import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/users — list users with search/filter */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "users.view")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const plan = searchParams.get("plan") || "";
  const status = searchParams.get("status") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (plan) where.plan = plan;
  if (status === "suspended") where.role = "suspended";
  if (status === "verified") where.verified = true;
  if (status === "unverified") where.verified = false;

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, email: true, plan: true, role: true,
        verified: true, avatarColor: true, workspaceType: true,
        createdAt: true, updatedAt: true,
        _count: { select: { conversations: true, projects: true, agents: true, files: true } },
      },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total });
}

/** PATCH /api/admin/users — update user (ban, suspend, verify, etc.) */
export async function PATCH(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "users.act")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { userId, action } = await req.json();

  let update: any = {};
  switch (action) {
    case "verify": update.verified = true; break;
    case "unverify": update.verified = false; break;
    case "suspend": update.role = "suspended"; break;
    case "unsuspend": update.role = "user"; break;
    case "ban": update.role = "banned"; break;
    case "unban": update.role = "user"; break;
    case "promote_admin": update.role = "admin"; break;
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const user = await db.user.update({ where: { id: userId }, data: update });

  // Log to audit
  await db.auditLog.create({
    data: {
      adminId: session.id,
      action: `user.${action}`,
      target: userId,
      targetType: "user",
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
    },
  });

  return NextResponse.json({ ok: true, user: { id: user.id, role: user.role, verified: user.verified } });
}
