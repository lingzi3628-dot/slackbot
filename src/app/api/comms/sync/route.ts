import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comms/sync
 * Body: { channelId, channelType? }
 * Returns: { conversations, contacts }
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

    const result = await provider.sync(channelId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[comms/sync] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
