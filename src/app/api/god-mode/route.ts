import { NextRequest } from "next/server";
import { runGodMode, type GodModeStep } from "@/lib/god-mode";
import type { SpyroMessage } from "@/lib/spyro-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — God Mode runs 4 agents sequentially

interface GodModeRequestBody {
  prompt: string;
  messages?: SpyroMessage[];
}

/**
 * God Mode endpoint — runs the multi-agent pipeline and streams progress
 * as NDJSON (newline-delimited JSON). Each line is either a step update
 * or the final result.
 *
 * Format:
 *   {"type":"step","step":{"agent":"Planner","status":"thinking",...}}
 *   {"type":"step","step":{"agent":"Planner","status":"done","output":"..."}}
 *   ...
 *   {"type":"done","finalAnswer":"..."}
 */
export async function POST(req: NextRequest) {
  let body: GodModeRequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: "No prompt provided" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      };

      try {
        await runGodMode(prompt, history, {
          onStep: (step: GodModeStep) => {
            send({ type: "step", step });
          },
        });

        // The final answer is in the last step's output.
        // We send it as a "done" event for the client to pick up.
        // (The client also gets it from the last step, but this is explicit.)
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
    },
  });
}

/** GET — health check. */
export async function GET() {
  return Response.json({
    mode: "God Mode",
    status: "online",
    agents: ["Planner", "Researcher", "Coder", "Synthesizer"],
    description:
      "Multi-agent collaboration. POST { prompt, messages? } to run the pipeline.",
  });
}
