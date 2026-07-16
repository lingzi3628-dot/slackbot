import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comms/disconnect
 * Body: { channelId, channelType? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const channelId: string | undefined = body.channelId;
    const channelType: ChannelType = (body.channelType as ChannelType) || "whatsapp";

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const provider = getProvider(channelType);
    if (!provider) {
      return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
    }

    await provider.disconnect(channelId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[comms/disconnect] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to disconnect" },
      { status: 500 }
    );
  }
}
