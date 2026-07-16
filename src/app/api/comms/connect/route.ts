import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comms/connect
 * Body: { channelType?: "whatsapp" (default), channelId?: string }
 * Returns: { channelId, qrCode, expiresAt }
 *
 * Initiates a connection. The UI shows the QR, then polls /status.
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

    const id = channelId || `wa_${Math.random().toString(36).slice(2, 10)}`;
    const { qrCode, expiresAt } = await provider.initiateConnection(id);

    return NextResponse.json({
      channelId: id,
      qrCode,
      expiresAt,
      channelType,
      displayName: provider.displayName,
    });
  } catch (err) {
    console.error("[comms/connect] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initiate connection" },
      { status: 500 }
    );
  }
}
