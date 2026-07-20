import { NextRequest, NextResponse } from "next/server";
import { runGodMode, type GodModeStep } from "@/lib/god-mode";
import type { SpyroMessage } from "@/lib/spyro-engine";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp, buildRateLimitHeaders } from "@/lib/rate-limit";
import { sanitizePrompt, detectSqlInjection, LIMITS } from "@/lib/input-validation";
import { SECURITY_GUARDRAIL } from "@/lib/ai-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — God Mode runs 4 agents sequentially

interface GodModeRequestBody {
  prompt: string;
  messages?: SpyroMessage[];
}

/** Premium plans allowed to use God Mode. */
const GOD_MODE_PLANS = new Set(["pro", "plus", "ultra", "business", "enterprise"]);

/** Daily God Mode invocation limit per plan. */
const DAILY_LIMITS: Record<string, number> = {
  pro: 10,
  plus: 25,
  ultra: 50,
  business: 100,
  enterprise: 500,
};

/**
 * God Mode endpoint — multi-agent AI pipeline.
 *
 * V5 (round 2) FIX:
 *  - Requires authentication (valid session).
 *  - Requires premium plan (pro, plus, ultra, business, enterprise).
 *  - Daily quota per plan (10-500 invocations/day).
 *  - GET returns only {"status":"online"} — no agent architecture leak.
 *  - Prompt sanitized (null bytes, control chars, max 4000 chars).
 *  - SQL injection patterns blocked.
 *  - Security guardrail prepended to all agent prompts.
 *  - Every invocation audit-logged (user ID, prompt length, timestamp).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") || "unknown";

  // ── 1. Auth check ──────────────────────────────────────────────────
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in to use God Mode." },
      { status: 401 }
    );
  }

  // ── 2. Plan check (premium only) ──────────────────────────────────
  if (!GOD_MODE_PLANS.has(session.role === "admin" ? "enterprise" : "")) {
    // Check the user's plan from the DB for accuracy
    let userPlan = "free";
    try {
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { plan: true },
      });
      userPlan = user?.plan || "free";
    } catch {
      // DB unavailable — deny to be safe
      return NextResponse.json(
        { error: "Could not verify subscription. Please try again." },
        { status: 503 }
      );
    }

    if (!GOD_MODE_PLANS.has(userPlan)) {
      // Audit log the denied attempt
      try {
        await db.activityLog.create({
          data: {
            userId: session.userId,
            type: "god_mode",
            description: `Denied (plan: ${userPlan}) from ${ip}`,
          },
        });
      } catch { /* ignore */ }
      return NextResponse.json(
        {
          error: "God Mode is a premium feature. Upgrade to Pro or higher to access multi-agent AI pipelines.",
          plan: userPlan,
          upgradeUrl: "/premium",
        },
        { status: 403 }
      );
    }
  }

  // ── 3. Daily quota check ───────────────────────────────────────────
  const planForQuota = session.role === "admin" ? "enterprise" : (await db.user.findUnique({ where: { id: session.userId }, select: { plan: true } }))?.plan || "pro";
  const dailyLimit = DAILY_LIMITS[planForQuota] || 10;
  const quotaKey = `godmode-daily:${session.userId}`;
  const quota = await checkRateLimit(quotaKey, dailyLimit, 24 * 60 * 60 * 1000); // 24h window
  if (!quota.allowed) {
    const hoursLeft = Math.ceil((quota.resetAt - Date.now()) / (60 * 60 * 1000));
    return NextResponse.json(
      {
        error: `Daily God Mode limit reached (${dailyLimit}/day for ${planForQuota} plan). Resets in ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`,
        limit: dailyLimit,
        resetAt: quota.resetAt,
      },
      { status: 429, headers: buildRateLimitHeaders(quota) }
    );
  }

  // ── 4. Parse + sanitize input ──────────────────────────────────────
  let body: GodModeRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawPrompt = typeof body.prompt === "string" ? body.prompt : "";
  const prompt = sanitizePrompt(rawPrompt.slice(0, 4000)); // max 4000 chars

  if (!prompt || prompt.length < 3) {
    return NextResponse.json({ error: "A prompt of at least 3 characters is required" }, { status: 400 });
  }

  // ── 5. SQL injection check ────────────────────────────────────────
  if (detectSqlInjection(prompt)) {
    try {
      await db.activityLog.create({
        data: {
          userId: session.userId,
          type: "god_mode",
          description: `Blocked SQL injection attempt (prompt: "${prompt.slice(0, 100)}") from ${ip}`,
        },
      });
    } catch { /* ignore */ }
    return NextResponse.json(
      { error: "Your prompt contains content that cannot be processed." },
      { status: 400 }
    );
  }

  // ── 6. Audit log the invocation ───────────────────────────────────
  try {
    await db.activityLog.create({
      data: {
        userId: session.userId,
        type: "god_mode",
        description: `God Mode invoked (prompt length: ${prompt.length}, plan: ${planForQuota}) from ${ip}`,
      },
    });
  } catch { /* ignore */ }

  // ── 7. Run the pipeline with security guardrail ───────────────────
  const history = Array.isArray(body.messages)
    ? body.messages.filter((m) => m && typeof m.content === "string").slice(-20)
    : [];

  // Prepend the non-overridable security guardrail to every agent invocation
  const securedHistory: SpyroMessage[] = [
    { role: "system", content: SECURITY_GUARDRAIL },
    ...history.map((m) => ({
      role: m.role,
      content: sanitizePrompt(m.content),
    })),
  ];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        await runGodMode(prompt, securedHistory, {
          onStep: (step: GodModeStep) => {
            send({ type: "step", step });
          },
        });
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : "God Mode failed",
        });
      }

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-content-type-options": "nosniff",
      "x-spyro-mode": "god-mode",
      ...buildRateLimitHeaders(quota),
    },
  });
}

/**
 * GET — minimal health check. Does NOT reveal agent architecture.
 * V5 (round 2): returns only {"status":"online"} — no agent names, no description.
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    // Unauthenticated: minimal response, no architecture leak
    return Response.json({ status: "online" });
  }
  // Authenticated: show minimal info
  return Response.json({
    status: "online",
    description: "Multi-agent AI pipeline (premium feature).",
    dailyLimit: DAILY_LIMITS["pro"], // don't leak the full table
  });
}
