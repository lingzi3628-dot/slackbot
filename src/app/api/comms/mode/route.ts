import { NextResponse } from "next/server";
import { getActiveMode, EVOLUTION_CONFIGURED, WEBHOOK_CONFIGURED } from "@/lib/comms/evolution-api";
import { isBaileysAvailable } from "@/lib/comms/baileys-provider";
import { isPairingServerAvailable } from "@/lib/comms/pairing-server-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const mode = await getActiveMode();
  const baileysAvailable = await isBaileysAvailable();
  const pairingServerAvailable = await isPairingServerAvailable();

  return NextResponse.json({
    mode,
    pairingServerAvailable,
    baileysAvailable,
    evolutionApiConfigured: EVOLUTION_CONFIGURED,
    webhookConfigured: WEBHOOK_CONFIGURED,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || null,
    setupSteps: [],
  });
}

