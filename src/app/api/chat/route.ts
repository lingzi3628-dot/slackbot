import { NextRequest, NextResponse } from "next/server";
import {
  getSpyroReply,
  SPYRO_MODELS,
  type SpyroMessage,
  type SpyroModelId,
} from "@/lib/spyro-engine";
import { runTools, formatToolResults } from "@/lib/tools";
import { getSession } from "@/lib/session";
import {
  getRateLimitForRequest,
  buildRateLimitHeaders,
  getClientIp,
} from "@/lib/rate-limit";
import {
  sanitizeChatMessage,
  auditPrompt,
  buildSecureMessages,
  PINNED_MODEL,
  MAX_PROMPT_LENGTH,
} from "@/lib/ai-tools";
import { SPYRO_SYSTEM_PROMPT } from "@/lib/spyro-persona";

export const runtime = "nodejs"; // V8: was "edge" — needs Node for crypto + audit log
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages: SpyroMessage[];
  temperature?: number;
  webSearch?: boolean;
  model?: SpyroModelId; // ignored — model is pinned server-side
  tools?: boolean;
}

/**
 * Web streaming endpoint — hardened against prompt injection (V8).
 *
 * Security layers (in order):
 *  1. Rate limiting (per IP / per API key)
 *  2. Auth check (session optional, but enables tools if present)
 *  3. Input sanitization (null bytes, control chars, max length)
 *  4. SQL-injection pattern detection (reject if matched)
 *  5. Model pinning (server chooses — client cannot override)
 *  6. Security guardrail prepended to messages (non-overridable)
 *  7. Audit log every prompt (write-only)
 *  8. Tools disabled for anonymous users (auth required)
 */

/** Manual web search (used when webSearch toggle is on). */
async function searchWeb(query: string): Promise<string> {
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const results = await zai.functions.invoke("web_search", {
      query: query.slice(0, 200),
      num: 5,
    });
    if (!Array.isArray(results) || results.length === 0) return "";
    return results
      .map(
        (r: { name: string; url: string; snippet: string }, i: number) =>
          `[${i + 1}] ${r.name}\n${r.snippet}\nURL: ${r.url}`
      )
      .join("\n\n");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  // ── 1. Rate limiting ──────────────────────────────────────────────
  const ip = getClientIp(req);
  const apiKey = req.headers.get("x-api-key");
  const rateLimit = await getRateLimitForRequest(ip, apiKey);
  if (!rateLimit.allowed) {
    const minsLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Try again in ${minsLeft} minute${minsLeft === 1 ? "" : "s"}.`,
        rateLimited: true,
      },
      {
        status: 429,
        headers: buildRateLimitHeaders(rateLimit),
      }
    );
  }

  // ── 2. Parse body ─────────────────────────────────────────────────
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const userMessages = Array.isArray(body.messages) ? body.messages : [];
  if (userMessages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages provided" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // ── 3. Find the latest user message + sanitize it ────────────────
  const lastUserMsg = [...userMessages].reverse().find((m) => m.role === "user");
  if (!lastUserMsg || typeof lastUserMsg.content !== "string") {
    return new Response(JSON.stringify({ error: "No user message found" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // V8: sanitize + reject SQL-injection patterns
  const sanitized = sanitizeChatMessage(lastUserMsg.content);
  if (sanitized.rejected) {
    // Audit the rejection
    const session = getSession(req);
    await auditPrompt({
      userId: session?.id || null,
      ip,
      userAgent: req.headers.get("user-agent") || "unknown",
      prompt: lastUserMsg.content.slice(0, MAX_PROMPT_LENGTH),
      model: PINNED_MODEL,
      rejected: true,
      rejectionReason: sanitized.reason,
    });
    return NextResponse.json(
      { error: "Your message contains content that cannot be processed." },
      { status: 400 }
    );
  }

  // ── 4. Auth check (optional — enables tools) ─────────────────────
  const session = getSession(req);
  const isAuthenticated = !!session;

  // V8: model is pinned server-side — ignore client's model field.
  const model = PINNED_MODEL;
  // V8: tools disabled for anonymous users (auth required)
  const toolsEnabled = body.tools !== false && isAuthenticated;

  // ── 5. Audit log the prompt (write-only) ─────────────────────────
  await auditPrompt({
    userId: session?.id || null,
    ip,
    userAgent: req.headers.get("user-agent") || "unknown",
    prompt: sanitized.cleaned,
    model,
  });

  // ── 6. Build secure messages array (guardrail + sanitization) ────
  // Replace the last user message with the sanitized version.
  const sanitizedMessages = userMessages.map((m) =>
    m === lastUserMsg ? { ...m, content: sanitized.cleaned } : m
  );

  // V8: prepend the non-overridable security guardrail
  let messages = buildSecureMessages(sanitizedMessages, SPYRO_SYSTEM_PROMPT);

  // ── 7. Manual web search (toggle in header) ──────────────────────
  if (body.webSearch && isAuthenticated) {
    const searchContext = await searchWeb(sanitized.cleaned);
    if (searchContext) {
      messages = [
        ...messages,
        {
          role: "system" as const,
          content:
            "Here are relevant web search results for the user's question. " +
            "Use them to ground your answer with current information. " +
            "Cite sources by number [1], [2], etc. when relevant.\n\n" +
            searchContext,
        },
      ];
    }
  }

  // ── 8. Autonomous tool calling (auth required) ───────────────────
  if (toolsEnabled && !body.webSearch) {
    const toolResults = await runTools(sanitized.cleaned);
    if (toolResults) {
      messages = [
        ...messages,
        {
          role: "system" as const,
          content:
            "You used tools to help answer the user's question. " +
            "Use the tool results below to provide an accurate answer. " +
            "Don't mention that you used a tool — just answer naturally.\n\n" +
            formatToolResults(toolResults),
        },
      ];
    }
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await getSpyroReply(messages, {
          temperature: body.temperature,
          model,
          traceName: "web-chat",
          onToken: (token) => {
            controller.enqueue(encoder.encode(token));
          },
        });
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `\n\n**SPYRO V1 lost its fire.** ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          )
        );
      }
      controller.close();
    },
    cancel() {
      /* client disconnected */
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-content-type-options": "nosniff",
      "x-spyro-model": model,
      ...buildRateLimitHeaders(rateLimit),
    },
  });
}

/**
 * GET — minimal health check. V9 (round 2):
 * Unauthenticated users get only {"status":"online"}.
 * Authenticated users get the full model list + tools.
 */
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    // Unauthenticated: minimal response, no model/tool enumeration
    return Response.json({ status: "online" });
  }
  // Authenticated: show models + tools
  return Response.json({
    status: "online",
    models: SPYRO_MODELS,
    tools: ["web_search", "calculator"],
    description: "Dragon-powered AI chat. POST { messages } to stream.",
  });
}
