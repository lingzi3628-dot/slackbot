import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/premium-plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/premium/status
 * Returns the user's current plan and feature access.
 * Reads the plan from the cookie (in production: from the database).
 */
export async function GET(req: NextRequest) {
  const planCookie = req.cookies.get("spyro-plan")?.value;
  const planId: PlanId = (planCookie as PlanId) || "free";
  const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

  return NextResponse.json({
    planId: plan.id,
    planName: plan.name,
    features: plan.features,
    featureList: plan.featureList,
    isPremium: plan.id !== "free",
  });
}
