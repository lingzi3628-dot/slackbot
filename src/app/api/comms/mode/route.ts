import { NextResponse } from "next/server";
import { getActiveMode, EVOLUTION_CONFIGURED, WEBHOOK_CONFIGURED } from "@/lib/comms/evolution-api";
import { isBaileysAvailable } from "@/lib/comms/baileys-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comms/mode
 * Returns the active WhatsApp provider and configuration status.
 */
export async function GET() {
  const mode = await getActiveMode();
  const baileysAvailable = await isBaileysAvailable();

  const setupSteps = mode === "demo" ? [
    "Option A (FREE): Run the Baileys mini-service locally — `cd mini-services/whatsapp && bun install && bun run dev`. It connects directly to WhatsApp, no API key needed.",
    "Option B (Self-hosted): Deploy an Evolution API instance via Docker",
    "Option C (Hosted): Use a hosted Evolution API provider",
    "Set NEXT_PUBLIC_APP_URL to this app's public URL (so incoming messages reach the AI agent)",
    "Redeploy — the Connect WhatsApp flow will then pair a real device and the AI agent will auto-reply from your connected number",
  ] : [];

  return NextResponse.json({
    mode,
    baileysAvailable,
    evolutionApiConfigured: EVOLUTION_CONFIGURED,
    webhookConfigured: WEBHOOK_CONFIGURED,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || null,
    setupSteps,
  });
}
