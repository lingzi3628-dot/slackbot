import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { checkRateLimit, buildRateLimitHeaders, getClientIp } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { getUserByApiKey } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { sanitizePrompt } from "@/lib/input-validation";

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

/** Build a premium SPYRO AI watermark SVG overlay — large, clear, center-bottom. */
function buildWatermarkSvg(width: number, height: number): Buffer {
  // Bigger font for visibility.
  const fontSize = Math.max(20, Math.round(width * 0.04));
  const padding = Math.round(width * 0.025);
  const bottomOffset = Math.round(height * 0.05);
  const textWidth = fontSize * 5.5; // "🐉 SPYRO AI" is ~5.5x font size
  const bgHeight = Math.round(fontSize * 1.8);
  const bgW = textWidth + padding * 2;
  // Center horizontally.
  const bgX = Math.round((width - bgW) / 2);
  const bgY = height - bottomOffset - bgHeight;

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="wmBg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0a0705" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#1a1008" stop-opacity="0.8"/>
      </linearGradient>
      <linearGradient id="wmFlame" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#ffe9a8"/>
        <stop offset="35%" stop-color="#ff9a3c"/>
        <stop offset="70%" stop-color="#ff5a1f"/>
        <stop offset="100%" stop-color="#e8421b"/>
      </linearGradient>
      <filter id="wmGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="wmShadow">
        <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
      </filter>
    </defs>
    <!-- Background pill -->
    <rect x="${bgX}" y="${bgY}" width="${bgW}" height="${bgHeight}"
          rx="${bgHeight / 2}" fill="url(#wmBg)" filter="url(#wmShadow)"/>
    <!-- Dragon emoji -->
    <text x="${bgX + padding * 0.8}" y="${bgY + bgHeight * 0.72}"
          font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize * 0.85}"
          fill="white" opacity="0.95">🐉</text>
    <!-- SPYRO AI text with gradient + glow -->
    <text x="${bgX + padding * 2.2}" y="${bgY + bgHeight * 0.72}"
          font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="800"
          fill="url(#wmFlame)" letter-spacing="1" filter="url(#wmGlow)">SPYRO AI</text>
  </svg>`;
  return Buffer.from(svg);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ImageGenBody;
    const rawPrompt = typeof body.prompt === "string" ? body.prompt : "";
    // V4 (round 2): sanitize prompt (strip nulls, control chars, max length)
    const prompt = sanitizePrompt(rawPrompt);
    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided." },
        { status: 400 }
      );
    }

    // ── V4 (round 2): Authentication required ─────────────────────────
    // Accept either a session cookie OR an x-api-key header.
    const session = getSession(req);
    const apiKey = req.headers.get("x-api-key");
    let userId: string | null = null;

    if (session) {
      userId = session.id;
    } else if (apiKey) {
      const apiUser = await getUserByApiKey(apiKey);
      if (apiUser) {
        userId = apiUser.id;
      } else {
        return NextResponse.json(
          { error: "Invalid API key." },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Authentication required. Sign in or provide an x-api-key header." },
        { status: 401 }
      );
    }

    // ── Rate limit: per USER (not per IP) — V4 (round 2) ──────────────
    // 10 images/hour per authenticated user. Falls back to IP if userId is null.
    const rateLimitId = userId || getClientIp(req);
    const rateLimit = await checkRateLimit(`img:${rateLimitId}`, 10, 60 * 60 * 1000);
    if (!rateLimit.allowed) {
      const minsLeft = Math.ceil((rateLimit.resetAt - Date.now()) / 60000);
      return NextResponse.json(
        {
          error: `Rate limit reached. You've generated ${rateLimit.limit} images this hour. Try again in ${minsLeft} minute${minsLeft === 1 ? "" : "s"}.`,
          rateLimited: true,
          resetAt: rateLimit.resetAt,
        },
        { status: 429, headers: buildRateLimitHeaders(rateLimit) }
      );
    }

    const size = body.size ?? "1024x1024";
    const dims = SIZE_MAP[size] ?? SIZE_MAP["1024x1024"];
    const encodedPrompt = encodeURIComponent(prompt.slice(0, 500));
    const imageUrl = `${POLLINATIONS_IMAGE_BASE}/${encodedPrompt}?width=${dims.width}&height=${dims.height}&nologo=true&referrer=spyro-v1-app`;
    // The upstream can be slow or flaky, so we try up to 3 times with
    // a 30s timeout per attempt.
    let imgBuffer: Buffer | null = null;
    let lastError: string = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        const imgRes = await fetch(imageUrl, {
          signal: controller.signal,
          headers: { "user-agent": "SPYRO-V1/2.0" },
        });
        clearTimeout(timeout);

        if (!imgRes.ok) {
          lastError = `upstream returned ${imgRes.status}`;
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1500 * attempt));
            continue;
          }
          return NextResponse.json(
            { error: `The SPYRO image engine is busy (upstream ${imgRes.status}). Please try again in a moment.` },
            { status: 502 }
          );
        }

        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length < 1000) {
          // Pollinations sometimes returns a tiny placeholder on error.
          lastError = "upstream returned an empty image";
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 1500 * attempt));
            continue;
          }
        } else {
          imgBuffer = buf;
          break;
        }
      } catch (fetchErr) {
        lastError = (fetchErr as Error)?.name === "AbortError"
          ? "upstream timed out after 30s"
          : (fetchErr as Error)?.message || "fetch failed";
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 1500 * attempt));
          continue;
        }
      }
    }

    if (!imgBuffer) {
      return NextResponse.json(
        { error: `The SPYRO image engine couldn't generate that image (${lastError}). Try a simpler prompt or try again shortly.` },
        { status: 502 }
      );
    }

    // Get ACTUAL image dimensions (with fallback if sharp can't parse).
    let actualWidth = dims.width;
    let actualHeight = dims.height;
    let resultBuffer: Buffer;
    try {
      const metadata = await sharp(imgBuffer).metadata();
      actualWidth = metadata.width || dims.width;
      actualHeight = metadata.height || dims.height;

      // Add SPYRO AI watermark.
      const watermarkSvg = buildWatermarkSvg(actualWidth, actualHeight);
      resultBuffer = await sharp(imgBuffer)
        .composite([{ input: watermarkSvg, top: 0, left: 0 }])
        .jpeg({ quality: 90 })
        .toBuffer();
    } catch {
      // Fallback: return without watermark (sharp failed).
      try {
        resultBuffer = await sharp(imgBuffer).jpeg({ quality: 90 }).toBuffer();
      } catch {
        // Last resort: return the raw buffer as-is.
        resultBuffer = imgBuffer;
      }
    }

    const base64 = resultBuffer.toString("base64");
    const dataUrl = `data:image/jpeg;base64,${base64}`;

    // ── V4 (round 2): Audit log ───────────────────────────────────────
    try {
      await db.activityLog.create({
        data: {
          userId: userId || "unknown",
          type: "image_gen",
          description: `Generated image (${size}, prompt: "${prompt.slice(0, 80)}")`,
        },
      });
    } catch { /* ignore audit errors */ }

    return NextResponse.json({
      image: dataUrl,
      prompt,
      size,
      watermarked: true,
      rateLimit: {
        remaining: rateLimit.remaining,
        limit: rateLimit.limit,
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

/** GET — minimal status. V4 (round 2): no rateLimit detail leak. */
export async function GET() {
  return Response.json({ status: "online" });
}
