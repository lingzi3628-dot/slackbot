import { NextRequest, NextResponse } from "next/server";
import { PLANS, type PlanId } from "@/lib/premium-plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/premium/usage
 * Returns the user's current usage (tokens, images, etc.)
 * In production, this reads from the database. For now, uses localStorage
 * values sent from the client.
 */
export async function GET(req: NextRequest) {
  const planCookie = req.cookies.get("spyro-plan")?.value;
  const planId: PlanId = (planCookie as PlanId) || "free";
  const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

  return NextResponse.json({
    planId: plan.id,
    limits: plan.features,
    // In production, these would be actual usage counts from the DB
    usage: {
      tokens: 0,
      images: 0,
      emails: 0,
      agents: 0,
      knowledge: 0,
    },
  });
}

/**
 * POST /api/premium/usage
 * Check if the user can perform an action (e.g., "can I generate an image?")
 * Body: { action: "image" | "token" | "email" | "agent" }
 */
export async function POST(req: NextRequest) {
  const { action } = await req.json();
  const planCookie = req.cookies.get("spyro-plan")?.value;
  const planId: PlanId = (planCookie as PlanId) || "free";
  const plan = PLANS.find((p) => p.id === planId) || PLANS[0];

  const limits = plan.features;

  let allowed = true;
  let limit = 0;
  let reason = "";

  switch (action) {
    case "terminal":
      allowed = limits.terminal;
      if (!allowed) reason = "Terminal access requires Pro or higher. Upgrade to run real commands on the VPS.";
      break;
    case "agents":
      allowed = limits.agents;
      if (!allowed) reason = "Building AI agents requires Pro or higher.";
      break;
    case "studio":
      allowed = limits.studio;
      if (!allowed) reason = "SPYRO Studio requires Pro or higher.";
      break;
    case "whatsapp":
      allowed = limits.whatsapp;
      if (!allowed) reason = "WhatsApp connection requires Pro or higher.";
      break;
    case "image":
      limit = limits.imageGen;
      allowed = limit > 0 || limit === -1;
      if (!allowed) reason = "Image generation limit reached. Upgrade for more.";
      break;
    case "email":
      limit = limits.emailVerif;
      allowed = limit > 0 || limit === -1;
      if (!allowed) reason = "Email verification limit reached. Upgrade for more.";
      break;
    case "api":
      allowed = limits.apiAccess;
      if (!allowed) reason = "API access requires Pro or higher.";
      break;
    case "integrations":
      allowed = limits.apiAccess; // integrations same tier as API
      if (!allowed) reason = "Connecting Telegram, Discord, WhatsApp, and other integrations requires Pro or higher.";
      break;
    default:
      allowed = true;
  }

  return NextResponse.json({ allowed, limit, reason, planId: plan.id, planName: plan.name });
}
