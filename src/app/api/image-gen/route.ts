import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

// ── Rate limiting ─────────────────────────────────────────────────────
// 10 images per hour per IP (stored in memory — resets on cold start).
// For production, swap with Upstash Redis.
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetAt: entry.resetAt };
}

/** Build a premium SPYRO AI watermark SVG overlay. */
function buildWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(14, Math.round(width * 0.022));
  const padding = Math.round(width * 0.018);
  const bottomOffset = Math.round(height * 0.04);
  const textWidth = fontSize * 4.2;
  const bgHeight = Math.round(fontSize * 1.6);
  const bgX = width - textWidth - padding * 2.5;
  const bgY = height - bottomOffset - bgHeight;
  const bgW = textWidth + padding * 2;

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wmBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a0705" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#1a1008" stop-opacity="0.7"/>
      </linearGradient>
      <linearGradient id="wmFlame" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffe9a8"/>
        <stop offset="40%" stop-color="#ff9a3c"/>
        <stop offset="100%" stop-color="#e8421b"/>
      </linearGradient>
      <filter id="wmGlow">
        <feGaussianBlur stdDeviation="1.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- Background pill -->
    <rect x="${bgX}" y="${bgY}" width="${bgW}" height="${bgHeight}"
          rx="${bgHeight / 2}" fill="url(#wmBg)"/>
    <!-- Flame icon (simplified dragon flame) -->
    <path d="M ${bgX + padding * 0.7} ${bgY + bgHeight * 0.5}
             C ${bgX + padding * 0.7} ${bgY + bgHeight * 0.25},
               ${bgX + padding * 1.3} ${bgY + bgHeight * 0.25},
               ${bgX + padding * 1.3} ${bgY + bgHeight * 0.5}
             C ${bgX + padding * 1.3} ${bgY + bgHeight * 0.4},
               ${bgX + padding * 1.0} ${bgY + bgHeight * 0.35},
               ${bgX + padding * 1.0} ${bgY + bgHeight * 0.55}
             C ${bgX + padding * 1.0} ${bgY + bgHeight * 0.65},
               ${bgX + padding * 0.7} ${bgY + bgHeight * 0.6},
               ${bgX + padding * 0.7} ${bgY + bgHeight * 0.5} Z"
          fill="url(#wmFlame)" filter="url(#wmGlow)"/>
    <!-- SPYRO AI text -->
    <text x="${bgX + padding * 1.8}" y="${bgY + bgHeight * 0.68}"
          font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="700"
          fill="url(#wmFlame)" letter-spacing="0.5">SPYRO AI</text>
  </svg>`;
  return Buffer.from(svg);
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = (await req.json()) as ImageGenBody;
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "No prompt provided." },
        { status: 400 }
      );
    }

    // ── Rate limit check ──────────────────────────────────────────────
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const minsLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: `Rate limit reached. You've generated ${RATE_LIMIT_MAX} images this hour. Try again in ${minsLeft} minute${minsLeft === 1 ? "" : "s"}.`,
          rateLimited: true,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
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

    // Get ACTUAL image dimensions.
    const metadata = await sharp(imgBuffer).metadata();
    const actualWidth = metadata.width || dims.width;
    const actualHeight = metadata.height || dims.height;

    // Add SPYRO AI watermark.
    let resultBuffer: Buffer;
    try {
      const watermarkSvg = buildWatermarkSvg(actualWidth, actualHeight);
      resultBuffer = await sharp(imgBuffer)
        .composite([{ input: watermarkSvg, top: 0, left: 0 }])
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch {
      // Fallback: return without watermark.
      resultBuffer = await sharp(imgBuffer).jpeg({ quality: 90 }).toBuffer();
    }

    const base64 = resultBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    return NextResponse.json({
      image: dataUrl,
      prompt,
      size,
      watermarked: true,
      rateLimit: {
        remaining: rateLimit.remaining,
        limit: RATE_LIMIT_MAX,
        resetAt: rateLimit.resetAt,
      },
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
    rateLimit: `${RATE_LIMIT_MAX} images per hour`,
  });
}
