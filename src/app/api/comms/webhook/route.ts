import { NextRequest, NextResponse } from "next/server";
import { getProviderByChannelType, IS_LIVE } from "@/lib/comms/evolution-api";
import { getSpyroReply, type SpyroMessage } from "@/lib/spyro-engine";
import { MOCK_AGENTS } from "@/lib/comms/evolution-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30; // give the AI agent time to reply

/**
 * POST /api/comms/webhook?channelId=xxx
 *
 * Evolution API calls this endpoint whenever a new WhatsApp message
 * arrives on the connected instance. The flow:
 *
 *   1. Evolution API → POST here with the incoming message
 *   2. We find the AI agent assigned to this channel
 *   3. The agent generates a reply via spyro-engine (getSpyroReply)
 *   4. We send the reply back via Evolution API sendText — FROM the
 *      connected WhatsApp number, so the customer sees it as a reply
 *      from the business.
 *
 * In DEMO mode this endpoint is a no-op (no real messages arrive).
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");
    if (!channelId) {
      return NextResponse.json({ error: "channelId required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const event = body?.event;

    // Evolution API event types:
    //   messages.upsert     — new incoming/outgoing message
    //   connection.update   — connection state changed
    //   contacts.upsert     — contact synced
    //   chats.upsert        — chat synced
    console.log(`[comms/webhook] event=${event} channel=${channelId}`);

    // ── Handle connection state changes ──────────────────────────────
    if (event === "connection.update") {
      // Could refresh status cache here. For now just acknowledge.
      return NextResponse.json({ ok: true, event });
    }

    // ── Handle incoming messages ─────────────────────────────────────
    if (event === "messages.upsert") {
      const messages = body?.data?.messages ?? body?.messages ?? [];
      const instance = body?.instance || channelId;

      for (const msg of messages) {
        // Only process incoming messages (not our own outgoing ones).
        if (msg?.key?.fromMe) continue;

        const fromNumber = msg?.key?.remoteJid?.split("@")[0] || msg?.key?.participant?.split("@")[0];
        if (!fromNumber) continue;

        // Extract text content (WhatsApp messages can be various types).
        const text =
          msg?.message?.conversation ||
          msg?.message?.extendedTextMessage?.text ||
          msg?.message?.imageMessage?.caption ||
          msg?.message?.videoMessage?.caption ||
          "";

        if (!text.trim()) continue;

        console.log(`[comms/webhook] incoming from ${fromNumber}: ${text.slice(0, 80)}`);

        // Find the AI agent assigned to this channel.
        const agent = MOCK_AGENTS.find((a) => a.channels.includes("whatsapp"));
        if (!agent) {
          console.log("[comms/webhook] no agent assigned — skipping auto-reply");
          continue;
        }

        // Check business hours if the agent is set to business_hours mode.
        if (agent.autoReplyMode === "business_hours") {
          const now = new Date();
          const hour = now.getHours();
          const day = now.getDay();
          const inHours = agent.businessHours.daysActive.includes(day)
            && hour >= parseInt(agent.businessHours.start.split(":")[0])
            && hour < parseInt(agent.businessHours.end.split(":")[0]);
          if (!inHours) {
            console.log("[comms/webhook] outside business hours — skipping");
            continue;
          }
        }

        if (agent.autoReplyMode === "off") {
          console.log("[comms/webhook] auto-reply off — skipping");
          continue;
        }

        // ── Generate the AI agent's reply ────────────────────────────
        try {
          const agentSystemPrompt = buildAgentSystemPrompt(agent, fromNumber);
          const replyMessages: SpyroMessage[] = [
            { role: "system", content: agentSystemPrompt },
            { role: "user", content: text },
          ];

          const reply = await getSpyroReply(replyMessages, {
            model: "openai",
            temperature: 0.7,
            traceName: "comms-whatsapp-reply",
          });

          console.log(`[comms/webhook] agent reply to ${fromNumber}: ${reply.slice(0, 80)}`);

          // ── Send the reply FROM the connected WhatsApp number ───────
          const provider = getProviderByChannelType("whatsapp");
          if (provider) {
            // conversationId = the recipient's JID (number@s.whatsapp.net)
            const recipientJid = msg?.key?.remoteJid || `${fromNumber}@s.whatsapp.net`;
            await provider.sendMessage(instance, recipientJid, reply);
            console.log(`[comms/webhook] reply sent to ${fromNumber} from connected number`);
          }
        } catch (err) {
          console.error("[comms/webhook] agent reply failed:", err);
        }
      }

      return NextResponse.json({ ok: true, processed: messages.length });
    }

    // Acknowledge other events (contacts.upsert, chats.upsert, etc.)
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error("[comms/webhook] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 }
    );
  }
}

/**
 * Build a system prompt for the AI agent based on its configuration.
 * This is what makes the agent reply with the right tone, style, and
 * knowledge — and know that it's replying from a specific WhatsApp number.
 */
function buildAgentSystemPrompt(agent: typeof MOCK_AGENTS[number], fromNumber: string): string {
  const styleGuide: Record<string, string> = {
    concise: "Be very concise. Reply in 1-2 short sentences.",
    balanced: "Be balanced — clear and complete but not overly long.",
    detailed: "Be thorough and detailed in your replies.",
    friendly: "Be warm, friendly, and conversational. Use emojis sparingly.",
    formal: "Be professional and formal in tone.",
  };

  return `You are ${agent.agentName}, an AI assistant managing WhatsApp conversations for a business.

You are replying from the business's connected WhatsApp number. The customer (${fromNumber}) has sent you a message. Reply helpfully and professionally.

Style: ${styleGuide[agent.responseStyle] || styleGuide.balanced}

Knowledge sources: ${agent.knowledgeSources.join(", ")}

Rules:
- Reply as if you are the business's assistant on WhatsApp.
- Keep replies short — WhatsApp is a chat medium, not email.
- If the customer asks something you don't know, say so honestly.
- If the message seems urgent or the customer is frustrated, acknowledge it and offer to escalate to a human.
- Never reveal you are an AI language model. You are ${agent.agentName}.
- Do not include any attribution, watermarks, or "Powered by" text.`;
}
