import { NextRequest, NextResponse } from "next/server";
import { getProvider, resolveProvider, getActiveMode } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comms/connect
 *
 * Provider priority:
 *   1. Baileys (free, local mini-service on port 3001) — REAL WhatsApp
 *   2. Evolution API (if EVOLUTION_API_URL + KEY set) — REAL WhatsApp
 *   3. Demo mode — simulated QR + 8s fake scan
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channelType: ChannelType = (body.channelType as ChannelType) || "whatsapp";
    const channelId: string | undefined = body.channelId;

    // Resolve the active provider (Baileys > Evolution > Demo)
    await resolveProvider();
    const provider = getProvider(channelType);
    if (!provider) {
      return NextResponse.json({ error: `Channel "${channelType}" is not yet supported` }, { status: 400 });
    }

    const mode = await getActiveMode();
    const id = channelId || `spyro_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const { qrCode, expiresAt, resolvedChannelId } = await provider.initiateConnection(id);

    return NextResponse.json({
      channelId: resolvedChannelId,
      qrCode,
      expiresAt,
      channelType,
      displayName: provider.displayName,
      mode, // "baileys" | "evolution" | "demo"
      live: mode !== "demo",
    });
  } catch (err) {
    console.error("[comms/connect] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate connection" },
      { status: 500 }
    );
  }
}


