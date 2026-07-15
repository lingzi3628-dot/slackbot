/**
 * Langfuse observability — optional tracing for every SPYRO V1 AI call.
 *
 * When LANGFUSE_SECRET_KEY + LANGFUSE_PUBLIC_KEY are set, every
 * getSpyroReply() call is traced with input, output, latency, model, errors.
 *
 * When env vars are NOT set, tracing is a no-op (zero overhead).
 *
 * Setup: https://langfuse.com → create project → copy keys → add as
 * Vercel env vars: LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY,
 * LANGFUSE_BASE_URL (defaults to https://cloud.langfuse.com).
 */
import { Langfuse } from "langfuse";

const SECRET_KEY = process.env.LANGFUSE_SECRET_KEY;
const PUBLIC_KEY = process.env.LANGFUSE_PUBLIC_KEY;
const BASE_URL = process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com";

export const isLangfuseConfigured = !!(SECRET_KEY && PUBLIC_KEY);

let client: Langfuse | null = null;

export function getLangfuse(): Langfuse | null {
  if (!isLangfuseConfigured) return null;
  if (!client) {
    client = new Langfuse({
      secretKey: SECRET_KEY!,
      publicKey: PUBLIC_KEY!,
      baseUrl: BASE_URL,
      flushAt: 1,
    });
  }
  return client;
}

export interface TraceHandle {
  finish: (output: string, params: { error?: string }) => void;
}

/** Start a generation trace. Returns a handle to complete later. */
export function startTrace(params: {
  name: string;
  input: unknown;
  model: string;
  metadata?: Record<string, unknown>;
}): TraceHandle | null {
  const lf = getLangfuse();
  if (!lf) return null;

  const trace = lf.trace({
    name: params.name,
    metadata: params.metadata,
  });

  const generation = trace.generation({
    name: "spyro-reply",
    model: params.model,
    input: params.input,
  });

  return {
    finish: (output: string, opts: { error?: string }) => {
      generation.end({
        output,
        level: opts.error ? "ERROR" : "DEBUG",
      });
      lf.flushAsync().catch(() => {});
    },
  };
}

/** Flush any pending traces (call before a serverless function exits). */
export async function flushLangfuse(): Promise<void> {
  const lf = getLangfuse();
  if (lf) {
    await lf.flushAsync().catch(() => {});
  }
}
