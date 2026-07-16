import { NextResponse } from "next/server";
import { SECURITY_HEADERS } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * API Documentation — returns all available endpoints, parameters,
 * rate limits, and usage examples.
 */
export async function GET() {
  return NextResponse.json({
    name: "SPYRO V1 API",
    version: "2.0.0",
    baseUrl: "https://slackbot-seven.vercel.app/api",
    description: "Dragon-powered AI chat API. Free, no API key required for basic usage.",

    authentication: {
      type: "API Key (optional)",
      header: "x-api-key",
      description: "Anonymous requests: 20/min. With API key: 100/min. Generate a key in the Integrations page.",
    },

    rateLimits: {
      anonymous: "20 requests / minute per IP",
      authenticated: "100 requests / minute per API key",
      imageGeneration: "10 images / hour per IP",
    },

    endpoints: [
      {
        path: "/api/chat",
        method: "POST",
        auth: "Optional (x-api-key header)",
        description: "Stream a SPYRO V1 chat response token-by-token.",
        parameters: {
          messages: "Array<{ role: 'user'|'assistant'|'system', content: string }> — required",
          model: "string — 'openai' (default) or 'openai-fast'",
          temperature: "number — 0-1 (default 0.7)",
          webSearch: "boolean — enable web search for current info",
          tools: "boolean — enable auto tool calling (default true)",
        },
        response: "text/plain (streamed tokens)",
        example: `fetch("/api/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello SPYRO!" }]
  })
})`,
      },
      {
        path: "/api/chat",
        method: "GET",
        description: "Health check — returns available models + tools.",
      },
      {
        path: "/api/god-mode",
        method: "POST",
        auth: "Optional",
        description: "Run God Mode — 4-agent multi-agent collaboration.",
        parameters: {
          prompt: "string — required",
          messages: "Array — conversation history (optional)",
        },
        response: "application/x-ndjson (streamed progress + result)",
      },
      {
        path: "/api/image-gen",
        method: "POST",
        description: "Generate an image from text (Pollinations AI + SPYRO watermark).",
        parameters: {
          prompt: "string — required",
          size: "string — '1024x1024' (default), '768x1344', '1344x768'",
        },
        response: "JSON { image: 'data:image/jpeg;base64,...' }",
        rateLimit: "10 / hour per IP",
      },
      {
        path: "/api/image-edit",
        method: "POST",
        description: "Edit an uploaded image (filters, adjustments, transforms).",
        parameters: {
          image: "string — base64 data URL — required",
          operation: "string — brightness, contrast, grayscale, sepia, blur, etc.",
          params: "object — { value: number } for slider operations",
        },
        response: "JSON { image: 'data:image/jpeg;base64,...' }",
      },
      {
        path: "/api/remove-bg",
        method: "POST",
        description: "Remove image background (AI cutout engine).",
        parameters: {
          image: "string — base64 data URL — required",
          tolerance: "number — 5-50 (default 15)",
          feather: "boolean — smooth edges (default true)",
        },
        response: "JSON { image: 'data:image/png;base64,...' }",
      },
      {
        path: "/api/transcribe",
        method: "POST",
        description: "Speech to text (ASR).",
        parameters: { audio: "string — base64 audio — required" },
        response: "JSON { text: 'transcribed text' }",
      },
      {
        path: "/api/tts",
        method: "POST",
        description: "Text to speech (TTS).",
        parameters: {
          text: "string — required (max 1000 chars)",
          voice: "string — 'tongtong' (default)",
          speed: "number — 0.5-2.0 (default 1.0)",
        },
        response: "audio/wav (binary)",
      },
      {
        path: "/api/web-scout",
        method: "POST",
        description: "Web search + AI summary.",
        parameters: { query: "string — required" },
        response: "JSON { results: [...], summary: 'AI summary' }",
      },
      {
        path: "/api/telegram/webhook",
        method: "POST",
        description: "Telegram bot webhook (called by Telegram, not users).",
      },
      {
        path: "/api/telegram/set-webhook",
        method: "POST",
        description: "Register a Telegram bot webhook.",
        parameters: { token: "string — Telegram bot token" },
      },
      {
        path: "/api/auth/register",
        method: "POST",
        description: "Create a new user account.",
        parameters: { name: "string", email: "string", password: "string (min 6)" },
      },
      {
        path: "/api/auth/login",
        method: "POST",
        description: "Sign in with email + password.",
      },
      {
        path: "/api/auth/send-code",
        method: "POST",
        description: "Send 6-digit email verification code.",
      },
      {
        path: "/api/auth/verify-code",
        method: "POST",
        description: "Verify email code → set session cookie.",
      },
      {
        path: "/api/auth/me",
        method: "GET",
        description: "Get current user from session cookie.",
      },
      {
        path: "/api/auth/logout",
        method: "POST",
        description: "Clear session cookie.",
      },
      {
        path: "/api/health",
        method: "GET",
        description: "Database + environment health check.",
      },
      {
        path: "/api/security",
        method: "GET",
        description: "Security audit — headers, rate limits, env status.",
      },
    ],

    security: {
      headers: SECURITY_HEADERS,
      cors: "All origins allowed (Access-Control-Allow-Origin: *)",
      cookies: "HttpOnly, Secure, SameSite=Lax, 7-day expiry",
      passwords: "bcrypt (10 rounds)",
      sessions: "base64url token in HttpOnly cookie",
    },

    errors: {
      400: "Bad Request — missing or invalid parameters",
      401: "Unauthorized — invalid API key or password",
      403: "Forbidden — rate limit exceeded or access denied",
      404: "Not Found — endpoint or resource not found",
      429: "Rate Limited — too many requests. Check X-RateLimit-Reset header.",
      500: "Server Error — check /api/health for diagnostics",
      502: "Bad Gateway — upstream AI provider error",
    },
  }, { headers: { "content-type": "application/json" } });
}
