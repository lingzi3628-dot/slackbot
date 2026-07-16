/**
 * Evolution API provider — powers the WhatsApp channel.
 *
 * LIVE MODE (when EVOLUTION_API_URL + EVOLUTION_API_KEY are set):
 *   - POST /instance/create          → create instance + register webhook
 *   - GET  /instance/connect/{name}  → real QR code for WhatsApp pairing
 *   - GET  /instance/fetchInstance/{name} → poll connection state
 *   - POST /instance/logout/{name}   → disconnect
 *   - GET  /chat/findContacts/{name} → real contacts
 *   - GET  /chat/findChats/{name}    → real conversations
 *   - POST /message/sendText/{name}  → send a message FROM the connected number
 *
 * DEMO MODE (no env vars):
 *   - Generates a real scannable QR (demo payload)
 *   - Simulates the scan after ~8 seconds
 *   - Serves the mock dataset so the UI is fully explorable
 *
 * The AI agent auto-reply flow:
 *   1. Evolution API sends incoming messages to POST /api/comms/webhook
 *   2. The webhook finds the assigned agent for that channel
 *   3. The agent generates a reply via spyro-engine (getSpyroReply)
 *   4. The reply is sent back via Evolution API sendText — from the
 *      connected WhatsApp number, with the phone number attached.
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

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL?.replace(/\/$/, "");
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
/** Public base URL of THIS app — used to build the webhook URL Evolution API
 *  will call when incoming WhatsApp messages arrive. */
const APP_PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
export const EVOLUTION_CONFIGURED = Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY);
export const WEBHOOK_CONFIGURED = Boolean(APP_PUBLIC_URL);

// The active provider is resolved async (Baileys health check). Exported
// for the mode endpoint. Default: Evolution if configured, else not-live.
export const IS_LIVE = EVOLUTION_CONFIGURED;

// ── In-memory connection registry (both modes) ───────────────────────
// NOTE: In serverless/edge deployments, in-memory state does NOT persist
// between requests. For demo mode we encode the start timestamp in the
// channelId so status can be computed statelessly. For live mode, the
// Evolution API is the source of truth (we poll it on every status check).
interface ConnectionState {
  channelId: string;       // Evolution API instance name
  status: ConnectionStatus;
  qrCode?: string;         // data URL while connecting
  qrExpiresAt?: number;
  connectedAt?: number;
  deviceName?: string;
  phoneNumber?: string;    // The connected WhatsApp number (JID or readable)
  lastSyncAt?: number;
  health: { score: number; latencyMs?: number; uptimeHours?: number };
  // Demo: when the simulated scan should "complete"
  scanCompletesAt?: number;
  // Live: webhook secret for verifying incoming messages
  webhookSecret?: string;
}

const CONNECTIONS = new Map<string, ConnectionState>();

/**
 * Demo mode: encode the connection start time in the channelId so the
 * status endpoint can compute the simulated scan completion statelessly
 * (works across serverless invocations where in-memory state is lost).
 */
function newDemoChannelId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `spyro_${ts}_${rand}`;
}

/** Extract the encoded start timestamp from a demo channelId. */
function parseDemoChannelId(id: string): number | null {
  const m = id.match(/^spyro_([a-z0-9]+)_/);
  if (!m) return null;
  const ts = parseInt(m[1], 36);
  return Number.isFinite(ts) ? ts : null;
}

async function generateQr(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 480,
    color: { dark: "#09090B", light: "#FFFFFF" },
  });
}

// ── Evolution API HTTP helpers (live mode) ────────────────────────────
async function evoFetch(path: string, opts: RequestInit = {}): Promise<any> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    throw new Error("Evolution API not configured");
  }
  const res = await fetch(`${EVOLUTION_API_URL}${path}`, {
    ...opts,
    headers: {
      "content-type": "application/json",
      apikey: EVOLUTION_API_KEY,
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(data?.message || data?.error || `Evolution API ${res.status}`);
  }
  return data;
}

/** Normalize an Evolution API state string to our ConnectionStatus. */
function mapEvoState(state: string | undefined): ConnectionStatus {
  switch (state?.toLowerCase()) {
    case "open": case "connected": return "connected";
    case "connecting": case "qr_code": return "connecting";
    case "close": case "closed": case "disconnected": return "disconnected";
    default: return "disconnected";
  }
}

export class EvolutionApiProvider implements ChannelProvider {
  type: ChannelType = "whatsapp";
  displayName = "WhatsApp";

  async initiateConnection(channelId: string): Promise<{ qrCode: string; expiresAt: number }> {
    const id = channelId || newChannelId();

    // ── LIVE MODE ────────────────────────────────────────────────────
    if (IS_LIVE) {
      // 1. Create the instance (idempotent — if it exists, Evolution returns it).
      const webhookUrl = WEBHOOK_CONFIGURED
        ? `${APP_PUBLIC_URL}/api/comms/webhook?channelId=${id}`
        : undefined;

      try {
        await evoFetch(`/instance/create`, {
          method: "POST",
          body: JSON.stringify({
            instanceName: id,
            webhook: webhookUrl ? {
              url: webhookUrl,
              events: [
                "messages.upsert",
                "messages.update",
                "connection.update",
                "contacts.upsert",
                "chats.upsert",
              ],
            } : undefined,
          }),
        });
      } catch (err) {
        // Instance may already exist — that's fine, continue to connect.
        console.log("[evo] create instance:", err instanceof Error ? err.message : err);
      }

      // 2. Request the QR code.
      const connectData = await evoFetch(`/instance/connect/${id}`, { method: "GET" });
      // Evolution returns { code: "base64..." } or { base64: "data:image/png;base64,..." }
      let qrCode: string;
      if (connectData.code) {
        qrCode = connectData.code.startsWith("data:")
          ? connectData.code
          : `data:image/png;base64,${connectData.code}`;
      } else if (connectData.base64) {
        qrCode = connectData.base64.startsWith("data:")
          ? connectData.base64
          : `data:image/png;base64,${connectData.base64}`;
      } else if (connectData.qrcode?.code) {
        qrCode = connectData.qrcode.code.startsWith("data:")
          ? connectData.qrcode.code
          : `data:image/png;base64,${connectData.qrcode.code}`;
      } else {
        throw new Error("Evolution API did not return a QR code");
      }

      const expiresAt = Date.now() + 60_000;
      CONNECTIONS.set(id, {
        channelId: id,
        status: "connecting",
        qrCode,
        qrExpiresAt: expiresAt,
        health: { score: 100 },
      });
      return { qrCode, expiresAt, resolvedChannelId: id };
    }

    // ── DEMO MODE ────────────────────────────────────────────────────
    // Use a channelId that encodes the start timestamp so status can be
    // computed statelessly across serverless invocations.
    const demoId = channelId || newDemoChannelId();
    const payload = `2@${demoId}.${Date.now().toString(36)},${crypto.randomUUID()},${crypto.randomUUID()}`;
    const qrCode = await generateQr(payload);
    const expiresAt = Date.now() + 60_000;
    // Store in memory too (for same-instance calls) but don't rely on it.
    CONNECTIONS.set(demoId, {
      channelId: demoId,
      status: "connecting",
      qrCode,
      qrExpiresAt: expiresAt,
      health: { score: 100 },
      scanCompletesAt: Date.now() + 8_000,
    });
    return { qrCode, expiresAt, resolvedChannelId: demoId };
  }

  async getConnectionStatus(channelId: string): Promise<ChannelConnection> {
    const state = CONNECTIONS.get(channelId);

    // ── LIVE MODE: poll Evolution API ────────────────────────────────
    if (IS_LIVE && state) {
      try {
        const data = await evoFetch(`/instance/fetchInstance/${channelId}`, { method: "GET" });
        const evoState = data?.instance?.state || data?.state;
        const status = mapEvoState(evoState);

        if (status === "connected" && state.status !== "connected") {
          // Just connected — capture the phone number + device info.
          state.status = "connected";
          state.connectedAt = Date.now();
          state.lastSyncAt = Date.now();
          state.phoneNumber = data?.instance?.ownerJid
            || data?.instance?.number
            || data?.number
            || undefined;
          state.deviceName = data?.instance?.deviceName || data?.instance?.profileName || "WhatsApp Web";
          state.health = { score: 96, latencyMs: 240, uptimeHours: 0 };
          delete state.qrCode;
        } else if (status === "connecting") {
          state.status = "connecting";
          // Refresh QR if Evolution provides a new one.
          if (data?.code || data?.qrcode?.code) {
            const code = data.code || data.qrcode.code;
            state.qrCode = code.startsWith("data:") ? code : `data:image/png;base64,${code}`;
          }
        } else if (status === "disconnected" && state.status === "connected") {
          state.status = "reconnecting";
        }
      } catch (err) {
        console.error("[evo] fetchInstance error:", err);
      }
    }

    // ── DEMO MODE: compute status statelessly from channelId timestamp ──
    if (!IS_LIVE) {
      const startTs = parseDemoChannelId(channelId);
      if (startTs) {
        const elapsed = Date.now() - startTs;
        const SCAN_DURATION = 8_000;
        const QR_EXPIRY = 60_000;

        if (elapsed >= SCAN_DURATION) {
          // Simulated scan has completed.
          const connectedAt = startTs + SCAN_DURATION;
          const uptimeHours = (Date.now() - connectedAt) / 3_600_000;
          return {
            channelId,
            type: "whatsapp",
            status: "connected",
            deviceName: "Lewis's iPhone 15 Pro",
            phoneNumber: "+254 712 884 220",
            connectedAt,
            lastSyncAt: connectedAt,
            health: { score: 96, latencyMs: 240, uptimeHours: Math.round(uptimeHours * 10) / 10 },
          };
        }
        // Still connecting — QR is valid for 60s.
        if (elapsed < QR_EXPIRY && state?.qrCode) {
          return {
            channelId,
            type: "whatsapp",
            status: "connecting",
            qrCode: state.qrCode,
            health: { score: 100 },
          };
        }
        // QR expired — still connecting but needs refresh.
        return {
          channelId,
          type: "whatsapp",
          status: "connecting",
          health: { score: 100 },
        };
      }
    }

    if (!state) {
      return { channelId, type: "whatsapp", status: "disconnected", health: { score: 0 } };
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
    const state = CONNECTIONS.get(channelId);

    // ── LIVE: call Evolution API logout ──────────────────────────────
    if (IS_LIVE && state) {
      try {
        await evoFetch(`/instance/logout/${channelId}`, { method: "DELETE" });
      } catch (err) {
        console.error("[evo] logout error:", err);
      }
    }

    if (state) {
      state.status = "disconnected";
      delete state.qrCode;
      delete state.connectedAt;
      delete state.phoneNumber;
    }
  }

  async sync(channelId: string): Promise<{ conversations: number; contacts: number }> {
    const state = CONNECTIONS.get(channelId);
    if (state) state.lastSyncAt = Date.now();

    if (IS_LIVE) {
      // Live sync: fetch real chats + contacts from Evolution API.
      try {
        const [chats, contacts] = await Promise.all([
          evoFetch(`/chat/findChats/${channelId}`, { method: "GET" }).catch(() => ({ chats: [] })),
          evoFetch(`/chat/findContacts/${channelId}`, { method: "GET" }).catch(() => ({ contacts: [] })),
        ]);
        return {
          conversations: Array.isArray(chats) ? chats.length : (chats?.chats?.length ?? 0),
          contacts: Array.isArray(contacts) ? contacts.length : (contacts?.contacts?.length ?? 0),
        };
      } catch {
        return { conversations: 0, contacts: 0 };
      }
    }

    // Demo sync.
    await new Promise((r) => setTimeout(r, 1200));
    return { conversations: MOCK_CONVERSATIONS.length, contacts: MOCK_CONTACTS.length };
  }

  async listConversations(channelId: string): Promise<ConversationSummary[]> {
    if (IS_LIVE) {
      try {
        const data = await evoFetch(`/chat/findChats/${channelId}`, { method: "GET" });
        const chats = Array.isArray(data) ? data : (data?.chats ?? []);
        return chats.map((chat: any) => mapEvoChatToSummary(chat, channelId));
      } catch (err) {
        console.error("[evo] listConversations error:", err);
        return [];
      }
    }
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

  async listContacts(channelId: string): Promise<Contact[]> {
    if (IS_LIVE) {
      try {
        const data = await evoFetch(`/chat/findContacts/${channelId}`, { method: "GET" });
        const raw = Array.isArray(data) ? data : (data?.contacts ?? []);
        return raw.map((c: any) => mapEvoContactToContact(c, channelId));
      } catch {
        return [];
      }
    }
    return [...MOCK_CONTACTS].sort((a, b) => (b.lastInteractionAt ?? 0) - (a.lastInteractionAt ?? 0));
  }

  async getDashboard(channelId: string): Promise<DashboardStats> {
    // Compute connection status statelessly (demo mode).
    if (!IS_LIVE) {
      const startTs = parseDemoChannelId(channelId);
      if (startTs) {
        const elapsed = Date.now() - startTs;
        const SCAN_DURATION = 8_000;
        if (elapsed >= SCAN_DURATION) {
          const connectedAt = startTs + SCAN_DURATION;
          const uptimeHours = (Date.now() - connectedAt) / 3_600_000;
          return {
            ...MOCK_DASHBOARD,
            status: "connected",
            deviceName: "Lewis's iPhone 15 Pro",
            phoneNumber: "+254 712 884 220",
            lastSyncAt: connectedAt,
            connectedAt,
            health: { score: 96, latencyMs: 240, uptimeHours: Math.round(uptimeHours * 10) / 10 },
          };
        }
        return { ...MOCK_DASHBOARD, status: "connecting", messagesToday: 0, activeConversations: 0 };
      }
    }

    const state = CONNECTIONS.get(channelId);
    if (state?.status === "connected") {
      return {
        ...MOCK_DASHBOARD,
        status: "connected",
        deviceName: state.deviceName,
        phoneNumber: state.phoneNumber,
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

  /**
   * Send a message FROM the connected WhatsApp number TO a recipient.
   * This is the real send path — the message goes out through Evolution
   * API and appears in the recipient's WhatsApp as coming from your
   * connected business number.
   */
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

    if (IS_LIVE) {
      // conversationId is the recipient's phone number (or JID) in live mode.
      try {
        await evoFetch(`/message/sendText/${channelId}`, {
          method: "POST",
          body: JSON.stringify({
            number: conversationId,
            text,
          }),
        });
        msg.status = "sent";
      } catch (err) {
        console.error("[evo] sendMessage error:", err);
        msg.status = "failed";
      }
    }

    return msg;
  }
}

// ── Mappers (Evolution API → our types) ───────────────────────────────
function mapEvoChatToSummary(chat: any, channelId: string): ConversationSummary {
  const phone = chat?.id?.remote?.jid || chat?.remoteJid || chat?.id || "";
  const name = chat?.name || chat?.pushName || phone.split("@")[0] || "Unknown";
  const lastMsg = chat?.lastMessage || {};
  return {
    id: phone,
    channelId,
    channelType: "whatsapp",
    contactId: phone,
    contactName: name,
    contactAvatarColor: "#8B5CF6",
    contactPhone: phone.split("@")[0],
    unreadCount: chat?.unreadCount ?? 0,
    pinned: false,
    labels: [],
    tags: [],
    lastMessagePreview: lastMsg?.message?.conversation || lastMsg?.message?.extendedTextMessage?.text || "",
    lastMessageAt: lastMsg?.messageTimestamp ? Number(lastMsg.messageTimestamp) * 1000 : Date.now(),
    lastMessageDirection: lastMsg?.key?.fromMe ? "out" : "in",
    assignedAgentId: undefined,
    aiHandled: false,
    humanTakenOver: false,
    sentiment: "unknown",
    suggestedReplies: [],
  };
}

function mapEvoContactToContact(c: any, channelId: string): Contact {
  const phone = c?.id || c?.phone || c?.jid?.split("@")[0] || "";
  return {
    id: phone,
    channelId,
    name: c?.name || c?.pushName || phone || "Unknown",
    phone,
    avatarColor: "#8B5CF6",
    tags: [],
    notes: undefined,
    assignedAgentId: undefined,
    lastInteractionAt: c?.lastInteraction ? Number(c.lastInteraction) * 1000 : undefined,
    sentiment: "unknown",
    conversationCount: 1,
    customFields: {},
  };
}

// ── Provider registry (channel-agnostic) ──────────────────────────────
// Provider priority:
//   1. Pairing Server (VPS — real WhatsApp, pairing code flow) ← highest
//   2. Baileys (local mini-service — real WhatsApp, QR flow)
//   3. Evolution API (when configured via env vars)
//   4. Demo mode (fallback)
import { BaileysProvider, isBaileysAvailable } from "./baileys-provider";
import { PairingServerProvider, isPairingServerAvailable } from "./pairing-server-provider";

const PROVIDERS = new Map<ChannelType, ChannelProvider>();
const evolution = new EvolutionApiProvider();
const baileys = new BaileysProvider();
const pairingServer = new PairingServerProvider();

let activeProvider: ChannelProvider = evolution;
PROVIDERS.set("whatsapp", evolution);

let _resolved = false;
export async function resolveProvider(): Promise<ChannelProvider> {
  if (_resolved) return activeProvider;
  _resolved = true;

  if (await isPairingServerAvailable()) {
    console.log("[comms] Using Pairing Server provider (VPS — real WhatsApp)");
    activeProvider = pairingServer;
    PROVIDERS.set("whatsapp", pairingServer);
    return pairingServer;
  }
  if (await isBaileysAvailable()) {
    console.log("[comms] Using Baileys provider (local mini-service)");
    activeProvider = baileys;
    PROVIDERS.set("whatsapp", baileys);
    return baileys;
  }
  if (EVOLUTION_CONFIGURED) {
    console.log("[comms] Using Evolution API provider");
    activeProvider = evolution;
    PROVIDERS.set("whatsapp", evolution);
    return evolution;
  }
  console.log("[comms] Using Evolution provider in DEMO mode");
  return evolution;
}

export function getProvider(type: ChannelType): ChannelProvider | undefined {
  return PROVIDERS.get(type);
}

export function listAvailableProviders(): ChannelProvider[] {
  return Array.from(PROVIDERS.values());
}

export function getProviderByChannelType(type: ChannelType): ChannelProvider | undefined {
  return PROVIDERS.get(type);
}

export async function getActiveMode(): Promise<"pairing" | "baileys" | "evolution" | "demo"> {
  if (await isPairingServerAvailable()) return "pairing";
  if (await isBaileysAvailable()) return "baileys";
  if (EVOLUTION_CONFIGURED) return "evolution";
  return "demo";
}

export { MOCK_AGENTS };
