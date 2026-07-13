import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Image generation endpoint using the FREE Pollinations AI image API.
 * No API key required — just builds a URL and returns it.
 *
 * The Pollinations image API works via a simple GET URL:
 *   https://image.pollinations.ai/prompt/{prompt}?width=W&height=H&nologo=true
 *
 * The image is generated on-demand when the URL is loaded.
 */
const POLLINATIONS_IMAGE_BASE = "https://image.pollinations.ai/prompt";

interface ImageGenBody {
  prompt?: string;
  size?: string;
}

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  "1024x1024": { width: 1024, height: 1024 },
  "768x1344": { width: 768, height: 1344 },
  "864x1152": { width: 864, height: 1152 },
  "1344x768": { width: 1344, height: 768 },
  "1152x864": { width: 1152, height: 864 },
  "1440x720": { width: 1440, height: 720 },
  "720x1440": { width: 720, height: 1440 },
};

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = (await req.json()) as ImageGenBody;
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "No prompt provided. Send { prompt: '...' }" },
        { status: 400 }
      );
    }

    const dims = SIZE_MAP[size] ?? SIZE_MAP["1024x1024"];

    // Build the Pollinations image URL. The image is generated on-demand
    // when this URL is loaded by the browser.
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 500));
    const imageUrl = `${POLLINATIONS_IMAGE_BASE}/${encodedPrompt}?width=${dims.width}&height=${dims.height}&nologo=true&referrer=spyro-v1-app`;

    return NextResponse.json({
      image: imageUrl,
      prompt,
      size,
      provider: "Pollinations AI (free)",
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

/** GET — quick health check + example URL. */
export async function GET() {
  return Response.json({
    status: "online",
    provider: "Pollinations AI (free, no API key)",
    example: `${POLLINATIONS_IMAGE_BASE}/a%20dragon%20breathing%20fire?width=1024&height=1024&nologo=true`,
  });
}
