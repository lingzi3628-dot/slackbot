import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// ── Load .env manually (Turbopack workaround for Prisma) ──────────────
// Turbopack doesn't always load .env before Prisma validates its schema.
// This ensures all env vars are in process.env before Next.js starts.
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Arena's live preview proxies requests through an *.e2b.app origin.
  // Keep the existing hosted origins and allow the preview host in dev.
  allowedDevOrigins: ["*.space-z.ai", "*.chatglm.cn", "*.e2b.app"],
  // ── Security headers (CSP, etc.) ───────────────────────────────────
  // Note: CORS is handled in src/middleware.ts with an origin allowlist
  // (V3 fix). Do NOT set Access-Control-Allow-Origin here.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // The app is displayed inside Arena's live-preview iframe. CSP
          // frame-ancestors below controls embedding; X-Frame-Options DENY
          // would block the preview before CSP is evaluated.
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
