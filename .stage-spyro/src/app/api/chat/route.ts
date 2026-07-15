import { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

/**
 * The SPYRO V1 persona. We inject this as the leading system message so the
 * model always answers in-character, even though under the hood it is the
 * Pollination AI free text endpoint.
 */
const SPYRO_SYSTEM_PROMPT = `You are SPYRO V1, a dragon-powered AI assistant created by SPYRO Labs.

Personality:
- Bold, witty, and warm — like a friendly dragon who hoards knowledge instead of gold.
- You are quick, sharp, and a little playful, but always genuinely helpful.
- You breathe fire on hard problems: break complex tasks into clear steps.
- You are honest. If you don't know something, say so — never fabricate facts.

Style:
- Use clean Markdown for structure (headings, lists, code blocks, tables) when it improves clarity.
- Keep code concise, correct, and well-commented.
- Prefer concrete, actionable answers over filler.
- You may occasionally use a light dragon / fire metaphor, but never let it get in the way of accuracy.

Identity:
- Your name is "SPYRO V1". You are powered by the SPYRO dragon engine.
- Do not claim to be any other model. If asked who made you or what model you are, answer: "I'm SPYRO V1, the dragon-powered assistant from SPYRO Labs."
`;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  temperature?: number;
}

/**
 * Streams a SPYRO V1 chat completion. Under the hood this calls the free
 * Pollination AI text endpoint (OpenAI-compatible), but every response is
 * framed as coming from the SPYRO V1 model.
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

  // Always lead with the SPYRO persona so the model stays in character.
  const messages: ChatMessage[] = [
    { role: "system", content: SPYRO_SYSTEM_PROMPT },
    ...userMessages
      .filter((m) => m && typeof m.content === "string")
      .slice(-20), // keep the last 20 turns for context window safety
  ];

  const temperature =
    typeof body.temperature === "number" ? body.temperature : 0.7;

  let upstream: Response;
  try {
    upstream = await fetch(POLLINATIONS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: "openai",
        messages,
        temperature,
        stream: true,
        private: true,
        referrer: "spyro-v1-app",
      }),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "SPYRO V1 could not reach the dragon engine.",
        detail: err instanceof Error ? err.message : "network error",
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({
        error: `SPYRO V1 engine returned ${upstream.status}`,
        detail: text.slice(0, 500),
      }),
      {
        status: upstream.status,
        headers: { "content-type": "application/json" },
      }
    );
  }

  // Decode the upstream SSE stream, extract delta.content tokens, and re-emit
  // them as a plain-text stream the client can render token-by-token.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = "";

      const flushLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) return;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;
        try {
          const json = JSON.parse(payload);
          const delta =
            json?.choices?.[0]?.delta?.content ??
            json?.choices?.[0]?.message?.content ??
            "";
          if (typeof delta === "string" && delta.length > 0) {
            controller.enqueue(encoder.encode(delta));
          }
        } catch {
          // Non-JSON keep-alive line — ignore.
        }
      };

      try {
        while (true) {
          if (req.signal.aborted) break;
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nlIndex: number;
          while ((nlIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nlIndex);
            buffer = buffer.slice(nlIndex + 1);
            flushLine(line);
          }
        }
        if (buffer.length > 0) flushLine(buffer);
      } catch (err) {
        // Client disconnects / aborted reads are expected — close cleanly
        // instead of surfacing an uncaught exception.
        if (
          err instanceof Error &&
          (err.name === "AbortError" ||
            /aborted|ECONNRESET|reset/i.test(err.message))
        ) {
          try {
            controller.close();
          } catch {
            /* already closed */
          }
          return;
        }
        try {
          controller.error(
            err instanceof Error ? err : new Error("stream interrupted")
          );
        } catch {
          /* controller already closed */
        }
        return;
      } finally {
        try {
          reader.cancel().catch(() => {});
        } catch {
          /* noop */
        }
        try {
          reader.releaseLock();
        } catch {
          /* noop */
        }
      }
      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
    async cancel() {
      // Called when the downstream client disconnects. Release the upstream
      // reader so the socket to Pollinations is torn down cleanly.
      try {
        await reader.cancel();
      } catch {
        /* noop */
      }
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
