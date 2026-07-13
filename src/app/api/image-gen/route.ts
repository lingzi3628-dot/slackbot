import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Image generation endpoint. Receives a prompt, returns a base64 PNG.
 * Uses z-ai-web-dev-sdk (backend only).
 */
export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "No prompt provided. Send { prompt: '...' }" },
        { status: 400 }
      );
    }

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.images.generations.create({
      prompt,
      size,
    });

    const base64 = response.data?.[0]?.base64;
    if (!base64) {
      return NextResponse.json(
        { error: "Image generation returned no data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: `data:image/png;base64,${base64}`,
      prompt,
      size,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Image generation failed",
      },
      { status: 500 }
    );
  }
}
