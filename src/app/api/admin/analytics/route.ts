import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DailyBucket {
  day: Date;
  count: number;
}

interface PlanBucket {
  plan: string | null;
  _count: number;
}

interface WorkspaceBucket {
  workspaceType: string | null;
  _count: number;
}

interface StudioBucket {
  studioType: string | null;
  _count: number;
}

interface RetentionRow {
  cohort: string;        // ISO start date of cohort week
  cohortLabel: string;   // human label
  size: number;          // users who signed up in this cohort
  retention: Array<{
    weekOffset: number;  // 0..3
    label: string;       // "W0", "W1", "W2", "W3"
    active: number;      // users from cohort who sent ≥1 message that week
    pct: number | null;  // null if week is in the future
  }>;
}

interface AnalyticsResponse {
  range: number;
  windowStart: string;
  windowEnd: string;
  stats: {
    dau: number;
    wau: number;
    mau: number;
    newUsers: number;
    totalMessages: number;
    avgMessagesPerUser: number;
    totalUsers: number;
  };
  registrations: Array<{ date: string; count: number }>;
  messages: Array<{ date: string; count: number }>;
  plans: Array<{ plan: string; count: number; pct: number }>;
  workspaces: Array<{ workspaceType: string; count: number }>;
  studios: Array<{ studioType: string; count: number }>;
  retention: RetentionRow[];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function isoDay(d: Date): string {
  // YYYY-MM-DD in local time (matches date_trunc('day') on server TZ)
  return d.toISOString().slice(0, 10);
}

function cohortLabel(start: Date): string {
  const end = addDays(start, 7);
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** GET /api/admin/analytics?range=7|30|90 — real platform analytics */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const rawRange = parseInt(searchParams.get("range") || "30", 10);
  const range = [7, 30, 90].includes(rawRange) ? rawRange : 30;

  const now = new Date();
  const todayEnd = addDays(startOfDay(now), 1);          // start of tomorrow
  const windowStart = addDays(startOfDay(now), -range);  // N days ago at midnight
  const weekAgo = addDays(now, -7);
  const monthAgo = addDays(now, -30);

  // ── Top stats (parallel) ────────────────────────────────────────────
  const [
    dau, wau, mau, newUsers, totalMessages, totalUsers,
  ] = await Promise.all([
    db.user.count({ where: { updatedAt: { gte: startOfDay(now) } } }),
    db.user.count({ where: { updatedAt: { gte: weekAgo } } }),
    db.user.count({ where: { updatedAt: { gte: monthAgo } } }),
    db.user.count({ where: { createdAt: { gte: windowStart, lt: todayEnd } } }),
    db.message.count({ where: { createdAt: { gte: windowStart, lt: todayEnd } } }),
    db.user.count(),
  ]);

  const avgMessagesPerUser = totalUsers > 0
    ? Math.round((totalMessages / totalUsers) * 100) / 100
    : 0;

  // ── Daily registrations (raw SQL · Postgres date_trunc) ─────────────
  let registrations: Array<{ date: string; count: number }> = [];
  try {
    const rows = await db.$queryRaw<DailyBucket[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= ${windowStart} AND "createdAt" < ${todayEnd}
      GROUP BY day
      ORDER BY day ASC
    `;
    registrations = rows.map((r) => ({
      date: isoDay(new Date(r.day)),
      count: r.count,
    }));
  } catch (err) {
    console.error("[admin/analytics] registrations query failed:", err);
  }

  // ── Daily messages (raw SQL · Postgres date_trunc) ──────────────────
  let messages: Array<{ date: string; count: number }> = [];
  try {
    const rows = await db.$queryRaw<DailyBucket[]>`
      SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
      FROM "Message"
      WHERE "createdAt" >= ${windowStart} AND "createdAt" < ${todayEnd}
      GROUP BY day
      ORDER BY day ASC
    `;
    messages = rows.map((r) => ({
      date: isoDay(new Date(r.day)),
      count: r.count,
    }));
  } catch (err) {
    console.error("[admin/analytics] messages query failed:", err);
  }

  // ── Plan distribution ───────────────────────────────────────────────
  let plans: Array<{ plan: string; count: number; pct: number }> = [];
  try {
    const planOrder = ["free", "pro", "plus", "ultra", "business", "enterprise"];
    const rows = await db.user.groupBy({
      by: ["plan"],
      _count: true,
    });
    const totalPlanUsers = rows.reduce((a, b) => a + b._count, 0) || 1;
    const byPlan = new Map<string, number>();
    for (const r of rows as PlanBucket[]) byPlan.set(r.plan ?? "unknown", r._count);
    plans = planOrder
      .filter((p) => byPlan.has(p))
      .map((p) => ({
        plan: p,
        count: byPlan.get(p) || 0,
        pct: Math.round(((byPlan.get(p) || 0) / totalPlanUsers) * 1000) / 10,
      }));
    // Any plans outside the canonical list
    for (const [p, c] of byPlan.entries()) {
      if (!planOrder.includes(p)) {
        plans.push({ plan: p, count: c, pct: Math.round((c / totalPlanUsers) * 1000) / 10 });
      }
    }
  } catch (err) {
    console.error("[admin/analytics] plan distribution failed:", err);
  }

  // ── Workspace distribution (top 10) ─────────────────────────────────
  let workspaces: Array<{ workspaceType: string; count: number }> = [];
  try {
    const rows = await db.user.groupBy({
      by: ["workspaceType"],
      _count: true,
      orderBy: { _count: { workspaceType: "desc" } },
      take: 10,
    });
    workspaces = (rows as WorkspaceBucket[]).map((r) => ({
      workspaceType: r.workspaceType ?? "—",
      count: r._count,
    }));
  } catch (err) {
    console.error("[admin/analytics] workspace distribution failed:", err);
  }

  // ── Studio distribution ─────────────────────────────────────────────
  let studios: Array<{ studioType: string; count: number }> = [];
  try {
    const rows = await db.user.groupBy({
      by: ["studioType"],
      _count: true,
      orderBy: { _count: { studioType: "desc" } },
    });
    studios = (rows as StudioBucket[]).map((r) => ({
      studioType: r.studioType ?? "—",
      count: r._count,
    }));
  } catch (err) {
    console.error("[admin/analytics] studio distribution failed:", err);
  }

  // ── Retention (last 4 weekly cohorts) ───────────────────────────────
  const retention: RetentionRow[] = [];
  try {
    const weekStart = startOfDay(now);
    // Snap to most-recent Monday-ish: align on 7-day boundaries from today.
    // Cohort 0 = current week, Cohort 3 = 3 weeks ago.
    for (let i = 3; i >= 0; i--) {
      const cohortStart = addDays(weekStart, -7 * (i + 1));
      const cohortEnd = addDays(cohortStart, 7);

      // Get user IDs who signed up in this cohort
      const cohortUsers = await db.user.findMany({
        where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
        select: { id: true },
      });
      const userIds = cohortUsers.map((u) => u.id);

      const row: RetentionRow = {
        cohort: cohortStart.toISOString(),
        cohortLabel: cohortLabel(cohortStart),
        size: userIds.length,
        retention: [],
      };

      for (let w = 0; w < 4; w++) {
        const wStart = addDays(cohortStart, 7 * w);
        const wEnd = addDays(wStart, 7);
        const label = `W${w}`;
        if (wStart > now) {
          // Future week — no data yet
          row.retention.push({ weekOffset: w, label, active: 0, pct: null });
          continue;
        }
        if (userIds.length === 0) {
          row.retention.push({ weekOffset: w, label, active: 0, pct: null });
          continue;
        }
        // Count distinct users from cohort who sent ≥1 message that week.
        // Join Message → Conversation → User via raw SQL for performance.
        try {
          const activeRows = await db.$queryRaw<Array<{ count: number }>>`
            SELECT COUNT(DISTINCT c."userId")::int AS count
            FROM "Message" m
            JOIN "Conversation" c ON c.id = m."conversationId"
            WHERE c."userId" = ANY(${userIds}::text[])
              AND m."createdAt" >= ${wStart}
              AND m."createdAt" < ${wEnd}
          `;
          const active = activeRows[0]?.count ?? 0;
          const pct = userIds.length > 0
            ? Math.round((active / userIds.length) * 1000) / 10
            : 0;
          row.retention.push({ weekOffset: w, label, active, pct });
        } catch (err) {
          console.error(`[admin/analytics] retention cohort ${i} week ${w} failed:`, err);
          row.retention.push({ weekOffset: w, label, active: 0, pct: null });
        }
      }
      retention.push(row);
    }
  } catch (err) {
    console.error("[admin/analytics] retention failed:", err);
  }

  const body: AnalyticsResponse = {
    range,
    windowStart: windowStart.toISOString(),
    windowEnd: todayEnd.toISOString(),
    stats: {
      dau,
      wau,
      mau,
      newUsers,
      totalMessages,
      avgMessagesPerUser,
      totalUsers,
    },
    registrations,
    messages,
    plans,
    workspaces,
    studios,
    retention,
  };

  return NextResponse.json(body);
}
