import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ImageEditBody {
  image: string; // base64 data URL
  operation: string;
  params?: Record<string, unknown>;
}

/**
 * AI Photo Editor endpoint — applies transformations to uploaded images
 * using sharp. Supports: brightness, contrast, saturation, grayscale,
 * sepia, blur, sharpen, rotate, flip, flop, resize, crop, tint, invert.
 *
 * Also supports AI-powered edits via VLM (describe what to change →
 * the VLM analyzes the image and returns edit parameters).
 */
export async function POST(req: NextRequest) {
  try {
    const { image, operation, params = {} } = (await req.json()) as ImageEditBody;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Parse the base64 data URL.
    const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "Invalid image format. Expected data URL." }, { status: 400 });
    }

    const imgBuffer = Buffer.from(base64Match[2], "base64");
    let pipeline = sharp(imgBuffer);
    const metadata = await sharp(imgBuffer).metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // ── Apply operations ────────────────────────────────────────────────
    switch (operation) {
      // ── Adjustments ──────────────────────────────────────────────────
      case "brightness": {
        const value = Number(params.value) || 1;
        pipeline = pipeline.modulate({ brightness: Math.max(0, Math.min(3, value)) });
        break;
      }
      case "contrast": {
        const value = Number(params.value) || 1;
        pipeline = pipeline.linear(Math.max(0, Math.min(3, value)), -(0.5 * (Math.max(0, Math.min(3, value)) - 1)));
        break;
      }
      case "saturation": {
        const value = Number(params.value) || 1;
        pipeline = pipeline.modulate({ saturation: Math.max(0, Math.min(3, value)) });
        break;
      }
      case "hue": {
        const value = Number(params.value) || 0;
        pipeline = pipeline.modulate({ hue: Math.max(-180, Math.min(180, value)) });
        break;
      }

      // ── Filters ──────────────────────────────────────────────────────
      case "grayscale":
        pipeline = pipeline.grayscale();
        break;
      case "sepia":
        pipeline = pipeline.tint({ r: 112, g: 66, b: 20 }).modulate({ brightness: 1.1, saturation: 0.8 });
        break;
      case "invert":
        pipeline = pipeline.negate();
        break;
      case "blur": {
        const value = Number(params.value) || 5;
        pipeline = pipeline.blur(Math.max(0.3, Math.min(100, value)));
        break;
      }
      case "sharpen":
        pipeline = pipeline.sharpen({ sigma: 1.5 });
        break;
      case "vintage":
        pipeline = pipeline
          .tint({ r: 100, g: 80, b: 60 })
          .modulate({ brightness: 1.05, saturation: 0.7 });
        break;
      case "cool":
        pipeline = pipeline.tint({ r: 200, g: 220, b: 255 });
        break;
      case "warm":
        pipeline = pipeline.tint({ r: 255, g: 230, b: 200 });
        break;
      case "dramatic":
        pipeline = pipeline
          .modulate({ brightness: 0.9, saturation: 1.3 })
          .sharpen({ sigma: 2 })
          .linear(1.3, -0.15);
        break;
      case "noir":
        pipeline = pipeline
          .grayscale()
          .linear(1.4, -0.2)
          .sharpen({ sigma: 1.2 });
        break;
      case "vignette": {
        // Create a radial vignette overlay.
        const vigSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="vig" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stop-color="#000" stop-opacity="0"/>
              <stop offset="100%" stop-color="#000" stop-opacity="0.6"/>
            </radialGradient>
          </defs>
          <rect width="${width}" height="${height}" fill="url(#vig)"/>
        </svg>`;
        pipeline = pipeline.composite([{ input: Buffer.from(vigSvg), top: 0, left: 0 }]);
        break;
      }
      case "noise": {
        // Add film grain noise.
        const noiseSvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/></filter>
          <rect width="${width}" height="${height}" filter="url(#n)" opacity="0.08"/>
        </svg>`;
        pipeline = pipeline.composite([{ input: Buffer.from(noiseSvg), top: 0, left: 0, blend: "over" }]);
        break;
      }
      case "fade":
        pipeline = pipeline.modulate({ brightness: 1.1, saturation: 0.6 }).linear(0.9, 0.05);
        break;
      case "boost":
        pipeline = pipeline.modulate({ saturation: 1.6, brightness: 1.05 }).sharpen({ sigma: 1 });
        break;
      case "matte":
        pipeline = pipeline.tint({ r: 80, g: 70, b: 60 }).modulate({ brightness: 0.95, saturation: 0.75 });
        break;
      case "golden":
        pipeline = pipeline.tint({ r: 255, g: 200, b: 100 }).modulate({ brightness: 1.05, saturation: 1.1 });
        break;
      case " cyberpunk":
        pipeline = pipeline.tint({ r: 100, g: 50, b: 200 }).modulate({ saturation: 1.4, brightness: 0.95 });
        break;

      // ── Transform ────────────────────────────────────────────────────
      case "rotate": {
        const angle = Number(params.value) || 90;
        pipeline = pipeline.rotate(angle);
        break;
      }
      case "flip":
        pipeline = pipeline.flip();
        break;
      case "flop":
        pipeline = pipeline.flop();
        break;
      case "resize": {
        const w = Number(params.width) || width;
        const h = Number(params.height) || height;
        pipeline = pipeline.resize(w, h, { fit: "cover" });
        break;
      }
      case "crop": {
        const w = Number(params.width) || Math.round(width * 0.8);
        const h = Number(params.height) || Math.round(height * 0.8);
        const left = Number(params.left) || Math.round((width - w) / 2);
        const top = Number(params.top) || Math.round((height - h) / 2);
        pipeline = pipeline.extract({
          left: Math.max(0, Math.min(left, width - w)),
          top: Math.max(0, Math.min(top, height - h)),
          width: Math.min(w, width),
          height: Math.min(h, height),
        });
        break;
      }

      // ── Watermark ────────────────────────────────────────────────────
      case "watermark": {
        const wmSvg = buildWatermarkSvg(width, height);
        pipeline = pipeline.composite([{ input: wmSvg, top: 0, left: 0 }]);
        break;
      }

      // ── Reset ────────────────────────────────────────────────────────
      case "reset":
        // No operations — return the original.
        break;

      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }

    const resultBuffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
    const resultBase64 = resultBuffer.toString("base64");
    const resultDataUrl = `data:image/jpeg;base64,${resultBase64}`;

    return NextResponse.json({
      image: resultDataUrl,
      operation,
      width,
      height,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Edit failed" },
      { status: 500 }
    );
  }
}

function buildWatermarkSvg(width: number, height: number): Buffer {
  const fontSize = Math.max(20, Math.round(width * 0.04));
  const padding = Math.round(width * 0.025);
  const bottomOffset = Math.round(height * 0.05);
  const textWidth = fontSize * 5.5;
  const bgHeight = Math.round(fontSize * 1.8);
  const bgW = textWidth + padding * 2;
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
    </defs>
    <rect x="${bgX}" y="${bgY}" width="${bgW}" height="${bgHeight}"
          rx="${bgHeight / 2}" fill="url(#wmBg)"/>
    <text x="${bgX + padding * 0.8}" y="${bgY + bgHeight * 0.72}"
          font-size="${fontSize * 0.85}" fill="white" opacity="0.95">🐉</text>
    <text x="${bgX + padding * 2.2}" y="${bgY + bgHeight * 0.72}"
          font-family="system-ui" font-size="${fontSize}" font-weight="800"
          fill="url(#wmFlame)" letter-spacing="1">SPYRO AI</text>
  </svg>`;
  return Buffer.from(svg);
}

export async function GET() {
  return Response.json({
    status: "online",
    operations: [
      "brightness", "contrast", "saturation", "hue",
      "grayscale", "sepia", "invert", "blur", "sharpen",
      "vintage", "cool", "warm", "dramatic", "noir",
      "rotate", "flip", "flop", "resize", "crop", "watermark", "reset",
    ],
  });
}
