/**
 * Pairing Server provider — talks to the Telmass pairing-server
 * running on the VPS (seth1.sethtech.duckdns.org).
 *
 * This is a REAL WhatsApp integration powered by Baileys. Unlike the QR
 * flow, this uses a PAIRING CODE flow:
 *   1. User enters their phone number
 *   2. Server generates a pairing code (e.g. "L1LR-Y1G9")
 *   3. User opens WhatsApp → Linked Devices → Link a Device
 *   4. User enters the pairing code instead of scanning a QR
 *   5. Device connects — phone number is the session identifier
 *
 * The pairing-server forwards incoming messages to our webhook, which
 * triggers the AI agent auto-reply flow.
 */
import type {
  ChannelProvider, ChannelType, ChannelConnection, ConnectionStatus,
  ConversationSummary, ConversationDetail, ConversationMessage,
  Contact, DashboardStats,
} from "./types";

const PAIRING_SERVER_URL =
  process.env.PAIRING_SERVER_URL ||
  "http://seth1.sethtech.duckdns.org";

let _healthCache: { ok: boolean; checkedAt: number } = { ok: false, checkedAt: 0 };

export async function isPairingServerAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - _healthCache.checkedAt < 10_000) return _healthCache.ok;
  try {
    const res = await fetch(`${PAIRING_SERVER_URL}/status`, { cache: "no-store" });
    _healthCache = { ok: res.ok, checkedAt: now };
    return res.ok;
  } catch {
    _healthCache = { ok: false, checkedAt: now };
    return false;
  }
}

export class PairingServerProvider implements ChannelProvider {
  type: ChannelType = "whatsapp";
  displayName = "WhatsApp (Live)";
  serverUrl = PAIRING_SERVER_URL;

  /**
   * Initiate a connection. In the pairing-server flow, this requires a
   * phone number (passed as the channelId). Returns the pairing code
   * that the user enters in WhatsApp.
   */
  async initiateConnection(channelId: string): Promise<{
    qrCode: string;
    expiresAt: number;
    resolvedChannelId: string;
    pairingCode?: string;
    pairingLink?: string;
  }> {
    // channelId must be a phone number for the pairing-server flow.
    const phone = channelId || "";
    if (!phone) {
      throw new Error("A phone number is required to connect WhatsApp via the pairing server.");
    }

    const res = await fetch(`${this.serverUrl}/pair`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || data.error || "Pairing request failed");
    }

    return {
      qrCode: data.qr ? `data:image/png;base64,${data.qr}` : "",
      expiresAt: data.expiresAt ? new Date(data.expiresAt).getTime() : Date.now() + 120_000,
      resolvedChannelId: data.sessionId,
      pairingCode: data.pairingCode,
      pairingLink: data.pairingLink,
    };
  }

  async getConnectionStatus(channelId: string): Promise<ChannelConnection> {
    try {
      const res = await fetch(`${this.serverUrl}/pair/${channelId}`, { cache: "no-store" });
      if (!res.ok) {
        return { channelId, type: "whatsapp", status: "disconnected", health: { score: 0 } };
      }
      const data = await res.json();
      const session = data.session;
      if (!session) {
        return { channelId, type: "whatsapp", status: "disconnected", health: { score: 0 } };
      }

      let status: ConnectionStatus = "disconnected";
      if (session.status === "connected" || session.connection === "open") {
        status = "connected";
      } else if (session.status === "waiting" || session.connection === "connecting") {
        status = "connecting";
      }

      return {
        channelId,
        type: "whatsapp",
        status,
        phoneNumber: session.phone ? `+${session.phone}` : undefined,
        connectedAt: session.connectedAt,
        lastSyncAt: session.connectedAt,
        health: status === "connected" ? { score: 96 } : { score: 0 },
      };
    } catch {
      return { channelId, type: "whatsapp", status: "disconnected", health: { score: 0 } };
    }
  }

  async disconnect(channelId: string): Promise<void> {
    try {
      await fetch(`${this.serverUrl}/pair/${channelId}`, { method: "DELETE" });
    } catch { /* ignore */ }
  }

  async sync(_channelId: string): Promise<{ conversations: number; contacts: number }> {
    return { conversations: 0, contacts: 0 };
  }

  async listConversations(channelId: string): Promise<ConversationSummary[]> {
    try {
      const res = await fetch(`${this.serverUrl}/chats/${channelId}`, { cache: "no-store" });
      const data = await res.json();
      const chats = data.chats || [];
      return chats.map((c: any) => ({
        id: c.id || c.phone,
        channelId,
        channelType: "whatsapp" as const,
        contactId: c.id || c.phone,
        contactName: c.name || c.phone,
        contactAvatarColor: "#8B5CF6",
        contactPhone: c.phone,
        unreadCount: c.unreadCount ?? 0,
        pinned: false,
        labels: [],
        tags: [],
        lastMessagePreview: c.lastMessage || "",
        lastMessageAt: c.timestamp || Date.now(),
        lastMessageDirection: "in" as const,
        sentiment: "unknown" as const,
        suggestedReplies: [],
      }));
    } catch {
      return [];
    }
  }

  async getConversation(channelId: string, conversationId: string): Promise<ConversationDetail> {
    return {
      summary: {
        id: conversationId,
        channelId,
        channelType: "whatsapp",
        contactId: conversationId,
        contactName: conversationId.split("@")[0],
        contactAvatarColor: "#8B5CF6",
        contactPhone: conversationId.split("@")[0],
        unreadCount: 0,
        pinned: false,
        labels: [],
        tags: [],
        lastMessagePreview: "",
        lastMessageAt: Date.now(),
        lastMessageDirection: "in",
        sentiment: "unknown",
        suggestedReplies: [],
      },
      messages: [],
      contact: {
        id: conversationId,
        channelId,
        name: conversationId.split("@")[0],
        phone: conversationId.split("@")[0],
        avatarColor: "#8B5CF6",
        tags: [],
        sentiment: "unknown",
        conversationCount: 1,
        customFields: {},
      },
      activity: [],
      internalNotes: [],
    };
  }

  async listContacts(_channelId: string): Promise<Contact[]> {
    return [];
  }

  async getDashboard(channelId: string): Promise<DashboardStats> {
    const status = await this.getConnectionStatus(channelId);
    try {
      const res = await fetch(`${this.serverUrl}/status`, { cache: "no-store" });
      const data = await res.json();
      return {
        status: status.status,
        deviceName: status.status === "connected" ? "WhatsApp" : undefined,
        phoneNumber: status.phoneNumber,
        lastSyncAt: status.lastSyncAt,
        messagesToday: 0,
        activeConversations: data.activePairings ?? 0,
        aiResponseRate: 0,
        humanTakeoverRate: 0,
        connectedAgents: 0,
        recentActivity: status.status === "connected"
          ? [{ id: "a1", type: "connection", description: `WhatsApp connected · ${status.phoneNumber}`, timestamp: status.connectedAt || Date.now() }]
          : [],
        health: status.health,
      };
    } catch {
      return {
        status: status.status,
        messagesToday: 0,
        activeConversations: 0,
        aiResponseRate: 0,
        humanTakeoverRate: 0,
        connectedAgents: 0,
        recentActivity: [],
        health: status.health,
      };
    }
  }

  async sendMessage(channelId: string, conversationId: string, text: string): Promise<ConversationMessage> {
    const msg: ConversationMessage = {
      id: `m_${Date.now()}`,
      conversationId,
      direction: "out",
      status: "sent",
      text,
      attachments: [],
      createdAt: Date.now(),
      authorIsAgent: true,
      authorIsAI: false,
    };
    try {
      // channelId is the sessionId; conversationId is the recipient's number
      const recipientNumber = conversationId.split("@")[0].split(":")[0];
      const res = await fetch(`${this.serverUrl}/send/${channelId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: recipientNumber, text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) msg.status = "failed";
      else if (data.messageId) msg.id = data.messageId;
    } catch {
      msg.status = "failed";
    }
    return msg;
  }
}
