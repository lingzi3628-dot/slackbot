import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { sanitizeString } from "@/lib/input-validation";
import { handleApiError } from "@/lib/error-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Text-to-speech endpoint. Receives text, returns WAV audio.
 *
 * Hardening (round 3):
 *  - Auth required (session).
 *  - Rate limited: 50 TTS calls/day per user (≈1000 chars/day).
 *  - Input sanitized (strip null bytes, control chars, max 1000 chars).
 *  - Audit logged.
 */
export async function POST(req: NextRequest) {
  try {
    // ── 1. Auth check ──────────────────────────────────────────────────
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    // ── 2. Rate limit: 50/day per user ─────────────────────────────────
    const rl = await checkRateLimit(`tts:${session.userId}`, 50, 24 * 60 * 60 * 1000);
    if (!rl.allowed) {
      const hours = Math.ceil((rl.resetAt - Date.now()) / (60 * 60 * 1000));
      return NextResponse.json(
        { error: `Daily TTS limit reached. Resets in ${hours} hour${hours === 1 ? "" : "s"}.` },
        { status: 429, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 3. Parse + sanitize input ──────────────────────────────────────
    const { text, voice = "tongtong", speed = 1.0 } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided. Send { text: '...' }" },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    const truncated = sanitizeString(text, 1000);
    if (!truncated) {
      return NextResponse.json(
        { error: "Text is empty after sanitization." },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 4. Call TTS API ────────────────────────────────────────────────
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.audio.tts.create({
      input: truncated,
      voice,
      speed,
      response_format: "wav",
      stream: false,
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // ── 5. Audit log ───────────────────────────────────────────────────
    try {
      await db.activityLog.create({
        data: {
          userId: session.userId,
          type: "tts",
          description: `TTS (${truncated.length} chars)`,
        },
      });
    } catch { /* ignore */ }

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": "audio/wav",
        "content-length": buffer.length.toString(),
        "cache-control": "no-cache",
        ...buildRateLimitHeaders(rl),
      },
    });
  } catch (err) {
    return handleApiError(err, "POST /api/tts");
  }
}
