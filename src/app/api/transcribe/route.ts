import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  buildRateLimitHeaders,
} from "@/lib/rate-limit";
import {
  validateFileType,
  ALLOWED_AUDIO_TYPES,
} from "@/lib/input-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Max audio size: 25 MB (Whisper's limit). */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/**
 * Speech-to-text endpoint. Receives base64 audio, returns transcribed text.
 *
 * V10 (round 2) FIX:
 *  - Requires authentication (valid session).
 *  - File size limit: 25 MB (Whisper's limit).
 *  - File type validation via magic bytes (mp3, mp4, mpeg, mpga, m4a, wav, webm).
 *  - Rate limited: 60 minutes of audio per day per user (approx 60 calls/day).
 *  - Audio is NOT stored — processed in memory, then garbage-collected.
 *  - GET returns minimal {"status":"online"} — no params leak.
 */
export async function POST(req: NextRequest) {
  // ── 1. Auth check ──────────────────────────────────────────────────
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in." },
      { status: 401 }
    );
  }

  // ── 2. Rate limit: 60 calls/day per user (≈60 min of audio) ────────
  const rl = await checkRateLimit(`transcribe:${session.userId}`, 60, 24 * 60 * 60 * 1000);
  if (!rl.allowed) {
    const hoursLeft = Math.ceil((rl.resetAt - Date.now()) / (60 * 60 * 1000));
    return NextResponse.json(
      {
        error: `Daily transcription limit reached (60/day). Resets in ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"}.`,
      },
      { status: 429, headers: buildRateLimitHeaders(rl) }
    );
  }

  try {
    // ── 3. Parse body ─────────────────────────────────────────────────
    const { audio } = await req.json();
    if (!audio || typeof audio !== "string") {
      return NextResponse.json(
        { error: "No audio provided. Send { audio: '<base64>' }" },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 4. Decode base64 ──────────────────────────────────────────────
    let audioBuffer: Buffer;
    try {
      // Strip data URL prefix if present
      const base64Data = audio.replace(/^data:audio\/\w+;base64,/, "");
      audioBuffer = Buffer.from(base64Data, "base64");
    } catch {
      return NextResponse.json(
        { error: "Invalid base64 audio data." },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 5. Size check ─────────────────────────────────────────────────
    if (audioBuffer.length > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        {
          error: `Audio too large (${(audioBuffer.length / 1024 / 1024).toFixed(1)} MB). Maximum is 25 MB.`,
        },
        { status: 413, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 6. File type validation (magic bytes) ─────────────────────────
    const detectedType = validateFileType(audioBuffer, ALLOWED_AUDIO_TYPES);
    if (!detectedType) {
      return NextResponse.json(
        {
          error: "Invalid audio format. Allowed: mp3, mp4, mpeg, mpga, m4a, wav, webm.",
        },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 7. Transcribe (no storage — buffer is GC'd after response) ───
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.audio.asr.create({
      file_base64: audio.toString(), // SDK needs the original base64 string
    });

    // ── 8. Audit log ──────────────────────────────────────────────────
    try {
      await db.activityLog.create({
        data: {
          userId: session.userId,
          type: "transcribe",
          description: `Transcribed ${detectedType} (${(audioBuffer.length / 1024).toFixed(0)} KB)`,
        },
      });
    } catch { /* ignore */ }

    // Clear the buffer reference (will be GC'd)
    audioBuffer.fill(0);

    return NextResponse.json({
      text: response.text ?? "",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Transcription failed",
      },
      { status: 500 }
    );
  }
}

/** GET — minimal status. V10 (round 2): returns only {"status":"online"}. */
export async function GET() {
  return Response.json({ status: "online" });
}
