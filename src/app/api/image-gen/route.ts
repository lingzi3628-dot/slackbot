import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Image generation endpoint using the FREE Pollinations AI image API.
 * Fetches the image, adds a "SPYRO AI" watermark, returns base64.
 */
const POLLINATIONS_IMAGE_BASE = "https://image.pollinations.ai/prompt";

interface ImageGenBody {
  prompt?: string;
  size?: string;
}

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  "1024x1024": { width: 1024, height: 1024 },
  "768x1344": { width: 768, height: 1344 },
  "1344x768": { width: 1344, height: 768 },
  "1440x720": { width: 1440, height: 720 },
};

/** Build an SVG watermark overlay with "SPYRO AI" text. */
function buildWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(16, Math.round(width * 0.025));
  const padding = Math.round(width * 0.02);
  const bottomOffset = Math.round(height * 0.04);
  const textWidth = fontSize * 5; // approximate
  const bgHeight = fontSize + padding;

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wmBg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#16110d" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="#16110d" stop-opacity="0.5"/>
      </linearGradient>
      <linearGradient id="wmText" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffe9a8"/>
        <stop offset="50%" stop-color="#ff9a3c"/>
        <stop offset="100%" stop-color="#e8421b"/>
      </linearGradient>
    </defs>
    <!-- Background pill -->
    <rect x="${width - textWidth - padding * 2}" y="${height - bottomOffset - bgHeight}"
          width="${textWidth + padding}" height="${bgHeight}"
          rx="${bgHeight / 2}" fill="url(#wmBg)"/>
    <!-- Dragon emoji -->
    <text x="${width - textWidth - padding + fontSize * 0.3}" y="${height - bottomOffset - padding * 0.5}"
          font-family="sans-serif" font-size="${fontSize * 0.8}" fill="white" opacity="0.9">🐉</text>
    <!-- SPYRO AI text -->
    <text x="${width - textWidth + fontSize * 0.3}" y="${height - bottomOffset - padding * 0.3}"
          font-family="sans-serif" font-size="${fontSize}" font-weight="bold"
          fill="url(#wmText)" letter-spacing="1">SPYRO AI</text>
  </svg>`;
  return Buffer.from(svg);
}

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
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 500));
    const imageUrl = `${POLLINATIONS_IMAGE_BASE}/${encodedPrompt}?width=${dims.width}&height=${dims.height}&nologo=true&referrer=spyro-v1-app`;

    // Fetch the raw image from Pollinations.
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Image generation failed: ${imgRes.status}` },
        { status: 502 }
      );
    }
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Add SPYRO AI watermark using sharp.
    const watermarkSvg = buildWatermarkSvg(dims.width, dims.height);
    const watermarked = await sharp(imgBuffer)
      .composite([{ input: watermarkSvg, top: 0, left: 0 }])
      .jpeg({ quality: 90 })
      .toBuffer();

    const base64 = watermarked.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({
      image: dataUrl,
      prompt,
      size,
      watermarked: true,
      provider: "Pollinations AI + SPYRO watermark",
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

export async function GET() {
  return Response.json({
    status: "online",
    provider: "Pollinations AI + SPYRO AI watermark",
    watermark: "🐉 SPYRO AI",
  });
}
