import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChannelDef {
  id: string;
  name: string;
  envVars: string[];
  detailLabel: string;
}

const CHANNELS: ChannelDef[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    envVars: ["EVOLUTION_API_URL", "EVOLUTION_API_KEY"],
    detailLabel: "Evolution API URL",
  },
  {
    id: "telegram",
    name: "Telegram",
    envVars: ["TELEGRAM_BOT_TOKEN"],
    detailLabel: "Bot Token",
  },
  {
    id: "discord",
    name: "Discord",
    envVars: ["DISCORD_BOT_TOKEN", "DISCORD_WEBHOOK_URL"],
    detailLabel: "Bot Token / Webhook",
  },
  {
    id: "email",
    name: "Email",
    envVars: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
    detailLabel: "SMTP Host",
  },
  {
    id: "slack",
    name: "Slack",
    envVars: ["SLACK_BOT_TOKEN", "SLACK_WEBHOOK_URL"],
    detailLabel: "Bot Token / Webhook",
  },
  {
    id: "sms",
    name: "SMS",
    envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
    detailLabel: "Twilio Account SID",
  },
];

/** GET /api/admin/communications — comms channel manager data */
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Build channel status from env vars
  const channels = CHANNELS.map((ch) => {
    const configuredVars = ch.envVars.filter((v) => {
      const val = process.env[v];
      return typeof val === "string" && val.trim().length > 0;
    });
    const isConfigured = configuredVars.length > 0;
    const isFullyConfigured = configuredVars.length === ch.envVars.length;

    let status: "connected" | "configured" | "not_connected" | "error" = "not_connected";
    if (isFullyConfigured) status = "configured";
    else if (isConfigured) status = "configured";

    // Show partial value as connection detail (mask sensitive)
    let detail = "Not configured";
    if (isConfigured) {
      const firstSet = ch.envVars.find((v) => {
        const val = process.env[v];
        return typeof val === "string" && val.trim().length > 0;
      });
      if (firstSet) {
        const val = process.env[firstSet] || "";
        // For URLs, show fully; for tokens/keys, show masked
        if (firstSet.includes("URL") || firstSet.includes("HOST")) {
          detail = val;
        } else {
          detail = `${firstSet}=${val.slice(0, 4)}••••${val.slice(-2)}`;
        }
      }
    }

    return {
      id: ch.id,
      name: ch.name,
      status,
      detailLabel: ch.detailLabel,
      detail,
      envVars: ch.envVars.map((v) => ({ name: v, set: !!process.env[v] })),
    };
  });

  const connectedCount = channels.filter((c) => c.status === "configured").length;

  // ── Recent messages (proxy for "communications activity") ───────────
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [recentMessagesRaw, aiReplies24h, messages24h] = await Promise.all([
    db.message.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        conversation: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    }).catch(() => [] as any[]),
    db.message.count({
      where: { role: "assistant", createdAt: { gte: dayAgo } },
    }).catch(() => 0),
    db.message.count({
      where: { createdAt: { gte: dayAgo } },
    }).catch(() => 0),
  ]);

  const recentMessages = recentMessagesRaw.map((m: any) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    type: m.type,
    createdAt: m.createdAt,
    conversationId: m.conversationId,
    conversationTitle: m.conversation?.title || "Untitled",
    userName: m.conversation?.user?.name || "Unknown",
    userEmail: m.conversation?.user?.email || null,
  }));

  return NextResponse.json({
    stats: {
      connectedChannels: connectedCount,
      totalChannels: CHANNELS.length,
      messages24h,
      aiReplies24h,
      humanTakeovers: 0, // No takeover table yet
    },
    channels,
    recentMessages,
  });
}
