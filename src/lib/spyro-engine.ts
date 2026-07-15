/**
 * SPYRO V1 shared engine — used by all integrations (Telegram, Discord, etc.)
 * and the web streaming endpoint.
 *
 * Features:
 * - Multi-model support (openai, mistral, llama, etc. via Pollinations)
 * - Langfuse observability (optional, no-op when not configured)
 * - Tool calling (agent loop — see src/lib/tools.ts)
 * - Attribution stripping (removes Pollinations watermarks)
 */
import { SPYRO_SYSTEM_PROMPT } from "./spyro-persona";
import { startTrace, flushLangfuse, isLangfuseConfigured } from "./langfuse";

const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

/** Available Pollinations models. */
export const SPYRO_MODELS = [
  { id: "openai", label: "SPYRO V1 (Default)", description: "Balanced, fast, versatile" },
  { id: "openai-large", label: "SPYRO V1 Max", description: "Larger model, higher quality" },
  { id: "mistral", label: "SPYRO V1 Mist", description: "Mistral — great for code" },
  { id: "llama", label: "SPYRO V1 Llama", description: "Llama — open + capable" },
  { id: "deepseek", label: "SPYRO V1 Deep", description: "DeepSeek — reasoning focus" },
  { id: "qwen-coder", label: "SPYRO V1 Coder", description: "Qwen Coder — code specialist" },
] as const;

export type SpyroModelId = (typeof SPYRO_MODELS)[number]["id"];

export interface SpyroMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SpyroReplyOptions {
  temperature?: number;
  signal?: AbortSignal;
  model?: SpyroModelId;
  onToken?: (token: string, accumulated: string) => void;
  /** Langfuse trace name (e.g. "web-chat", "telegram-reply"). */
  traceName?: string;
}

/** Strip Pollinations attribution / promotional text. */
function stripAttribution(text: string): string {
  let out = text;
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

/**
 * Get a full SPYRO V1 reply. Tries streaming first (if onToken provided),
 * falls back to non-streaming for serverless reliability.
 */
export async function getSpyroReply(
  messages: SpyroMessage[],
  options: SpyroReplyOptions = {}
): Promise<string> {
  const model = options.model ?? "openai";
  const fullMessages: SpyroMessage[] = [
    { role: "system", content: SPYRO_SYSTEM_PROMPT },
    ...messages
      .filter((m) => m && typeof m.content === "string")
      .slice(-20),
  ];

  const temperature = options.temperature ?? 0.7;

  // Start Langfuse trace (no-op if not configured).
  const trace = startTrace({
    name: options.traceName ?? "spyro-reply",
    input: fullMessages,
    model,
    metadata: { temperature, streaming: !!options.onToken },
  });

  let result: string;
  try {
    if (options.onToken) {
      try {
        result = await getSpyroReplyStreaming(fullMessages, temperature, model, options);
      } catch (err) {
        console.error("[spyro-engine] streaming failed, falling back:", err);
        result = await getSpyroReplyNonStreaming(fullMessages, temperature, model, options);
      }
    } else {
      result = await getSpyroReplyNonStreaming(fullMessages, temperature, model, options);
    }

    trace?.finish(result, {});
    return result;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    trace?.finish(errMsg, { error: errMsg });
    throw err;
  } finally {
    if (isLangfuseConfigured) {
      await flushLangfuse().catch(() => {});
    }
  }
}

/** Non-streaming fetch — more reliable on serverless. */
async function getSpyroReplyNonStreaming(
  fullMessages: SpyroMessage[],
  temperature: number,
  model: string,
  options: SpyroReplyOptions
): Promise<string> {
  const res = await fetch(POLLINATIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      model,
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

/** Streaming variant — used when onToken is provided. */
async function getSpyroReplyStreaming(
  fullMessages: SpyroMessage[],
  temperature: number,
  model: string,
  options: SpyroReplyOptions
): Promise<string> {
  const res = await fetch(POLLINATIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
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
