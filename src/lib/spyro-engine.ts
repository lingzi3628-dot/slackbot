/**
 * SPYRO V1 shared engine — used by all integrations (Telegram, Discord, etc.)
 * and the web streaming endpoint.
 *
 * This is the single source of truth for the SPYRO V1 persona. Every
 * integration calls getReply() with the conversation history and gets back
 * the full SPYRO V1 response.
 */
import { SPYRO_SYSTEM_PROMPT } from "./spyro-persona";

const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

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
 * Get a full SPYRO V1 reply. Streams internally; resolves with the complete
 * text when done. Integrations can use onToken to progressively edit a
 * message (e.g. Telegram "typing" → edit).
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

  return acc;
}
