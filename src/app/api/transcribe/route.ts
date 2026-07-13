import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Speech-to-text endpoint. Receives base64 audio, returns transcribed text.
 * Uses z-ai-web-dev-sdk (backend only).
 */
export async function POST(req: NextRequest) {
  try {
    const { audio } = await req.json();
    if (!audio || typeof audio !== "string") {
      return NextResponse.json(
        { error: "No audio provided. Send { audio: '<base64>' }" },
        { status: 400 }
      );
    }

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.audio.asr.create({
      file_base64: audio,
    });

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
