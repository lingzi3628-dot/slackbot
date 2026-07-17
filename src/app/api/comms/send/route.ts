import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/comms/send
 * Body: { channelId, conversationId, text, channelType? }
 * Returns the created outbound message.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { channelId, conversationId, text } = body;
    const channelType: ChannelType = (body.channelType as ChannelType) || "whatsapp";

    if (!channelId || !conversationId || !text?.trim()) {
      return NextResponse.json({ error: "channelId, conversationId and text are required" }, { status: 400 });
    }

    const provider = getProvider(channelType);
    if (!provider) {
      return NextResponse.json({ error: "Unsupported channel" }, { status: 400 });
    }

    const message = await provider.sendMessage(channelId, conversationId, text.trim());
    return NextResponse.json(message);
  } catch (err) {
    console.error("[comms/send] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send message" },
      { status: 500 }
    );
  }
}
