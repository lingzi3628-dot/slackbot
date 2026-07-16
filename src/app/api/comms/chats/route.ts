import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comms/chats?channelId=xxx&channelType=whatsapp
 * Returns the unified inbox conversation list.
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

    const conversations = await provider.listConversations(channelId);
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[comms/chats] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
