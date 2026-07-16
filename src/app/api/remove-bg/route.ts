import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RemoveBgBody {
  image: string;
  /** Background color to remove (hex). Default: auto-detect corner color. */
  bgColor?: string;
  /** Tolerance for color matching (0-100). Default: 15. */
  tolerance?: number;
  /** Feather/blur the edges for smoother cutout. Default: true. */
  feather?: boolean;
}

/**
 * Background remover — detects the dominant background color from the
 * image corners, then makes all similar pixels transparent.
 *
 * This is a heuristic approach (not ML-based). It works best on images
 * with relatively uniform backgrounds (product photos, portraits with
 * plain backdrops, etc.). For complex backgrounds, results will vary.
 */
export async function POST(req: NextRequest) {
  try {
    const { image, bgColor, tolerance = 15, feather = true } = (await req.json()) as RemoveBgBody;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const imgBuffer = Buffer.from(base64Match[2], "base64");
    const metadata = await sharp(imgBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // ── Detect background color from corners ───────────────────────────
    let bgR = 255, bgG = 255, bgB = 255;

    if (bgColor) {
      // Parse hex color.
      const hex = bgColor.replace("#", "");
      bgR = parseInt(hex.slice(0, 2), 16);
      bgG = parseInt(hex.slice(2, 4), 16);
      bgB = parseInt(hex.slice(4, 6), 16);
    } else {
      // Sample the 4 corners to detect background color.
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

    // ── Create alpha mask ──────────────────────────────────────────────
    // Build an SVG-based approach: convert to RGBA, then threshold.
    const raw = await sharp(imgBuffer)
      .resize(Math.min(width, 1200), Math.min(height, 1200), { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const resizedMeta = await sharp(raw, { raw: { width: Math.min(width, 1200), height: Math.min(height, 1200), channels: 4 } }).metadata();
    const rw = resizedMeta.width || Math.min(width, 1200);
    const rh = resizedMeta.height || Math.min(height, 1200);

    const tol = tolerance * 2.55; // 0-255 range
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
        // Close to background → transparent.
        raw[i + 3] = 0;
      } else if (distSq < tolSq * 6) {
        // Edge zone → semi-transparent (feathering).
        const factor = Math.sqrt(distSq / (tolSq * 6));
        raw[i + 3] = Math.round(Math.min(255, factor * 255));
      }
    }

    // ── Build result with transparency ────────────────────────────────
    let resultPipeline = sharp(raw, {
      raw: { width: rw, height: rh, channels: 4 },
    });

    if (feather) {
      // Slight blur on alpha channel for smoother edges.
      resultPipeline = resultPipeline.blur(0.5);
    }

    const resultBuffer = await resultPipeline.png().toBuffer();
    const resultBase64 = resultBuffer.toString("base64");
    const resultDataUrl = `data:image/png;base64,${resultBase64}`;

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

export async function GET() {
  return Response.json({
    status: "online",
    description: "AI background remover — detects and removes the background color from images.",
    params: ["bgColor (hex, optional)", "tolerance (0-100, default 15)", "feather (bool, default true)"],
  });
}
