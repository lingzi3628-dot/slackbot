import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, hasPermission } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Plan → monthly price in KES. Matches /src/lib/premium-plans.ts */
const PLAN_PRICE_KES: Record<string, number> = {
  free: 0,
  pro: 499,
  plus: 1299,
  ultra: 2999,
  business: 7999,
  enterprise: 24999,
};
const PREMIUM_PLANS = ["pro", "plus", "ultra", "business", "enterprise"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

/** GET /api/admin/billing — return billing & subscription stats. */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session || !hasPermission(session.role, "billing.*")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // 1. Plan distribution: count users grouped by plan
  const planGroups = await db.user.groupBy({
    by: ["plan"],
    _count: { _all: true },
  });
  const planCounts: Record<string, number> = {};
  for (const g of planGroups) planCounts[g.plan] = g._count._all;

  const totalUsers = Object.values(planCounts).reduce((a, b) => a + b, 0);
  const freeUsers = planCounts["free"] || 0;
  const activeSubs = PREMIUM_PLANS.reduce(
    (sum, p) => sum + (planCounts[p] || 0),
    0,
  );

  // 2. MRR & revenue by plan — count × static price map
  const revenueByPlan = PREMIUM_PLANS.map((plan) => {
    const count = planCounts[plan] || 0;
    const price = PLAN_PRICE_KES[plan] || 0;
    return { plan, count, priceKES: price, revenueKES: count * price };
  });
  const mrr = revenueByPlan.reduce((s, r) => s + r.revenueKES, 0);

  // 3. Plan distribution (free vs each premium)
  const planDistribution = [
    { plan: "free", count: freeUsers, pct: totalUsers ? Math.round((freeUsers / totalUsers) * 1000) / 10 : 0 },
    ...PREMIUM_PLANS.map((plan) => ({
      plan,
      count: planCounts[plan] || 0,
      pct: totalUsers ? Math.round(((planCounts[plan] || 0) / totalUsers) * 1000) / 10 : 0,
    })),
  ];

  // 4. Churned (30d) — best-effort proxy: users on `free` whose updatedAt is in the last 30d.
  //    Without subscription history we can't track real churn; we surface this honestly.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const churned30d = await db.user.count({
    where: { plan: "free", updatedAt: { gte: thirtyDaysAgo } },
  });

  // 5. Recent transactions — most recent 20 premium users.
  //    Try Subscription.createdAt first; fall back to User.updatedAt.
  const recentPremiumUsers = await db.user.findMany({
    where: { plan: { in: PREMIUM_PLANS } },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true, name: true, email: true, plan: true, createdAt: true, updatedAt: true,
    },
  });

  const subsForRecent = recentPremiumUsers.length
    ? await db.subscription.findMany({
        where: { userId: { in: recentPremiumUsers.map((u) => u.id) } },
        orderBy: { createdAt: "desc" },
        select: { userId: true, createdAt: true, paystackRef: true, amountKES: true, status: true },
      })
    : [];
  const subByUser = new Map<string, (typeof subsForRecent)[number]>();
  for (const s of subsForRecent) {
    if (!subByUser.has(s.userId)) subByUser.set(s.userId, s);
  }

  const recentTransactions = recentPremiumUsers.map((u) => {
    const sub = subByUser.get(u.id);
    return {
      userId: u.id,
      name: u.name,
      email: u.email,
      plan: u.plan,
      amountKES: PLAN_PRICE_KES[u.plan] || 0,
      startDate: sub?.createdAt || u.updatedAt,
      paystackRef: sub?.paystackRef || null,
      hasSubscriptionRecord: !!sub,
    };
  });

  // 6. Subscription growth — premium users by signup month (last 6 months)
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = monthKey(d);
    months.push({ key: k, label: monthLabel(k) });
  }
  const monthStart = new Date(months[0].key + "-01T00:00:00Z");
  const monthEnd = new Date(months[months.length - 1].key + "-01T00:00:00Z");
  monthEnd.setMonth(monthEnd.getMonth() + 1); // first day of next month

  const premiumUsersInWindow = await db.user.findMany({
    where: {
      plan: { in: PREMIUM_PLANS },
      createdAt: { gte: monthStart, lt: monthEnd },
    },
    select: { createdAt: true },
  });
  const countsByMonth: Record<string, number> = {};
  for (const m of months) countsByMonth[m.key] = 0;
  for (const u of premiumUsersInWindow) {
    const k = monthKey(u.createdAt);
    if (k in countsByMonth) countsByMonth[k]++;
  }
  const subscriptionGrowth = months.map((m) => ({
    month: m.label,
    key: m.key,
    count: countsByMonth[m.key],
  }));

  return NextResponse.json({
    stats: {
      mrr,
      activeSubs,
      freeUsers,
      churned30d,
      churnIsApproximation: true,
      currency: "KES",
    },
    revenueByPlan,
    planDistribution,
    recentTransactions,
    subscriptionGrowth,
    generatedAt: new Date().toISOString(),
  });
}
