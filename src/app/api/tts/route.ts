import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Text-to-speech endpoint. Receives text, returns WAV audio.
 * Uses z-ai-web-dev-sdk (backend only).
 *
 * Note: input is limited to 1024 chars by the API. Longer text is truncated.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, voice = "tongtong", speed = 1.0 } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No text provided. Send { text: '...' }" },
        { status: 400 }
      );
    }

    const truncated = text.slice(0, 1000);

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

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "content-type": "audio/wav",
        "content-length": buffer.length.toString(),
        "cache-control": "no-cache",
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "TTS failed",
      },
      { status: 500 }
    );
  }
}
