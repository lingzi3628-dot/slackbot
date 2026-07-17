import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comms/conversation?channelId=xxx&conversationId=yyy&channelType=whatsapp
 * Returns the full thread: messages, contact, activity, internal notes.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    const conversationId = searchParams.get("conversationId");
    const channelType = (searchParams.get("channelType") as ChannelType) || "whatsapp";

    if (!channelId || !conversationId) {
      return NextResponse.json({ error: "channelId and conversationId are required" }, { status: 400 });
    }

    const provider = getProvider(channelType);
    if (!provider) {
      return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
    }

    const detail = await provider.getConversation(channelId, conversationId);
    return NextResponse.json(detail);
  } catch (err) {
    console.error("[comms/conversation] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
