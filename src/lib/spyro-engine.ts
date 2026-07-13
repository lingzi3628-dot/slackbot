/**
 * SPYRO V1 shared engine — used by all integrations (Telegram, Discord, etc.)
 * and the web streaming endpoint.
 *
 * Single source of truth for the SPYRO V1 persona.
 */
import { SPYRO_SYSTEM_PROMPT } from "./spyro-persona";

const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

/**
 * Strip Pollinations attribution / promotional text that may be appended
 * to responses. The persona prompt already forbids it, but this is a
 * belt-and-suspenders server-side filter.
 */
function stripAttribution(text: string): string {
  let out = text;
  // Remove common Pollinations promo lines (case-insensitive, anywhere).
  const patterns = [
    /\s*\[?\s*powered by\s+pollinations\.ai\s*\]?\s*$/i,
    /\s*—\s*pollinations\.ai\s*$/i,
    /\s*pollinations\.ai\s*$/i,
    /\s*\n+https?:\/\/pollinations\.ai\/?\s*$/i,
    /\s*\n+\*\*powered by.*pollinations.*\*\*\s*$/i,
    /\s*\n+image\s+by\s+pollinations.*$/i,
    /\s*\n+generated\s+(?:by|with)\s+pollinations.*$/i,
  ];
  for (const p of patterns) {
    out = out.replace(p, "");
  }
  return out;
}

export interface SpyroMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SpyroReplyOptions {
  temperature?: number;
  signal?: AbortSignal;
  /** Called as the response streams in — integrations can use this for live edits. */
  onToken?: (token: string, accumulated: string) => void;
}

/**
 * Get a full SPYRO V1 reply (non-streaming). Best for integrations like
 * Telegram where we need the complete text before replying.
 *
 * Uses stream:false to get the full response in one shot — more reliable
 * on serverless runtimes (Vercel Node.js) where streaming can be flaky.
 */
export async function getSpyroReply(
  messages: SpyroMessage[],
  options: SpyroReplyOptions = {}
): Promise<string> {
  const fullMessages: SpyroMessage[] = [
    { role: "system", content: SPYRO_SYSTEM_PROMPT },
    ...messages
      .filter((m) => m && typeof m.content === "string")
      .slice(-20),
  ];

  const temperature = options.temperature ?? 0.7;

  // First try streaming (for the onToken callback), fall back to non-streaming.
  if (options.onToken) {
    try {
      return await getSpyroReplyStreaming(fullMessages, temperature, options);
    } catch (err) {
      // Streaming failed — fall through to non-streaming.
      console.error("[spyro-engine] streaming failed, falling back:", err);
    }
  }

  // Non-streaming fallback — more reliable on serverless.
  const res = await fetch(POLLINATIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      model: "openai",
      messages: fullMessages,
      temperature,
      stream: false,
      private: true,
      referrer: "spyro-v1-app",
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SPYRO V1 engine error: ${res.status} ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const rawContent =
    data?.choices?.[0]?.message?.content ??
    data?.choices?.[0]?.delta?.content ??
    "";
  const content = stripAttribution(rawContent);

  if (typeof content === "string" && content.length > 0) {
    options.onToken?.(content, content);
  }

  return content;
}

/**
 * Streaming variant — used when onToken is provided and streaming works.
 */
async function getSpyroReplyStreaming(
  fullMessages: SpyroMessage[],
  temperature: number,
  options: SpyroReplyOptions
): Promise<string> {
  const res = await fetch(POLLINATIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({
      model: "openai",
      messages: fullMessages,
      temperature,
      stream: true,
      private: true,
      referrer: "spyro-v1-app",
    }),
    signal: options.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`SPYRO V1 engine error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let acc = "";

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
        acc += delta;
        options.onToken?.(delta, acc);
      }
    } catch {
      /* ignore keep-alive lines */
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      flushLine(line);
    }
  }
  if (buffer.length > 0) flushLine(buffer);

  if (!acc) throw new Error("Empty streaming response");
  return stripAttribution(acc);
}
