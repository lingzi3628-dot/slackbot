/**
 * Generates the Expo app icons from the SPYRO V1 dragon-flame SVG.
 *
 * Run AFTER `bun install` / `npm install`:
 *   bun run scripts/generate-icons.ts
 *
 * Produces:
 *   assets/icon.png            (1024x1024 — Expo app icon)
 *   assets/adaptive-icon.png   (1024x1024 — Android adaptive foreground)
 *   assets/splash.png          (1242x2436 — iOS splash)
 *   assets/favicon.png         (48x48)
 *
 * Requires `sharp` as a devDependency:
 *   bun add -d sharp
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ICON_SVG = `<svg width="1024" height="1024" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
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
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="300" r="200" fill="url(#glow)"/>
  <g transform="translate(16,8) scale(8)">
    <path d="M32 4c2.4 6.2.8 9.8-1.8 12.6-2.6 2.8-6 4.8-7.6 9.2-1.2 3.4-.4 6.8 1.2 9.4-2.2-1.2-4.4-3.4-5.2-6.6-1.2-4.8 1-9.2 1-9.2s-6.2 4-8.6 11.6C8.4 38.2 12 48 18.6 53.4 23.4 57 28 58.6 32 58.6s8.6-1.6 13.4-5.2C52 48 55.6 38.2 53 31.6c-2.4-7.6-8.6-11.6-8.6-11.6s2.2 4.4 1 9.2c-.8 3.2-3 5.4-5.2 6.6 1.6-2.6 2.4-6 1.2-9.4-1.6-4.4-5-6.4-7.6-9.2C31.2 13.8 29.6 10.2 32 4Z" fill="url(#flame)"/>
    <circle cx="26.5" cy="40" r="1.6" fill="#fff8e0"/>
    <circle cx="37.5" cy="40" r="1.6" fill="#fff8e0"/>
  </g>
</svg>`;

const SPLASH_SVG = `<svg width="1242" height="2436" viewBox="0 0 1242 2436" xmlns="http://www.w3.org/2000/svg">
  <rect width="1242" height="2436" fill="#16110d"/>
  <g transform="translate(459,1002) scale(2.6)">
    <path d="M32 4c2.4 6.2.8 9.8-1.8 12.6-2.6 2.8-6 4.8-7.6 9.2-1.2 3.4-.4 6.8 1.2 9.4-2.2-1.2-4.4-3.4-5.2-6.6-1.2-4.8 1-9.2 1-9.2s-6.2 4-8.6 11.6C8.4 38.2 12 48 18.6 53.4 23.4 57 28 58.6 32 58.6s8.6-1.6 13.4-5.2C52 48 55.6 38.2 53 31.6c-2.4-7.6-8.6-11.6-8.6-11.6s2.2 4.4 1 9.2c-.8 3.2-3 5.4-5.2 6.6 1.6-2.6 2.4-6 1.2-9.4-1.6-4.4-5-6.4-7.6-9.2C31.2 13.8 29.6 10.2 32 4Z" fill="#ff9a3c"/>
    <circle cx="26.5" cy="40" r="1.6" fill="#fff8e0"/>
    <circle cx="37.5" cy="40" r="1.6" fill="#fff8e0"/>
  </g>
  <text x="621" y="1450" font-family="sans-serif" font-size="52" font-weight="800" fill="#f5ecd9" text-anchor="middle">SPYRO V1</text>
  <text x="621" y="1510" font-family="sans-serif" font-size="28" fill="#a99c87" text-anchor="middle">Dragon-powered AI</text>
</svg>`;

// Wrap in an async IIFE so this runs under both `bun` (top-level await OK)
// and `npx tsx` (CJS mode, no top-level await).
(async () => {
  const outDir = path.join(process.cwd(), "assets");
  await mkdir(outDir, { recursive: true });

  await sharp(Buffer.from(ICON_SVG)).png().toFile(path.join(outDir, "icon.png"));
  console.log("✓ assets/icon.png (1024x1024)");

  await sharp(Buffer.from(ICON_SVG)).png().toFile(path.join(outDir, "adaptive-icon.png"));
  console.log("✓ assets/adaptive-icon.png");

  await sharp(Buffer.from(SPLASH_SVG)).png().toFile(path.join(outDir, "splash.png"));
  console.log("✓ assets/splash.png (1242x2436)");

  await sharp(Buffer.from(ICON_SVG)).resize(48, 48).png().toFile(path.join(outDir, "favicon.png"));
  console.log("✓ assets/favicon.png (48x48)");

  console.log("\nDone. Make sure assets/ is referenced in app.config.ts.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
