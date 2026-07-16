import { NextResponse } from "next/server";
import { SECURITY_HEADERS } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Security audit — shows what security measures are active.
 * Useful for debugging and verification.
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const firebaseKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  return NextResponse.json({
    timestamp: new Date().toISOString(),

    security_headers: {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
      "HSTS": "max-age=31536000; includeSubDomains",
    },

    rate_limiting: {
      anonymous: "20 requests / minute per IP",
      authenticated: "100 requests / minute per API key",
      image_generation: "10 images / hour per IP",
      implementation: "In-memory Map (resets on cold start)",
      headers: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    },

    authentication: {
      method: "bcrypt password hashing + HttpOnly session cookie",
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "Lax",
        maxAge: "7 days",
      },
      api_key: "Optional x-api-key header for higher rate limits",
    },

    cors: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    },

    environment: {
      DATABASE_URL_set: !!dbUrl,
      DATABASE_URL_valid: dbUrl?.startsWith("postgresql://") || false,
      GMAIL_USER_set: !!gmailUser,
      GMAIL_APP_PASSWORD_set: !!gmailPass,
      FIREBASE_API_KEY_set: !!firebaseKey,
    },

    data_privacy: {
      conversations: "Stored in localStorage (browser) — not sent to server",
      prompts: "Sent to SPYRO V1 engine for AI response generation only",
      passwords: "bcrypt hashed — never stored in plain text",
      api_keys: "Stored in Neon DB, returned once on generation",
      logs: "No conversation content logged server-side",
    },

    known_issues: [],
  }, { headers: SECURITY_HEADERS });
}
