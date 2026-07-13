"use client";

import { useCallback, useRef } from "react";
import { useChatStore, type Message } from "@/store/chat-store";

interface SendOptions {
  /** Force a different conversation id (used by "regenerate"). */
  conversationId?: string;
}

/**
 * Drives a SPYRO V1 conversation: sends the message history to /api/chat and
 * streams the assistant reply token-by-token into the store.
 */
export function useSpyroChat() {
  const abortRef = useRef<AbortController | null>(null);
  const store = useChatStore;

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    store.getState().setGenerating(false);
  }, [store]);

  const send = useCallback(
    async (text: string, opts?: SendOptions) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      let conversationId = opts?.conversationId ?? store.getState().activeId;
      if (!conversationId) {
        conversationId = store.getState().createConversation();
      }

      // 1. Persist the user message.
      store.getState().addMessage(conversationId, {
        role: "user",
        content: trimmed,
      });

      // 2. Create a placeholder assistant message that we will stream into.
      const assistantId = store.getState().addMessage(conversationId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      // 3. Build the message payload from the conversation (excluding the
      //    empty placeholder we just added).
      const convo = store
        .getState()
        .conversations.find((c) => c.id === conversationId);
      const history = convo
        ? convo.messages
            .filter((m) => !(m.id === assistantId))
            .map((m) => ({ role: m.role, content: m.content }))
        : [];

      store.getState().setGenerating(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let detail = `Request failed (${res.status})`;
          try {
            const data = await res.json();
            detail = data?.error ?? data?.detail ?? detail;
          } catch {
            /* ignore */
          }
          store.getState().setMessage(assistantId, {
            streaming: false,
            error: true,
            content: `**SPYRO V1 hit a snag.** ${detail}\n\nThe dragon engine may be busy — try again in a moment.`,
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          store.getState().appendToMessage(assistantId, acc.slice(0));
          // Re-place full accumulated content (avoids ordering issues):
          store.getState().setMessage(assistantId, {
            content: acc,
            streaming: true,
          });
        }
        store.getState().setMessage(assistantId, {
          streaming: false,
          error: acc.trim().length === 0 ? true : undefined,
          content:
            acc.trim().length === 0
              ? "**SPYRO V1 returned an empty response.** Try rephrasing your prompt."
              : acc,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          store.getState().setMessage(assistantId, {
            streaming: false,
            content:
              (store
                .getState()
                .conversations.find((c) => c.id === conversationId)
                ?.messages.find((m) => m.id === assistantId)?.content ?? "") +
              "\n\n_— stopped by user_",
          });
        } else {
          store.getState().setMessage(assistantId, {
            streaming: false,
            error: true,
            content: `**SPYRO V1 lost its fire.** ${
              err instanceof Error ? err.message : "Unknown error"
            }`,
          });
        }
      } finally {
        store.getState().setGenerating(false);
        abortRef.current = null;
      }
    },
    [store]
  );

  /** Regenerate the last assistant reply in the active conversation. */
  const regenerate = useCallback(async () => {
    const active = store.getState().getActive();
    if (!active) return;
    // Find the last assistant message and the user message before it.
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
    // Drop everything after (and including) the last user message so we can
    // resend it cleanly.
    const keep = msgs.slice(0, lastUserIndex);
    // Rewrite the conversation messages directly.
    useChatStore.setState((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === active.id ? { ...c, messages: keep } : c
      ),
    }));
    await send(userText, { conversationId: active.id });
  }, [send, store]);

  return { send, stop, regenerate };
}

export type SpyroChatApi = ReturnType<typeof useSpyroChat>;

export type { Message };
