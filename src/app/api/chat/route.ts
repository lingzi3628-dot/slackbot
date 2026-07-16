import { NextRequest, NextResponse } from "next/server";
import {
  getSpyroReply,
  SPYRO_MODELS,
  type SpyroMessage,
  type SpyroModelId,
} from "@/lib/spyro-engine";
import { runTools, formatToolResults } from "@/lib/tools";
import { getRateLimitForRequest, buildRateLimitHeaders } from "@/lib/rate-limit";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages: SpyroMessage[];
  temperature?: number;
  webSearch?: boolean;
  model?: SpyroModelId;
  /** Enable autonomous tool calling (web search, calculator). Default: true. */
  tools?: boolean;
}

/**
 * Web streaming endpoint with:
 *  - Multi-model support (openai, mistral, llama, deepseek, qwen-coder)
 *  - Autonomous tool calling (agent loop)
 *  - Langfuse observability (traced in spyro-engine)
 */

/** Manual web search (used when webSearch toggle is on, separate from tools). */
async function searchWeb(query: string): Promise<string> {
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();
    const results = await zai.functions.invoke("web_search", {
      query,
      num: 5,
    });
    if (!Array.isArray(results) || results.length === 0) return "";
    return results
      .map(
        (
          r: { name: string; url: string; snippet: string; date?: string },
          i: number
        ) => `[${i + 1}] ${r.name}\n${r.snippet}\nURL: ${r.url}`
      )
      .join("\n\n");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const apiKey = req.headers.get("x-api-key");
  const rateLimit = getRateLimitForRequest(ip, apiKey);
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

  const model = body.model ?? "openai";
  const toolsEnabled = body.tools !== false; // default: true

  let messages = userMessages;

  // ── 1. Manual web search (toggle in header) ────────────────────────
  if (body.webSearch) {
    const lastUser = [...userMessages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      const searchContext = await searchWeb(lastUser.content);
      if (searchContext) {
        messages = [
          {
            role: "system" as const,
            content:
              "Here are relevant web search results for the user's question. " +
              "Use them to ground your answer with current information. " +
              "Cite sources by number [1], [2], etc. when relevant.\n\n" +
              searchContext,
          },
          ...userMessages,
        ];
      }
    }
  }

  // ── 2. Autonomous tool calling (agent loop) ────────────────────────
  if (toolsEnabled && !body.webSearch) {
    const lastUser = [...userMessages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      const toolResults = await runTools(lastUser.content);
      if (toolResults) {
        messages = [
          {
            role: "system" as const,
            content:
              "You used tools to help answer the user's question. " +
              "Use the tool results below to provide an accurate answer. " +
              "Don't mention that you used a tool — just answer naturally.\n\n" +
              formatToolResults(toolResults),
          },
          ...userMessages,
        ];
      }
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

/** GET — health check + available models. */
export async function GET() {
  return Response.json({
    model: "SPYRO V1",
    status: "online",
    models: SPYRO_MODELS,
    tools: ["web_search", "calculator"],
    description:
      "Dragon-powered AI chat with tool calling + multi-model. POST { messages, model?, webSearch?, tools? } to stream.",
  });
}
