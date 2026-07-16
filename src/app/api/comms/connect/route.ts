import { NextRequest, NextResponse } from "next/server";
import { getProvider, IS_LIVE } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comms/connect
 * Body: { channelType?: "whatsapp" (default), channelId?: string }
 * Returns: { channelId, qrCode, expiresAt, live: boolean }
 *
 * In LIVE mode (EVOLUTION_API_URL + EVOLUTION_API_KEY set):
 *   - Creates a real Evolution API instance
 *   - Registers the webhook so incoming messages trigger AI auto-reply
 *   - Returns a real WhatsApp pairing QR code
 *
 * In DEMO mode:
 *   - Returns a demo QR + simulates the scan after 8 seconds
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channelType: ChannelType = (body.channelType as ChannelType) || "whatsapp";
    const channelId: string | undefined = body.channelId;

    const provider = getProvider(channelType);
    if (!provider) {
      return NextResponse.json({ error: `Channel "${channelType}" is not yet supported` }, { status: 400 });
    }

    const id = channelId || `spyro_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const { qrCode, expiresAt, resolvedChannelId } = await provider.initiateConnection(id);

    return NextResponse.json({
      channelId: resolvedChannelId,
      qrCode,
      expiresAt,
      channelType,
      displayName: provider.displayName,
      live: IS_LIVE,
    });
  } catch (err) {
    console.error("[comms/connect] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate connection" },
      { status: 500 }
    );
  }
}

