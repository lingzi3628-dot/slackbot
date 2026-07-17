import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comms/status?channelId=xxx&channelType=whatsapp
 * Returns the live connection state. While "connecting", includes the QR
 * code data URL so the UI can refresh it without a new POST.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const channelType = (searchParams.get("channelType") as ChannelType) || "whatsapp";

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const provider = getProvider(channelType);
    if (!provider) {
      return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
    }

    const connection = await provider.getConnectionStatus(channelId);
    return NextResponse.json(connection);
  } catch (err) {
    console.error("[comms/status] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch status" },
      { status: 500 }
    );
  }
}
