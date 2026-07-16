import { NextResponse } from "next/server";
import { IS_LIVE, EVOLUTION_CONFIGURED, WEBHOOK_CONFIGURED } from "@/lib/comms/evolution-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comms/mode
 * Returns whether the Communication Center is running in LIVE or DEMO mode,
 * and what's configured. Used by the frontend to show the right banner.
 */
export async function GET() {
  return NextResponse.json({
    mode: IS_LIVE ? "live" : "demo",
    evolutionApiConfigured: EVOLUTION_CONFIGURED,
    webhookConfigured: WEBHOOK_CONFIGURED,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || null,
    setupSteps: IS_LIVE ? [] : [
      "Deploy an Evolution API instance (self-hosted via Docker or use a hosted provider)",
      "Set EVOLUTION_API_URL to your instance URL (e.g. https://evolution.yourdomain.com)",
      "Set EVOLUTION_API_KEY to your Evolution API key",
      "Set NEXT_PUBLIC_APP_URL to this app's public URL (so Evolution API can deliver incoming messages)",
      "Redeploy — the Connect WhatsApp flow will then pair a real device and the AI agent will auto-reply from your connected number",
    ],
  });
}
