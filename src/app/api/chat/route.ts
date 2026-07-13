import { NextRequest } from "next/server";
import { getSpyroReply, type SpyroMessage } from "@/lib/spyro-engine";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface ChatRequestBody {
  messages: SpyroMessage[];
  temperature?: number;
}

/**
 * Web streaming endpoint — streams a SPYRO V1 reply token-by-token.
 * Delegates to the shared spyro-engine so all surfaces (web, Telegram,
 * future integrations) share one persona.
 */
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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await getSpyroReply(userMessages, {
          temperature: body.temperature,
          onToken: (token) => {
            // Emit the delta — the web client accumulates chunks itself.
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
      /* client disconnected — engine's fetch will be GC'd */
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
      "Dragon-powered AI chat. POST { messages: [{role, content}] } to stream a response.",
  });
}
