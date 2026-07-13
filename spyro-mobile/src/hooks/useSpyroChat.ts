/**
 * Drives a SPYRO V1 conversation: sends message history to the backend and
 * streams the assistant reply token-by-token into the store.
 * Direct port of the web app's src/hooks/use-spyro-chat.ts.
 */
import { useCallback, useRef } from "react";
import { useChatStore } from "@/store/chat-store";
import { streamChat } from "@/lib/api";
import { useHaptics } from "./useHaptics";

export function useSpyroChat() {
  const abortRef = useRef<AbortController | null>(null);
  const haptics = useHaptics();

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    useChatStore.getState().setGenerating(false);
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const store = useChatStore.getState();
      let conversationId = store.activeId;
      if (!conversationId) {
        conversationId = store.createConversation();
      }

      // 1. Persist the user message.
      store.addMessage(conversationId, { role: "user", content: trimmed });
      haptics.impact();

      // 2. Create a placeholder assistant message to stream into.
      const assistantId = store.addMessage(conversationId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      // 3. Build the payload (exclude the empty placeholder).
      const convo = useChatStore
        .getState()
        .conversations.find((c) => c.id === conversationId);
      const history = convo
        ? convo.messages
            .filter((m) => m.id !== assistantId)
            .map((m) => ({ role: m.role, content: m.content }))
        : [];

      useChatStore.getState().setGenerating(true);
      const controller = new AbortController();
      abortRef.current = controller;

      let acc = "";
      await streamChat(
        history,
        {
          onToken: (chunk) => {
            acc += chunk;
            useChatStore.getState().setMessage(assistantId, {
              content: acc,
              streaming: true,
            });
          },
          onDone: () => {
            useChatStore.getState().setMessage(assistantId, {
              streaming: false,
              error: acc.trim().length === 0 ? true : undefined,
              content:
                acc.trim().length === 0
                  ? "**SPYRO V1 returned an empty response.** Try rephrasing your prompt."
                  : acc,
            });
            useChatStore.getState().setGenerating(false);
            haptics.notify();
            abortRef.current = null;
          },
          onError: (err) => {
            useChatStore.getState().setMessage(assistantId, {
              streaming: false,
              error: true,
              content: `**SPYRO V1 lost its fire.** ${err.message}`,
            });
            useChatStore.getState().setGenerating(false);
            abortRef.current = null;
          },
        },
        controller.signal
      );
    },
    [haptics]
  );

  const regenerate = useCallback(async () => {
    const active = useChatStore.getState().getActive();
    if (!active) return;
    const msgs = active.messages;
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;
    const userText = msgs[lastUserIndex].content;
    const keep = msgs.slice(0, lastUserIndex);
    useChatStore.setState((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === active.id ? { ...c, messages: keep } : c
      ),
    }));
    await send(userText);
  }, [send]);

  return { send, stop, regenerate };
}
