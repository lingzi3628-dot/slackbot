import { NextRequest } from "next/server";
import { getSpyroReply, type SpyroMessage } from "@/lib/spyro-engine";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages: SpyroMessage[];
  temperature?: number;
  webSearch?: boolean;
}

/**
 * Web streaming endpoint — uses the SPYRO V1 engine (direct Pollinations
 * fetch + manual SSE parsing) for maximum reliability.
 *
 * The Vercel AI SDK (`ai` + `@ai-sdk/openai`) is installed and available
 * for future tool-calling enhancements, but the current Pollinations
 * streaming format is better handled by the custom engine.
 */

/** Web search — injects live results as context when webSearch is on. */
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

  let messages = userMessages;

  // Web search mode.
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await getSpyroReply(messages, {
          temperature: body.temperature,
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
      "x-spyro-model": "SPYRO-V1",
    },
  });
}

export async function GET() {
  return Response.json({
    model: "SPYRO V1",
    status: "online",
    description:
      "Dragon-powered AI chat. POST { messages, webSearch? } to stream a response.",
  });
}
