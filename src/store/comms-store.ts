/**
 * Communication Center store — tracks the active channel connection,
 * conversations, contacts, and which tab is active.
 *
 * All data is fetched from /api/comms/* which proxies the channel-agnostic
 * provider layer. The store never talks to Evolution API directly.
 */
import { create } from "zustand";
import type {
  ChannelConnection, ConversationSummary, ConversationDetail,
  Contact, DashboardStats, AgentAssignment,
} from "@/lib/comms/types";

export type CommsTab = "dashboard" | "inbox" | "contacts" | "agents";

interface CommsState {
  // Active channel — for now there's a single WhatsApp channel. The
  // architecture supports multiple channels; the UI just renders the
  // first connected one.
  channelId: string | null;
  connection: ChannelConnection | null;
  connecting: boolean;
  dashboard: DashboardStats | null;
  conversations: ConversationSummary[];
  activeConversation: ConversationDetail | null;
  contacts: Contact[];
  agents: AgentAssignment[];
  activeTab: CommsTab;
  loadingConvo: boolean;

  // Actions
  setChannelId: (id: string | null) => void;
  setConnection: (c: ChannelConnection | null) => void;
  setConnecting: (v: boolean) => void;
  setDashboard: (d: DashboardStats | null) => void;
  setConversations: (c: ConversationSummary[]) => void;
  setActiveConversation: (c: ConversationDetail | null) => void;
  setLoadingConvo: (v: boolean) => void;
  setContacts: (c: Contact[]) => void;
  setAgents: (a: AgentAssignment[]) => void;
  setActiveTab: (t: CommsTab) => void;

  // Compound helpers
  reset: () => void;
}

export const useCommsStore = create<CommsState>((set) => ({
  channelId: null,
  connection: null,
  connecting: false,
  dashboard: null,
  conversations: [],
  activeConversation: null,
  contacts: [],
  agents: [],
  activeTab: "dashboard",
  loadingConvo: false,

  setChannelId: (id) => set({ channelId: id }),
  setConnection: (c) => set({ connection: c }),
  setConnecting: (v) => set({ connecting: v }),
  setDashboard: (d) => set({ dashboard: d }),
  setConversations: (c) => set({ conversations: c }),
  setActiveConversation: (c) => set({ activeConversation: c }),
  setLoadingConvo: (v) => set({ loadingConvo: v }),
  setContacts: (c) => set({ contacts: c }),
  setAgents: (a) => set({ agents: a }),
  setActiveTab: (t) => set({ activeTab: t }),

  reset: () => set({
    channelId: null, connection: null, connecting: false,
    dashboard: null, conversations: [], activeConversation: null,
    contacts: [], agents: [], activeTab: "dashboard", loadingConvo: false,
  }),
}));
