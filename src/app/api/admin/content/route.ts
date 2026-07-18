import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";
import { STUDIO_TYPES } from "@/lib/studio-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/content
 * Combined payload for Studios + AI Agents + Knowledge admin views.
 * One round-trip — front-end consumes { studios, agents, knowledge }.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ── STUDIOS ──────────────────────────────────────────────────────────
  // groupBy on studioType gives counts + max(updatedAt) per studio.
  const studioRows = await db.user.groupBy({
    by: ["studioType"],
    where: { studioType: { not: null } },
    _count: { _all: true },
    _max: { updatedAt: true },
  });

  const studioMap = new Map<string, { count: number; lastActivity: Date | null }>();
  for (const row of studioRows) {
    const id = row.studioType;
    if (!id) continue;
    studioMap.set(id, {
      count: row._count._all,
      lastActivity: row._max.updatedAt ?? null,
    });
  }

  const totalStudioUsers = Array.from(studioMap.values()).reduce(
    (sum, r) => sum + r.count,
    0,
  );

  const counts = STUDIO_TYPES.map((s) => {
    const data = studioMap.get(s.id) ?? { count: 0, lastActivity: null };
    return {
      id: s.id,
      name: s.name,
      color: s.color,
      userCount: data.count,
      percent:
        totalStudioUsers > 0
          ? Math.round((data.count / totalStudioUsers) * 100)
          : 0,
      lastActivity: data.lastActivity ? data.lastActivity.toISOString() : null,
      status: data.count > 0 ? "active" : "dormant",
    };
  });

  // Active today = studioType set AND updatedAt >= todayStart
  const activeToday = await db.user.count({
    where: {
      studioType: { not: null },
      updatedAt: { gte: todayStart },
    },
  });

  // Most popular studio (top by count)
  const sortedByCount = [...counts].sort((a, b) => b.userCount - a.userCount);
  const mostPopular = sortedByCount[0] && sortedByCount[0].userCount > 0
    ? {
        id: sortedByCount[0].id,
        name: sortedByCount[0].name,
        userCount: sortedByCount[0].userCount,
      }
    : null;

  // Avg sessions/user — there is no session log; approximate as
  // (total messages over 30d / studio users). The UI labels this honestly.
  const recentMessages = await db.message.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });
  const avgSessionsPerUser =
    totalStudioUsers > 0
      ? Math.round((recentMessages / totalStudioUsers) * 10) / 10
      : 0;

  // 30-day message groupBy — proxy for platform activity
  const messagesByDay = await db.message.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: { _all: true },
  });
  // Bucket by YYYY-MM-DD
  const dayBuckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    dayBuckets.set(key, 0);
  }
  for (const row of messagesByDay) {
    const d = row.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (dayBuckets.has(key)) {
      dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + row._count._all);
    }
  }
  const sessionsChart = Array.from(dayBuckets.entries()).map(([day, count]) => ({
    day,
    count,
  }));

  // Top 10 studio users by updatedAt (most recently active)
  const topUsersRaw = await db.user.findMany({
    where: { studioType: { not: null } },
    take: 10,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      studioType: true,
      updatedAt: true,
    },
  });
  const topUsers = topUsersRaw.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    plan: u.plan,
    studioType: u.studioType,
    lastSeen: u.updatedAt.toISOString(),
  }));

  // ── AGENTS ───────────────────────────────────────────────────────────
  const [
    totalAgents,
    runningAgents,
    agentsRaw,
    agentCallsSum,
    agentTokensSum,
  ] = await Promise.all([
    db.agent.count(),
    db.agent.count({ where: { status: "running" } }),
    db.agent.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    }),
    db.agent.aggregate({ _sum: { totalCalls: true } }),
    db.agent.aggregate({ _sum: { totalTokens: true } }),
  ]);

  const agentsList = agentsRaw.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description ?? null,
    instructions: a.instructions ?? null,
    avatar: a.avatar,
    color: a.color,
    status: a.status,
    model: a.model,
    temperature: a.temperature,
    responseStyle: a.responseStyle,
    knowledgeSources: a.knowledgeSources,
    channels: a.channels,
    approvalMode: a.approvalMode,
    autoReplyMode: a.autoReplyMode,
    totalCalls: a.totalCalls,
    totalTokens: a.totalTokens,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
    owner: a.user
      ? { id: a.user.id, name: a.user.name, email: a.user.email, plan: a.user.plan }
      : null,
  }));

  // ── KNOWLEDGE ────────────────────────────────────────────────────────
  const [
    totalDocs,
    indexedDocs,
    pendingDocs,
    storageAgg,
    docsRaw,
    byTypeRaw,
    recentDocsRaw,
  ] = await Promise.all([
    db.knowledgeDoc.count(),
    db.knowledgeDoc.count({ where: { indexed: true } }),
    db.knowledgeDoc.count({ where: { indexed: false } }),
    db.knowledgeDoc.aggregate({ _sum: { sizeBytes: true } }),
    db.knowledgeDoc.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    }),
    db.knowledgeDoc.groupBy({
      by: ["type"],
      _count: { _all: true },
    }),
    db.knowledgeDoc.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user: { select: { id: true, name: true, email: true, plan: true } },
      },
    }),
  ]);

  const storageBytes = storageAgg._sum.sizeBytes ?? 0;

  const docsList = docsRaw.map((d) => ({
    id: d.id,
    title: d.title,
    type: d.type,
    sizeBytes: d.sizeBytes,
    indexed: d.indexed,
    citations: d.citations,
    tags: d.tags,
    collection: d.collection,
    url: d.url,
    createdAt: d.createdAt.toISOString(),
    owner: d.user
      ? { id: d.user.id, name: d.user.name, email: d.user.email, plan: d.user.plan }
      : null,
  }));

  const byType = byTypeRaw
    .map((row) => ({ type: row.type, count: row._count._all }))
    .sort((a, b) => b.count - a.count);

  const recentUploads = recentDocsRaw.map((d) => ({
    id: d.id,
    title: d.title,
    type: d.type,
    sizeBytes: d.sizeBytes,
    createdAt: d.createdAt.toISOString(),
    owner: d.user
      ? { id: d.user.id, name: d.user.name, email: d.user.email, plan: d.user.plan }
      : null,
  }));

  return NextResponse.json({
    studios: {
      counts,
      totalStudioUsers,
      activeToday,
      mostPopular,
      avgSessionsPerUser,
      sessionsChart,
      topUsers,
    },
    agents: {
      stats: {
        total: totalAgents,
        running: runningAgents,
        totalCalls: agentCallsSum._sum.totalCalls ?? 0,
        totalTokens: agentTokensSum._sum.totalTokens ?? 0,
      },
      list: agentsList,
    },
    knowledge: {
      stats: {
        total: totalDocs,
        indexed: indexedDocs,
        pending: pendingDocs,
        storageBytes,
      },
      docs: docsList,
      byType,
      recentUploads,
    },
  });
}
