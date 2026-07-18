import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";

// ── DB Sync Helper ────────────────────────────────────────────────────
// Debounced sync — saves conversations to the Neon DB via /api/db/conversations
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function syncToDB(conversations: any[]) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    // Only sync if user is authenticated (has a session cookie)
    try {
      // Sync each conversation (limit to 20 most recent to avoid overload)
      const recent = conversations.slice(0, 20);
      for (const conv of recent) {
        // Skip conversations with no messages
        if (!conv.messages || conv.messages.length === 0) continue;
        // Skip streaming messages
        const hasStreaming = conv.messages.some((m: any) => m.streaming);
        if (hasStreaming) continue;

        await fetch("/api/db/conversations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            conversation: {
              title: conv.title,
              pinned: conv.pinned || false,
              messages: conv.messages.map((m: any) => ({
                role: m.role,
                content: m.content || "",
                type: m.type || (m.imageUrl ? "image" : "text"),
                imageUrl: m.imageUrl || null,
              })),
            },
          }),
        }).catch(() => {}); // Silent fail — localStorage is the fallback
      }
    } catch {
      // Silent fail — localStorage persistence still works
    }
  }, 3000); // 3 second debounce
}

export type Role = "user" | "assistant";
export type MessageType = "text" | "image";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  /** "text" (default) or "image" (for generated images). */
  type?: MessageType;
  /** For image messages: a data URL or remote URL of the generated image. */
  imageUrl?: string;
  /** True while an assistant message is still being streamed in. */
  streaming?: boolean;
  /** Set when the request failed; used to show a retry affordance. */
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  isGenerating: boolean;
  // actions
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setActive: (id: string) => void;
  getActive: () => Conversation | null;
  addMessage: (conversationId: string, msg: Omit<Message, "id" | "createdAt">) => string;
  appendToMessage: (messageId: string, chunk: string) => void;
  setMessage: (messageId: string, patch: Partial<Message>) => void;
  clearMessages: (conversationId: string) => void;
  truncateAfter: (messageId: string) => void;
  setGenerating: (v: boolean) => void;
}

const newConversation = (): Conversation => ({
  id: uuid(),
  title: "New chat",
  messages: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeId: null,
      isGenerating: false,

      createConversation: () => {
        const convo = newConversation();
        set((s) => ({
          conversations: [convo, ...s.conversations],
          activeId: convo.id,
        }));
        return convo.id;
      },

      deleteConversation: (id) =>
        set((s) => {
          const conversations = s.conversations.filter((c) => c.id !== id);
          const activeId =
            s.activeId === id
              ? conversations[0]?.id ?? null
              : s.activeId;
          return { conversations, activeId };
        }),

      renameConversation: (id, title) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === id ? { ...c, title: title.trim() || "New chat", updatedAt: Date.now() } : c
          ),
        })),

      setActive: (id) => set({ activeId: id }),

      getActive: () => {
        const { conversations, activeId } = get();
        return conversations.find((c) => c.id === activeId) ?? null;
      },

      addMessage: (conversationId, msg) => {
        const id = uuid();
        const full: Message = { id, createdAt: Date.now(), ...msg };
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, full],
                  updatedAt: Date.now(),
                  // Auto-title from the first user message.
                  title:
                    c.title === "New chat" && msg.role === "user"
                      ? msg.content.slice(0, 42).trim() || "New chat"
                      : c.title,
                }
              : c
          ),
        }));
        return id;
      },

      appendToMessage: (messageId, chunk) =>
        set((s) => ({
          conversations: s.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId
                ? { ...m, content: m.content + chunk }
                : m
            ),
          })),
        })),

      setMessage: (messageId, patch) => {
        set((s) => ({
          conversations: s.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, ...patch } : m
            ),
          })),
        }));
        // Trigger DB sync when streaming finishes
        if (patch.streaming === false) {
          syncToDB(get().conversations);
        }
      },

      clearMessages: (conversationId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [], title: "New chat", updatedAt: Date.now() }
              : c
          ),
        })),

      truncateAfter: (messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) => {
            const idx = c.messages.findIndex((m) => m.id === messageId);
            if (idx === -1) return c;
            // Keep messages up to AND INCLUDING the target message.
            return { ...c, messages: c.messages.slice(0, idx + 1), updatedAt: Date.now() };
          }),
        })),

      setGenerating: (v) => set({ isGenerating: v }),
    }),
    {
      name: "spyro-v1-chat",
      // Don't persist streaming flags / generating state.
      partialize: (s) => ({
        conversations: s.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            streaming: false,
            error: m.error ? true : undefined,
          })),
        })),
        activeId: s.activeId,
      }),
    }
  )
);
