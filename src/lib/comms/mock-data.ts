/**
 * Realistic mock data for the SPYRO Communication Center.
 *
 * Used by the Evolution API provider when no real Evolution API instance
 * is configured. The shape is identical to what a real provider would
 * return, so swapping in a live instance requires zero UI changes.
 */
import type {
  ConversationSummary, ConversationDetail, ConversationMessage,
  Contact, DashboardStats, ActivityEntry, AgentAssignment,
} from "./types";

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B", "#EC4899", "#10B981", "#F97316", "#6366F1", "#14B8A6"];

// ── Contacts ──────────────────────────────────────────────────────────
export const MOCK_CONTACTS: Contact[] = [
  {
    id: "c1", channelId: "wa1", name: "Amara Okeke", phone: "+234 803 555 0142",
    avatarColor: COLORS[0], tags: ["VIP", "Repeat Buyer"], notes: "Prefers WhatsApp. Allergic to delay.",
    assignedAgentId: "a1", lastInteractionAt: NOW - 8 * MIN, sentiment: "positive",
    conversationCount: 23, customFields: { City: "Lagos", Language: "English", Plan: "Premium" },
    purchaseHistory: [
      { item: "SPYRO Pro — Annual", amount: 240, date: NOW - 30 * DAY },
      { item: "Image Pack — 500", amount: 19, date: NOW - 12 * DAY },
    ],
  },
  {
    id: "c2", channelId: "wa1", name: "Brian Mwangi", phone: "+254 712 884 220",
    avatarColor: COLORS[1], tags: ["Lead"], notes: "Asked about API pricing.",
    assignedAgentId: "a1", lastInteractionAt: NOW - 42 * MIN, sentiment: "neutral",
    conversationCount: 4, customFields: { City: "Nairobi", Source: "Twitter" },
  },
  {
    id: "c3", channelId: "wa1", name: "Fatima Hassan", phone: "+971 50 332 1190",
    avatarColor: COLORS[2], tags: ["Enterprise"], notes: "Needs invoice. CFO involved.",
    assignedAgentId: "a2", lastInteractionAt: NOW - 3 * HOUR, sentiment: "neutral",
    conversationCount: 11, customFields: { Company: "Dunes Logistics", Seats: "50" },
    purchaseHistory: [
      { item: "SPYRO Team — Monthly", amount: 99, date: NOW - 5 * DAY },
    ],
  },
  {
    id: "c4", channelId: "wa1", name: "Carlos Mendes", phone: "+55 11 9876 5432",
    avatarColor: COLORS[3], tags: ["Frustrated", "Needs Human"], notes: "Bug with image gen.",
    assignedAgentId: undefined, lastInteractionAt: NOW - 15 * MIN, sentiment: "negative",
    conversationCount: 8, customFields: { City: "São Paulo", Issue: "IMG-441" },
  },
  {
    id: "c5", channelId: "wa1", name: "Yuki Tanaka", phone: "+81 90 1234 5678",
    avatarColor: COLORS[4], tags: ["New"], notes: "Onboarding question.",
    assignedAgentId: "a1", lastInteractionAt: NOW - 1 * DAY, sentiment: "positive",
    conversationCount: 2, customFields: { City: "Tokyo", Language: "JP/EN" },
  },
  {
    id: "c6", channelId: "wa1", name: "Lerato Dlamini", phone: "+27 82 555 7788",
    avatarColor: COLORS[5], tags: ["VIP"], notes: "Loves the dark theme.",
    assignedAgentId: "a2", lastInteractionAt: NOW - 2 * DAY, sentiment: "positive",
    conversationCount: 17, customFields: { City: "Johannesburg", Plan: "Pro" },
    purchaseHistory: [
      { item: "SPYRO Pro — Annual", amount: 240, date: NOW - 60 * DAY },
    ],
  },
  {
    id: "c7", channelId: "wa1", name: "Mohammed Al-Farsi", phone: "+968 9123 4567",
    avatarColor: COLORS[6], tags: ["Lead"], notes: "Wants Arabic support.",
    assignedAgentId: undefined, lastInteractionAt: NOW - 4 * HOUR, sentiment: "neutral",
    conversationCount: 1, customFields: { City: "Muscat" },
  },
  {
    id: "c8", channelId: "wa1", name: "Grace Achieng", phone: "+254 722 110 044",
    avatarColor: COLORS[7], tags: ["Repeat Buyer"], notes: "Bought 3 image packs.",
    assignedAgentId: "a1", lastInteractionAt: NOW - 6 * HOUR, sentiment: "positive",
    conversationCount: 9, customFields: { City: "Mombasa" },
    purchaseHistory: [
      { item: "Image Pack — 200", amount: 9, date: NOW - 8 * DAY },
      { item: "Image Pack — 500", amount: 19, date: NOW - 22 * DAY },
    ],
  },
];

// ── Conversations (summaries) ─────────────────────────────────────────
export const MOCK_CONVERSATIONS: ConversationSummary[] = [
  {
    id: "v1", channelId: "wa1", channelType: "whatsapp",
    contactId: "c1", contactName: "Amara Okeke", contactAvatarColor: COLORS[0],
    contactPhone: "+234 803 555 0142", unreadCount: 2, pinned: true,
    labels: ["VIP"], tags: ["VIP", "Repeat Buyer"],
    lastMessagePreview: "Perfect, that works. Thank you!",
    lastMessageAt: NOW - 8 * MIN, lastMessageDirection: "in",
    assignedAgentId: "a1", aiHandled: true, humanTakenOver: false, sentiment: "positive",
    aiSummary: "Amara confirmed her plan upgrade and thanked the agent. No action needed.",
    suggestedReplies: ["You're welcome! Anything else?", "Glad to help 🙌", "Have a great day!"],
  },
  {
    id: "v2", channelId: "wa1", channelType: "whatsapp",
    contactId: "c4", contactName: "Carlos Mendes", contactAvatarColor: COLORS[3],
    contactPhone: "+55 11 9876 5432", unreadCount: 5, pinned: false,
    labels: ["Urgent"], tags: ["Frustrated", "Needs Human"],
    lastMessagePreview: "This is the third time the image fails. Please help.",
    lastMessageAt: NOW - 15 * MIN, lastMessageDirection: "in",
    assignedAgentId: undefined, aiHandled: false, humanTakenOver: true, sentiment: "negative",
    aiSummary: "Carlos is frustrated — image generation failing repeatedly. Confidence low. Recommend human takeover + engineering ticket IMG-441.",
    suggestedReplies: ["I'm so sorry about this — escalating to engineering now.", "Let me get a human teammate to fix this personally."],
  },
  {
    id: "v3", channelId: "wa1", channelType: "whatsapp",
    contactId: "c2", contactName: "Brian Mwangi", contactAvatarColor: COLORS[1],
    contactPhone: "+254 712 884 220", unreadCount: 1, pinned: false,
    labels: [], tags: ["Lead"],
    lastMessagePreview: "What's the pricing for 100K API calls?",
    lastMessageAt: NOW - 42 * MIN, lastMessageDirection: "in",
    assignedAgentId: "a1", aiHandled: true, humanTakenOver: false, sentiment: "neutral",
    aiSummary: "Lead asking about API volume pricing. Standard tier shared, awaiting decision.",
    suggestedReplies: ["For 100K calls we offer $0.002/call. Want a custom quote?", "I can set up a call with our team — when works?"],
  },
  {
    id: "v4", channelId: "wa1", channelType: "whatsapp",
    contactId: "c3", contactName: "Fatima Hassan", contactAvatarColor: COLORS[2],
    contactPhone: "+971 50 332 1190", unreadCount: 0, pinned: true,
    labels: ["Enterprise"], tags: ["Enterprise"],
    lastMessagePreview: "Invoice received. Finance will pay Monday.",
    lastMessageAt: NOW - 3 * HOUR, lastMessageDirection: "in",
    assignedAgentId: "a2", aiHandled: true, humanTakenOver: false, sentiment: "neutral",
    aiSummary: "Invoice acknowledged. Payment expected Monday. No follow-up needed until Tuesday.",
    suggestedReplies: ["Perfect, thank you Fatima.", "Noted — I'll check in Tuesday."],
  },
  {
    id: "v5", channelId: "wa1", channelType: "whatsapp",
    contactId: "c7", contactName: "Mohammed Al-Farsi", contactAvatarColor: COLORS[6],
    contactPhone: "+968 9123 4567", unreadCount: 1, pinned: false,
    labels: [], tags: ["Lead"],
    lastMessagePreview: "هل تدعمون اللغة العربية؟",
    lastMessageAt: NOW - 4 * HOUR, lastMessageDirection: "in",
    assignedAgentId: undefined, aiHandled: false, humanTakenOver: false, sentiment: "neutral",
    aiSummary: "New lead asking for Arabic language support. Currently English-only — needs human or localization roadmap answer.",
    suggestedReplies: ["Arabic is on our roadmap for Q2. Want early access?", "We can support you in English for now — shall I set up a call?"],
  },
  {
    id: "v6", channelId: "wa1", channelType: "whatsapp",
    contactId: "c8", contactName: "Grace Achieng", contactAvatarColor: COLORS[7],
    contactPhone: "+254 722 110 044", unreadCount: 0, pinned: false,
    labels: [], tags: ["Repeat Buyer"],
    lastMessagePreview: "Just bought another pack — love it 🔥",
    lastMessageAt: NOW - 6 * HOUR, lastMessageDirection: "in",
    assignedAgentId: "a1", aiHandled: true, humanTakenOver: false, sentiment: "positive",
    aiSummary: "Grace purchased an image pack and sent positive feedback. Good moment to ask for a review.",
    suggestedReplies: ["Thank you Grace! Would you mind leaving a review? 😊", "You're the best! Here's 10% off your next pack: SPYRO10"],
  },
  {
    id: "v7", channelId: "wa1", channelType: "whatsapp",
    contactId: "c5", contactName: "Yuki Tanaka", contactAvatarColor: COLORS[4],
    contactPhone: "+81 90 1234 5678", unreadCount: 0, pinned: false,
    labels: [], tags: ["New"],
    lastMessagePreview: "How do I export my conversations?",
    lastMessageAt: NOW - 1 * DAY, lastMessageDirection: "in",
    assignedAgentId: "a1", aiHandled: true, humanTakenOver: false, sentiment: "positive",
    aiSummary: "Onboarding question — answered with export steps. User thanked.",
    suggestedReplies: ["Glad it worked! Any other questions?", "Happy to help!"],
  },
  {
    id: "v8", channelId: "wa1", channelType: "whatsapp",
    contactId: "c6", contactName: "Lerato Dlamini", contactAvatarColor: COLORS[5],
    contactPhone: "+27 82 555 7788", unreadCount: 0, pinned: false,
    labels: ["VIP"], tags: ["VIP"],
    lastMessagePreview: "The dark theme is gorgeous. Thank you!",
    lastMessageAt: NOW - 2 * DAY, lastMessageDirection: "in",
    assignedAgentId: "a2", aiHandled: true, humanTakenOver: false, sentiment: "positive",
    aiSummary: "Lerato praised the dark theme. Good relationship moment.",
    suggestedReplies: ["Thank you! More themes coming soon ✨", "So glad you love it!"],
  },
] as ConversationSummary[];

// ── Messages per conversation ─────────────────────────────────────────
export const MOCK_MESSAGES: Record<string, ConversationMessage[]> = {
  v1: [
    { id: "m1", conversationId: "v1", direction: "in", status: "read", text: "Hi! I want to upgrade my plan.", attachments: [], createdAt: NOW - 22 * MIN, authorName: "Amara" },
    { id: "m2", conversationId: "v1", direction: "out", status: "read", text: "Hi Amara! I'd be happy to help. You're currently on Pro Annual — would you like to move to Team?", attachments: [], createdAt: NOW - 21 * MIN, authorIsAgent: true, authorIsAI: true },
    { id: "m3", conversationId: "v1", direction: "in", status: "read", text: "Yes, Team please.", attachments: [], createdAt: NOW - 20 * MIN, authorName: "Amara" },
    { id: "m4", conversationId: "v1", direction: "out", status: "read", text: "Done! Your Team plan is active. You now have 5 seats and shared knowledge.", attachments: [], createdAt: NOW - 18 * MIN, authorIsAgent: true, authorIsAI: true },
    { id: "m5", conversationId: "v1", direction: "in", status: "read", text: "Perfect, that works. Thank you!", attachments: [], createdAt: NOW - 8 * MIN, authorName: "Amara" },
  ],
  v2: [
    { id: "m1", conversationId: "v2", direction: "in", status: "read", text: "Image generation keeps failing.", attachments: [], createdAt: NOW - 35 * MIN, authorName: "Carlos" },
    { id: "m2", conversationId: "v2", direction: "out", status: "read", text: "Sorry to hear that. Can you share the prompt you used?", attachments: [], createdAt: NOW - 34 * MIN, authorIsAgent: true, authorIsAI: true },
    { id: "m3", conversationId: "v2", direction: "in", status: "read", text: "dragon flying over Nairobi at sunset", attachments: [{ id: "att1", type: "image", filename: "error.png", mimeType: "image/png", url: "", thumbnailUrl: "" }], createdAt: NOW - 30 * MIN, authorName: "Carlos" },
    { id: "m4", conversationId: "v2", direction: "out", status: "read", text: "Thanks. Let me check the logs.", attachments: [], createdAt: NOW - 28 * MIN, authorIsAgent: true, authorIsAI: true },
    { id: "m5", conversationId: "v2", direction: "in", status: "delivered", text: "This is the third time the image fails. Please help.", attachments: [], createdAt: NOW - 15 * MIN, authorName: "Carlos" },
  ],
  v3: [
    { id: "m1", conversationId: "v3", direction: "in", status: "read", text: "Hi, saw your API. What's the pricing for 100K calls?", attachments: [], createdAt: NOW - 50 * MIN, authorName: "Brian" },
    { id: "m2", conversationId: "v3", direction: "out", status: "read", text: "Hi Brian! For 100K calls we offer $0.002 per call = $200/month. Want me to set up a trial?", attachments: [], createdAt: NOW - 45 * MIN, authorIsAgent: true, authorIsAI: true },
    { id: "m3", conversationId: "v3", direction: "in", status: "delivered", text: "What's the pricing for 100K API calls?", attachments: [], createdAt: NOW - 42 * MIN, authorName: "Brian" },
  ],
  v4: [
    { id: "m1", conversationId: "v4", direction: "in", status: "read", text: "Hi, we need an invoice for the Team plan.", attachments: [], createdAt: NOW - 5 * HOUR, authorName: "Fatima" },
    { id: "m2", conversationId: "v4", direction: "out", status: "read", text: "Hi Fatima — invoice #INV-2024-1187 sent to finance@dunes.co. Due in 7 days.", attachments: [{ id: "att2", type: "pdf", filename: "INV-2024-1187.pdf", mimeType: "application/pdf", url: "" }], createdAt: NOW - 4 * HOUR, authorIsAgent: true, authorIsAI: true },
    { id: "m3", conversationId: "v4", direction: "in", status: "read", text: "Invoice received. Finance will pay Monday.", attachments: [], createdAt: NOW - 3 * HOUR, authorName: "Fatima" },
  ],
  v5: [
    { id: "m1", conversationId: "v5", direction: "in", status: "delivered", text: "هل تدعمون اللغة العربية؟", attachments: [], createdAt: NOW - 4 * HOUR, authorName: "Mohammed" },
  ],
  v6: [
    { id: "m1", conversationId: "v6", direction: "out", status: "read", text: "Hi Grace! Your image pack is ready 🎨", attachments: [], createdAt: NOW - 7 * HOUR, authorIsAgent: true, authorIsAI: true },
    { id: "m2", conversationId: "v6", direction: "in", status: "read", text: "Just bought another pack — love it 🔥", attachments: [], createdAt: NOW - 6 * HOUR, authorName: "Grace" },
  ],
  v7: [
    { id: "m1", conversationId: "v7", direction: "in", status: "read", text: "How do I export my conversations?", attachments: [], createdAt: NOW - 1 * DAY - 5 * MIN, authorName: "Yuki" },
    { id: "m2", conversationId: "v7", direction: "out", status: "read", text: "Hi Yuki! Click the menu in any chat → Export → Markdown or PDF.", attachments: [], createdAt: NOW - 1 * DAY - 3 * MIN, authorIsAgent: true, authorIsAI: true },
    { id: "m3", conversationId: "v7", direction: "in", status: "read", text: "Worked! Thank you.", attachments: [], createdAt: NOW - 1 * DAY, authorName: "Yuki" },
  ],
  v8: [
    { id: "m1", conversationId: "v8", direction: "in", status: "read", text: "The dark theme is gorgeous. Thank you!", attachments: [], createdAt: NOW - 2 * DAY, authorName: "Lerato" },
    { id: "m2", conversationId: "v8", direction: "out", status: "read", text: "Thank you Lerato! More themes coming soon ✨", attachments: [], createdAt: NOW - 2 * DAY + 2 * MIN, authorIsAgent: true, authorIsAI: true },
  ],
};

// ── Agents ────────────────────────────────────────────────────────────
export const MOCK_AGENTS: AgentAssignment[] = [
  {
    agentId: "a1", agentName: "Sales Assistant", channels: ["whatsapp", "telegram"],
    businessHours: { start: "08:00", end: "20:00", timezone: "Africa/Nairobi", daysActive: [1, 2, 3, 4, 5] },
    responseStyle: "friendly", knowledgeSources: ["Pricing", "Product FAQ", "Onboarding"],
    escalationRules: { confidenceThreshold: 0.75, autoEscalateOnNegative: true, escalateKeywords: ["refund", "lawsuit", "angry"], notifyOnHumanTakeover: true },
    approvalMode: "auto", autoReplyMode: "business_hours",
  },
  {
    agentId: "a2", agentName: "Support Specialist", channels: ["whatsapp", "email"],
    businessHours: { start: "00:00", end: "23:59", timezone: "UTC", daysActive: [0, 1, 2, 3, 4, 5, 6] },
    responseStyle: "balanced", knowledgeSources: ["Support KB", "Bug Tracker", "Billing"],
    escalationRules: { confidenceThreshold: 0.8, autoEscalateOnNegative: true, escalateKeywords: ["bug", "broken", "fail"], notifyOnHumanTakeover: true },
    approvalMode: "approval_for_sensitive", autoReplyMode: "always",
  },
];

// ── Dashboard ─────────────────────────────────────────────────────────
export const MOCK_DASHBOARD: DashboardStats = {
  status: "connected",
  deviceName: "Lewis's iPhone 15 Pro",
  lastSyncAt: NOW - 2 * MIN,
  messagesToday: 142,
  activeConversations: 8,
  aiResponseRate: 0.87,
  humanTakeoverRate: 0.13,
  connectedAgents: 2,
  health: { score: 96, latencyMs: 240, uptimeHours: 72, lastError: undefined },
  recentActivity: [
    { id: "a1", type: "ai_reply", description: "Sales Assistant replied to Brian Mwangi", timestamp: NOW - 12 * MIN, actor: "Sales Assistant" },
    { id: "a2", type: "human_takeover", description: "Carlos Mendes escalated to human (negative sentiment)", timestamp: NOW - 28 * MIN },
    { id: "a3", type: "sync", description: "Synced 8 conversations + 8 contacts", timestamp: NOW - 2 * MIN },
    { id: "a4", type: "connection", description: "WhatsApp connected · Lewis's iPhone 15 Pro", timestamp: NOW - 3 * HOUR },
    { id: "a5", type: "agent_assigned", description: "Support Specialist assigned to WhatsApp", timestamp: NOW - 3 * HOUR + 5 * MIN, actor: "Lewis" },
    { id: "a6", type: "contact_created", description: "Mohammed Al-Farsi added as contact", timestamp: NOW - 4 * HOUR },
  ],
};
