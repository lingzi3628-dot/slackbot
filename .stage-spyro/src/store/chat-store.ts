import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuid } from "uuid";

export type Role = "user" | "assistant";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
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

      setMessage: (messageId, patch) =>
        set((s) => ({
          conversations: s.conversations.map((c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === messageId ? { ...m, ...patch } : m
            ),
          })),
        })),

      clearMessages: (conversationId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [], title: "New chat", updatedAt: Date.now() }
              : c
          ),
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
