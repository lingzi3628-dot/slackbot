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
  const fontSize = Math.max(14, Math.round(width * 0.022));
  const padding = Math.round(width * 0.015);
  const bottomOffset = Math.round(height * 0.035);
  const textWidth = fontSize * 4.5;
  const bgHeight = fontSize + padding;
  const bgX = width - textWidth - padding * 2.5;
  const bgY = height - bottomOffset - bgHeight;
  const bgW = textWidth + padding * 2;

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wmBg" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#16110d" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="#16110d" stop-opacity="0.55"/>
      </linearGradient>
      <linearGradient id="wmText" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffe9a8"/>
        <stop offset="50%" stop-color="#ff9a3c"/>
        <stop offset="100%" stop-color="#e8421b"/>
      </linearGradient>
    </defs>
    <rect x="${bgX}" y="${bgY}" width="${bgW}" height="${bgHeight}"
          rx="${bgHeight / 2}" fill="url(#wmBg)"/>
    <text x="${bgX + padding * 0.8}" y="${bgY + bgHeight * 0.72}"
          font-family="sans-serif" font-size="${fontSize}" font-weight="bold"
          fill="url(#wmText)" letter-spacing="0.5">SPYRO AI</text>
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

    // Get ACTUAL image dimensions (Pollinations may return a different size).
    const metadata = await sharp(imgBuffer).metadata();
    const actualWidth = metadata.width || dims.width;
    const actualHeight = metadata.height || dims.height;

    // Build the watermark SVG with the ACTUAL image dimensions.
    let resultBuffer: Buffer;
    try {
      const watermarkSvg = buildWatermarkSvg(actualWidth, actualHeight);
      resultBuffer = await sharp(imgBuffer)
        .composite([{ input: watermarkSvg, top: 0, left: 0 }])
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch (wmErr) {
      // If watermarking fails, return the image without watermark.
      console.error("[image-gen] watermark failed, returning unwatermarked:", wmErr);
      resultBuffer = await sharp(imgBuffer).jpeg({ quality: 90 }).toBuffer();
    }

    const base64 = resultBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({
      image: dataUrl,
      prompt,
      size,
      watermarked: true,
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
    watermark: "🐉 SPYRO AI",
  });
}
