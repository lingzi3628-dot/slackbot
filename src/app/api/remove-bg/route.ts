import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  buildRateLimitHeaders,
  getClientIp,
} from "@/lib/rate-limit";
import {
  validateHexColor,
  validateNumber,
  validateBoolean,
  validateFileType,
  validateUrl,
  ALLOWED_IMAGE_TYPES,
  sanitizeString,
} from "@/lib/input-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Max image size: 10 MB. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

interface RemoveBgBody {
  image: string;
  bgColor?: unknown;
  tolerance?: unknown;
  feather?: unknown;
  imageUrl?: unknown; // optional URL to download
}

/**
 * Background remover — detects the dominant background color and makes
 * similar pixels transparent.
 *
 * V6 (round 2) FIX:
 *  - Requires authentication (valid session).
 *  - File size limit: 10 MB max.
 *  - File type validation via magic bytes (PNG, JPG, WEBP, GIF only).
 *  - If imageUrl provided: SSRF prevention (reject private IPs, non-http).
 *  - All parameters sanitized (bgColor → hex, tolerance → 0-100 int, feather → bool).
 *  - Rate limited: 10 images/hr per authenticated user.
 *  - GET returns only {"status":"online"} — no params leak.
 */
export async function POST(req: NextRequest) {
  // ── 1. Auth check ──────────────────────────────────────────────────
  const session = getSession(req);
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required. Please sign in." },
      { status: 401 }
    );
  }

  // ── 2. Rate limit: 10/hr per user ──────────────────────────────────
  const rl = await checkRateLimit(`removebg:${session.id}`, 10, 60 * 60 * 1000);
  if (!rl.allowed) {
    const mins = Math.ceil((rl.resetAt - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` },
      { status: 429, headers: buildRateLimitHeaders(rl) }
    );
  }

  try {
    const body: RemoveBgBody = await req.json();

    // ── 3. Get image buffer (from base64 or URL) ─────────────────────
    let imgBuffer: Buffer;

    if (body.imageUrl && typeof body.imageUrl === "string") {
      // ── SSRF-safe URL download ─────────────────────────────────────
      const validatedUrl = validateUrl(body.imageUrl);
      if (!validatedUrl) {
        return NextResponse.json(
          { error: "Invalid or blocked image URL. Only public http(s) URLs are allowed." },
          { status: 400, headers: buildRateLimitHeaders(rl) }
        );
      }
      // Download with size limit
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(validatedUrl, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          return NextResponse.json(
            { error: `Failed to download image (HTTP ${res.status})` },
            { status: 400, headers: buildRateLimitHeaders(rl) }
          );
        }
        const contentLength = parseInt(res.headers.get("content-length") || "0", 10);
        if (contentLength > MAX_IMAGE_BYTES) {
          return NextResponse.json(
            { error: "Image too large. Maximum size is 10 MB." },
            { status: 413, headers: buildRateLimitHeaders(rl) }
          );
        }
        const arrayBuf = await res.arrayBuffer();
        imgBuffer = Buffer.from(arrayBuf);
      } catch {
        return NextResponse.json(
          { error: "Could not download image from URL." },
          { status: 400, headers: buildRateLimitHeaders(rl) }
        );
      }
    } else if (body.image && typeof body.image === "string") {
      // ── Base64 data URL ────────────────────────────────────────────
      const base64Match = body.image.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!base64Match) {
        return NextResponse.json(
          { error: "Invalid image format. Expected data:image/...;base64,..." },
          { status: 400, headers: buildRateLimitHeaders(rl) }
        );
      }
      imgBuffer = Buffer.from(base64Match[2], "base64");
    } else {
      return NextResponse.json(
        { error: "No image provided. Send { image: 'data:...' } or { imageUrl: 'https://...' }" },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 4. Size check ─────────────────────────────────────────────────
    if (imgBuffer.length > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: `Image too large (${(imgBuffer.length / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` },
        { status: 413, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 5. File type validation (magic bytes, NOT extension) ─────────
    const detectedType = validateFileType(imgBuffer, ALLOWED_IMAGE_TYPES);
    if (!detectedType) {
      return NextResponse.json(
        { error: "Invalid file type. Only PNG, JPG, WEBP, and GIF are allowed." },
        { status: 400, headers: buildRateLimitHeaders(rl) }
      );
    }

    // ── 6. Sanitize parameters ────────────────────────────────────────
    const bgColor = body.bgColor ? validateHexColor(body.bgColor) : null;
    const tolerance = validateNumber(body.tolerance ?? 15, 0, 100, true) ?? 15;
    const feather = validateBoolean(body.feather ?? true) ?? true;

    const metadata = await sharp(imgBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // ── 7. Detect background color from corners ──────────────────────
    let bgR = 255, bgG = 255, bgB = 255;

    if (bgColor) {
      const hex = bgColor.replace("#", "");
      bgR = parseInt(hex.slice(0, 2), 16);
      bgG = parseInt(hex.slice(2, 4), 16);
      bgB = parseInt(hex.slice(4, 6), 16);
    } else {
      // Sample the 4 corners
      const cornerSize = Math.max(5, Math.round(Math.min(width, height) * 0.02));
      const corners = [
        { left: 0, top: 0 },
        { left: width - cornerSize, top: 0 },
        { left: 0, top: height - cornerSize },
        { left: width - cornerSize, top: height - cornerSize },
      ];

      let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;
      for (const corner of corners) {
        try {
          const cornerBuf = await sharp(imgBuffer)
            .extract({
              left: Math.max(0, Math.min(corner.left, width - cornerSize)),
              top: Math.max(0, Math.min(corner.top, height - cornerSize)),
              width: cornerSize,
              height: cornerSize,
            })
            .raw()
            .toBuffer();

          for (let i = 0; i < cornerBuf.length; i += 3) {
            totalR += cornerBuf[i];
            totalG += cornerBuf[i + 1];
            totalB += cornerBuf[i + 2];
            sampleCount++;
          }
        } catch {
          /* skip corner */
        }
      }

      if (sampleCount > 0) {
        bgR = Math.round(totalR / sampleCount);
        bgG = Math.round(totalG / sampleCount);
        bgB = Math.round(totalB / sampleCount);
      }
    }

    // ── 8. Create alpha mask ──────────────────────────────────────────
    const raw = await sharp(imgBuffer)
      .resize(Math.min(width, 1200), Math.min(height, 1200), { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const resizedMeta = await sharp(raw, { raw: { width: Math.min(width, 1200), height: Math.min(height, 1200), channels: 4 } }).metadata();
    const rw = resizedMeta.width || Math.min(width, 1200);
    const rh = resizedMeta.height || Math.min(height, 1200);

    const tol = tolerance * 2.55;
    const tolSq = tol * tol;

    for (let i = 0; i < raw.length; i += 4) {
      const r = raw[i];
      const g = raw[i + 1];
      const b = raw[i + 2];
      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      const distSq = dr * dr + dg * dg + db * db;

      if (distSq < tolSq * 3) {
        raw[i + 3] = 0;
      } else if (distSq < tolSq * 6) {
        const factor = Math.sqrt(distSq / (tolSq * 6));
        raw[i + 3] = Math.round(Math.min(255, factor * 255));
      }
    }

    // ── 9. Build result ───────────────────────────────────────────────
    let resultPipeline = sharp(raw, {
      raw: { width: rw, height: rh, channels: 4 },
    });

    if (feather) {
      resultPipeline = resultPipeline.blur(0.5);
    }

    const resultBuffer = await resultPipeline.png().toBuffer();
    const resultBase64 = resultBuffer.toString("base64");
    const resultDataUrl = `data:image/png;base64,${resultBase64}`;

    // ── 10. Audit log ─────────────────────────────────────────────────
    try {
      await db.activityLog.create({
        data: {
          userId: session.id,
          type: "remove_bg",
          description: `Removed bg (${detectedType}, ${imgBuffer.length} bytes)`,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({
      image: resultDataUrl,
      detectedBg: `rgb(${bgR}, ${bgG}, ${bgB})`,
      format: "png",
      hasTransparency: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Background removal failed" },
      { status: 500 }
    );
  }
}

/**
 * GET — minimal status. Does NOT reveal params.
 * V6 (round 2): returns only {"status":"online"}.
 */
export async function GET() {
  return Response.json({ status: "online" });
}
