/**
 * Generates the PWA icon set (PNG) for SPYRO V1 from a single SVG.
 * Run with: bun run scripts/generate-icons.ts
 *
 * Produces: public/icons/{icon-192,icon-512,icon-maskable-512,apple-touch-icon,favicon-32}.png
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ICON_SVG = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1c1510"/>
      <stop offset="1" stop-color="#0b0907"/>
    </linearGradient>
    <linearGradient id="flame" x1="256" y1="32" x2="256" y2="480" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffe9a8"/>
      <stop offset="0.42" stop-color="#ff9a3c"/>
      <stop offset="1" stop-color="#e8421b"/>
    </linearGradient>
    <radialGradient id="glow" cx="256" cy="300" r="200" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ff7a1a" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="core" x1="256" y1="240" x2="256" y2="448" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff3cf"/>
      <stop offset="1" stop-color="#ffb347" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background (full-bleed so the icon is maskable-safe) -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="300" r="200" fill="url(#glow)"/>

  <!-- Dragon flame, original 64-unit path scaled x8, nudged to center -->
  <g transform="translate(16,8) scale(8)">
    <path d="M32 4c2.4 6.2.8 9.8-1.8 12.6-2.6 2.8-6 4.8-7.6 9.2-1.2 3.4-.4 6.8 1.2 9.4-2.2-1.2-4.4-3.4-5.2-6.6-1.2-4.8 1-9.2 1-9.2s-6.2 4-8.6 11.6C8.4 38.2 12 48 18.6 53.4 23.4 57 28 58.6 32 58.6s8.6-1.6 13.4-5.2C52 48 55.6 38.2 53 31.6c-2.4-7.6-8.6-11.6-8.6-11.6s2.2 4.4 1 9.2c-.8 3.2-3 5.4-5.2 6.6 1.6-2.6 2.4-6 1.2-9.4-1.6-4.4-5-6.4-7.6-9.2C31.2 13.8 29.6 10.2 32 4Z" fill="url(#flame)"/>
    <path d="M32 30c1.4 3.2.6 5.6-1 7.6-1.6 2-2.8 3.4-2.8 6 0 3.4 2.6 6.4 3.8 7.6 1.2-1.2 3.8-4.2 3.8-7.6 0-2.6-1.2-4-2.8-6-1.6-2-2.4-4.4-1-7.6Z" fill="url(#core)"/>
    <circle cx="26.5" cy="40" r="1.6" fill="#fff8e0"/>
    <circle cx="37.5" cy="40" r="1.6" fill="#fff8e0"/>
  </g>
</svg>`;

const outDir = path.join(process.cwd(), "public", "icons");
await mkdir(outDir, { recursive: true });

const svgBuf = Buffer.from(ICON_SVG);

const targets: Array<{ file: string; size: number }> = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-maskable-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon-32.png", size: 32 },
];

for (const t of targets) {
  await sharp(svgBuf).resize(t.size, t.size, { fit: "cover" }).png().toFile(path.join(outDir, t.file));
  console.log("✓", t.file, `${t.size}x${t.size}`);
}

console.log("\nIcons written to public/icons/");
