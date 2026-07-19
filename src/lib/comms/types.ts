/**
 * SPYRO Communication Center — Channel-agnostic types
 *
 * Every messaging provider (WhatsApp via Evolution API, Telegram, Slack,
 * Discord, Email, SMS, Instagram, Messenger, …) implements the same
 * `ChannelProvider` interface so the UI never has to know which engine
 * is powering a given channel.
 */

export type ChannelType =
  | "whatsapp"
  | "telegram"
  | "slack"
  | "discord"
  | "email"
  | "sms"
  | "instagram"
  | "messenger";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"   // QR shown, waiting for scan
  | "connected"
  | "error"
  | "reconnecting";

export interface ChannelConnection {
  channelId: string;
  type: ChannelType;
  status: ConnectionStatus;
  deviceName?: string;
  phoneNumber?: string;
  connectedAt?: number;
  lastSyncAt?: number;
  qrCode?: string;          // data URL while connecting
  errorMessage?: string;
  health: ConnectionHealth;
}

export interface ConnectionHealth {
  score: number;            // 0–100
  latencyMs?: number;
  uptimeHours?: number;
  lastError?: string;
  lastErrorAt?: number;
}

export interface ConversationSummary {
  id: string;
  channelId: string;
  channelType: ChannelType;
  contactId: string;
  contactName: string;
  contactAvatarColor: string;
  contactPhone?: string;
  unreadCount: number;
  pinned: boolean;
  labels: string[];
  tags: string[];
  lastMessagePreview: string;
  lastMessageAt: number;
  lastMessageDirection: "in" | "out";
  assignedAgentId?: string;
  aiHandled: boolean;
  humanTakenOver: boolean;
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  aiSummary?: string;
  suggestedReplies: string[];
}

export type MessageStatus =
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

export type MessageDirection = "in" | "out";

export interface Attachment {
  id: string;
  type:
    | "image" | "video" | "audio" | "voice"
    | "document" | "pdf" | "sticker"
    | "location" | "contact";
  filename: string;
  mimeType: string;
  url: string;
  sizeBytes?: number;
  thumbnailUrl?: string;
  // For location
  lat?: number;
  lng?: number;
  // For contact card
  contactName?: string;
  contactPhone?: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  status: MessageStatus;
  text?: string;
  attachments: Attachment[];
  createdAt: number;
  // Author metadata
  authorName?: string;
  authorIsAgent?: boolean;
  authorIsAI?: boolean;
  // Internal
  internalNote?: boolean;
  quotedMessageId?: string;
}

export interface Contact {
  id: string;
  channelId: string;
  name: string;
  phone?: string;
  email?: string;
  avatarColor: string;
  tags: string[];
  notes?: string;
  assignedAgentId?: string;
  lastInteractionAt?: number;
  sentiment: "positive" | "neutral" | "negative" | "unknown";
  conversationCount: number;
  customFields: Record<string, string>;
  purchaseHistory?: Array<{ item: string; amount: number; date: number }>;
}

export interface AgentAssignment {
  agentId: string;
  agentName: string;
  channels: ChannelType[];
  businessHours: { start: string; end: string; timezone: string; daysActive: number[] };
  responseStyle: "concise" | "balanced" | "detailed" | "friendly" | "formal";
  knowledgeSources: string[];
  escalationRules: {
    confidenceThreshold: number;      // 0–1
    autoEscalateOnNegative: boolean;
    escalateKeywords: string[];
    notifyOnHumanTakeover: boolean;
  };
  approvalMode: "auto" | "approval_required" | "approval_for_sensitive";
  autoReplyMode: "always" | "business_hours" | "off";
}

export interface DashboardStats {
  status: ConnectionStatus;
  deviceName?: string;
  phoneNumber?: string;         // connected WhatsApp number (when available)
  connectedAt?: number;         // when the channel connected (epoch ms)
  lastSyncAt?: number;
  messagesToday: number;
  activeConversations: number;
  aiResponseRate: number;       // 0–1
  humanTakeoverRate: number;    // 0–1
  connectedAgents: number;
  recentActivity: ActivityEntry[];
  health: ConnectionHealth;
}

export interface ActivityEntry {
  id: string;
  type:
    | "connection" | "disconnection" | "message"
    | "ai_reply" | "human_takeover" | "agent_assigned"
    | "contact_created" | "sync";
  description: string;
  timestamp: number;
  actor?: string;
}

export interface ConversationDetail {
  summary: ConversationSummary;
  messages: ConversationMessage[];
  contact: Contact;
  activity: ActivityEntry[];
  internalNotes: Array<{ id: string; text: string; author: string; createdAt: number }>;
}

/**
 * The contract every provider implements. The UI talks only to this
 * interface — never to Evolution API, Telegram Bot API, etc. directly.
 */
export interface ChannelProvider {
  type: ChannelType;
  displayName: string;
  /** Begin a connection. Returns a QR (or deep link) + channel id + expiry. */
  initiateConnection(channelId: string): Promise<{ qrCode: string; expiresAt: number; resolvedChannelId: string }>;
  /** Poll connection status. Returns connected once the user scans. */
  getConnectionStatus(channelId: string): Promise<ChannelConnection>;
  /** Tear down a connection. */
  disconnect(channelId: string): Promise<void>;
  /** Sync conversations + contacts from the provider. */
  sync(channelId: string): Promise<{ conversations: number; contacts: number }>;
  /** List conversations for a channel. */
  listConversations(channelId: string): Promise<ConversationSummary[]>;
  /** Get a full conversation thread with messages, contact, activity. */
  getConversation(channelId: string, conversationId: string): Promise<ConversationDetail>;
  /** List contacts. */
  listContacts(channelId: string): Promise<Contact[]>;
  /** Dashboard metrics. */
  getDashboard(channelId: string): Promise<DashboardStats>;
  /** Send a message out. */
  sendMessage(channelId: string, conversationId: string, text: string): Promise<ConversationMessage>;
}
