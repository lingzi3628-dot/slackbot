/**
 * Evolution API provider — powers the WhatsApp channel.
 *
 * In production this would proxy Evolution API (https://evolution-api.com):
 *   POST /instance/create          → create instance
 *   GET  /instance/connect/{name}  → QR code + connection state
 *   GET  /instance/fetchInstances  → status polling
 *   POST /instance/logout          → disconnect
 *   GET  /chat/findContacts/{name} → contacts
 *   GET  /chat/findChats/{name}    → conversations
 *
 * When no `EVOLUTION_API_URL` + `EVOLUTION_API_KEY` are configured, the
 * provider runs in DEMO mode: it generates a real scannable QR pointing at
 * a placeholder URL, simulates the scan after ~8 seconds, and serves the
 * realistic mock dataset so the entire UI is fully explorable.
 */
import QRCode from "qrcode";
import type {
  ChannelProvider, ChannelType, ChannelConnection, ConnectionStatus,
  ConversationSummary, ConversationDetail, ConversationMessage,
  Contact, DashboardStats,
} from "./types";
import {
  MOCK_CONVERSATIONS, MOCK_MESSAGES, MOCK_CONTACTS,
  MOCK_DASHBOARD, MOCK_AGENTS,
} from "./mock-data";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
export const EVOLUTION_CONFIGURED = Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY);

// ── In-memory connection registry (demo mode) ────────────────────────
interface ConnectionState {
  channelId: string;
  status: ConnectionStatus;
  qrCode?: string;
  qrExpiresAt?: number;
  connectedAt?: number;
  deviceName?: string;
  phoneNumber?: string;
  lastSyncAt?: number;
  health: { score: number; latencyMs?: number; uptimeHours?: number };
  // For demo: when the simulated scan should "complete"
  scanCompletesAt?: number;
}

const DEMO_CONNECTIONS = new Map<string, ConnectionState>();

function newChannelId(): string {
  return `wa_${Math.random().toString(36).slice(2, 10)}`;
}

async function generateQr(payload: string): Promise<string> {
  // A real QR PNG as a data URL — scannable by any phone.
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: { dark: "#09090B", light: "#FFFFFF" },
  });
}

export class EvolutionApiProvider implements ChannelProvider {
  type: ChannelType = "whatsapp";
  displayName = "WhatsApp";

  async initiateConnection(channelId: string): Promise<{ qrCode: string; expiresAt: number }> {
    const id = channelId || newChannelId();

    if (EVOLUTION_CONFIGURED) {
      // ── Real Evolution API path ─────────────────────────────────────
      // const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${id}`, {
      //   headers: { apikey: EVOLUTION_API_KEY! },
      // });
      // const data = await res.json();
      // const qr = data.base64?.replace(/^data:image\/png;base64,/, "") ?? data.qr;
      // …
      throw new Error("Evolution API live mode not yet wired — running in DEMO mode.");
    }

    // ── Demo mode: generate a real QR pointing at WhatsApp's pairing URL ──
    // The payload mimics the shape WhatsApp Web uses so it's a *real* QR,
    // even though scanning it won't pair a device. This is enough to show
    // the entire UX flow.
    const payload = `2@${id}.${Date.now().toString(36)},${crypto.randomUUID()},${crypto.randomUUID()}`;
    const qrCode = await generateQr(payload);
    const expiresAt = Date.now() + 60_000;

    DEMO_CONNECTIONS.set(id, {
      channelId: id,
      status: "connecting",
      qrCode,
      qrExpiresAt: expiresAt,
      health: { score: 100 },
      // Demo: simulate the user scanning after 8 seconds.
      scanCompletesAt: Date.now() + 8_000,
    });

    return { qrCode, expiresAt };
  }

  async getConnectionStatus(channelId: string): Promise<ChannelConnection> {
    const state = DEMO_CONNECTIONS.get(channelId);
    if (!state) {
      return {
        channelId,
        type: "whatsapp",
        status: "disconnected",
        health: { score: 0 },
      };
    }

    // Demo: flip to connected once the simulated scan completes.
    if (state.status === "connecting" && state.scanCompletesAt && Date.now() >= state.scanCompletesAt) {
      state.status = "connected";
      state.connectedAt = Date.now();
      state.deviceName = "Lewis's iPhone 15 Pro";
      state.phoneNumber = "+254 712 884 220";
      state.lastSyncAt = Date.now();
      state.health = { score: 96, latencyMs: 240, uptimeHours: 0 };
      delete state.qrCode;
      delete state.scanCompletesAt;
    }

    // Expire QR after 60s → go back to needing a refresh.
    if (state.status === "connecting" && state.qrExpiresAt && Date.now() > state.qrExpiresAt) {
      state.qrCode = undefined;
    }

    return {
      channelId: state.channelId,
      type: "whatsapp",
      status: state.status,
      deviceName: state.deviceName,
      phoneNumber: state.phoneNumber,
      connectedAt: state.connectedAt,
      lastSyncAt: state.lastSyncAt,
      qrCode: state.qrCode,
      health: state.health,
    };
  }

  async disconnect(channelId: string): Promise<void> {
    const state = DEMO_CONNECTIONS.get(channelId);
    if (state) {
      state.status = "disconnected";
      delete state.qrCode;
      delete state.connectedAt;
    }
  }

  async sync(_channelId: string): Promise<{ conversations: number; contacts: number }> {
    const state = DEMO_CONNECTIONS.get(_channelId);
    if (state) state.lastSyncAt = Date.now();
    // Brief delay so the "Syncing…" state is visible.
    await new Promise((r) => setTimeout(r, 1200));
    return { conversations: MOCK_CONVERSATIONS.length, contacts: MOCK_CONTACTS.length };
  }

  async listConversations(_channelId: string): Promise<ConversationSummary[]> {
    return [...MOCK_CONVERSATIONS].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.lastMessageAt - a.lastMessageAt;
    });
  }

  async getConversation(channelId: string, conversationId: string): Promise<ConversationDetail> {
    const summary = MOCK_CONVERSATIONS.find((c) => c.id === conversationId);
    if (!summary) throw new Error("Conversation not found");
    const contact = MOCK_CONTACTS.find((c) => c.id === summary.contactId)!;
    const messages = MOCK_MESSAGES[conversationId] ?? [];
    return {
      summary,
      messages,
      contact,
      activity: [
        { id: "act1", type: "message", description: `${contact.name} sent a message`, timestamp: summary.lastMessageAt },
        { id: "act2", type: summary.aiHandled ? "ai_reply" : "human_takeover", description: summary.aiHandled ? "AI agent replied" : "Escalated to human", timestamp: summary.lastMessageAt + 60_000 },
        ...(summary.assignedAgentId ? [{ id: "act3", type: "agent_assigned" as const, description: `Agent ${summary.assignedAgentId} assigned`, timestamp: summary.lastMessageAt - 600_000 }] : []),
      ],
      internalNotes: contact.notes
        ? [{ id: "n1", text: contact.notes, author: "Lewis", createdAt: summary.lastMessageAt - 3600_000 }]
        : [],
    };
  }

  async listContacts(_channelId: string): Promise<Contact[]> {
    return [...MOCK_CONTACTS].sort((a, b) => (b.lastInteractionAt ?? 0) - (a.lastInteractionAt ?? 0));
  }

  async getDashboard(channelId: string): Promise<DashboardStats> {
    const state = DEMO_CONNECTIONS.get(channelId);
    // If a real connection exists, surface its device name + last sync.
    if (state?.status === "connected") {
      return {
        ...MOCK_DASHBOARD,
        status: "connected",
        deviceName: state.deviceName,
        lastSyncAt: state.lastSyncAt,
        connectedAt: state.connectedAt,
        health: state.health,
      };
    }
    if (state?.status === "connecting") {
      return { ...MOCK_DASHBOARD, status: "connecting" };
    }
    return { ...MOCK_DASHBOARD, status: "disconnected", messagesToday: 0, activeConversations: 0 };
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
    // In demo mode we don't persist; the inbox refetches from mock data.
    return msg;
  }
}

// ── Provider registry (channel-agnostic) ──────────────────────────────
const PROVIDERS = new Map<ChannelType, ChannelProvider>();
const evolution = new EvolutionApiProvider();
PROVIDERS.set("whatsapp", evolution);

export function getProvider(type: ChannelType): ChannelProvider | undefined {
  return PROVIDERS.get(type);
}

export function listAvailableProviders(): ChannelProvider[] {
  return Array.from(PROVIDERS.values());
}

export { MOCK_AGENTS };
