import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/stats — live platform statistics */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers, newToday, newThisMonth, activeThisWeek,
    totalProjects, totalConversations, totalMessages,
    totalAgents, totalKnowledge, totalFiles,
    todayMessages, proUsers, plusUsers, ultraUsers,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { createdAt: { gte: monthStart } } }),
    db.user.count({ where: { updatedAt: { gte: weekAgo } } }),
    db.project.count(),
    db.conversation.count(),
    db.message.count(),
    db.agent.count(),
    db.knowledgeDoc.count(),
    db.file.count(),
    db.message.count({ where: { createdAt: { gte: todayStart } } }),
    db.user.count({ where: { plan: "pro" } }),
    db.user.count({ where: { plan: "plus" } }),
    db.user.count({ where: { plan: "ultra" } }),
  ]);

  const premiumUsers = proUsers + plusUsers + ultraUsers;
  const freeUsers = totalUsers - premiumUsers;

  // Recent registrations
  const recentUsers = await db.user.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, plan: true, createdAt: true },
  });

  // Recent activity
  const recentActivity = await db.activityLog.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, description: true, createdAt: true, userId: true },
  });

  return NextResponse.json({
    users: {
      total: totalUsers,
      newToday,
      newThisMonth,
      activeThisWeek,
      free: freeUsers,
      pro: proUsers,
      plus: plusUsers,
      ultra: ultraUsers,
      premium: premiumUsers,
    },
    content: {
      projects: totalProjects,
      conversations: totalConversations,
      messages: totalMessages,
      agents: totalAgents,
      knowledgeDocs: totalKnowledge,
      files: totalFiles,
      messagesToday: todayMessages,
    },
    recentUsers,
    recentActivity,
    system: {
      status: "operational",
      database: "healthy",
      api: "healthy",
      timestamp: now.toISOString(),
    },
  });
}
