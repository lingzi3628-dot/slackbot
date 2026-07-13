"use client";

import { useCallback, useRef, useState } from "react";
import { useChatStore, type Message } from "@/store/chat-store";

interface SendOptions {
  conversationId?: string;
  webSearch?: boolean;
}

/**
 * Drives a SPYRO V1 conversation: sends the message history to /api/chat and
 * streams the assistant reply token-by-token into the store.
 *
 * Also supports:
 *  - web search mode (injects live web results into context)
 *  - image generation (via generateImage())
 */
export function useSpyroChat() {
  const abortRef = useRef<AbortController | null>(null);
  const store = useChatStore;
  const [webSearch, setWebSearch] = useState(false);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    store.getState().setGenerating(false);
  }, [store]);

  const send = useCallback(
    async (text: string, opts?: SendOptions) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Handle /imagine command → image generation
      const imagineMatch = trimmed.match(/^\/imagine\s+(.+)/i);
      if (imagineMatch) {
        await generateImage(imagineMatch[1], opts?.conversationId);
        return;
      }

      let conversationId = opts?.conversationId ?? store.getState().activeId;
      if (!conversationId) {
        conversationId = store.getState().createConversation();
      }

      store.getState().addMessage(conversationId, {
        role: "user",
        content: trimmed,
      });

      const assistantId = store.getState().addMessage(conversationId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      const convo = store
        .getState()
        .conversations.find((c) => c.id === conversationId);
      const history = convo
        ? convo.messages
            .filter((m) => !(m.id === assistantId))
            .map((m) => ({ role: m.role, content: m.content }))
        : [];

      const useWebSearch = opts?.webSearch ?? webSearch;

      store.getState().setGenerating(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history, webSearch: useWebSearch }),
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
    [store, webSearch]
  );

  /** Generate an image from a prompt and add it to the conversation. */
  const generateImage = useCallback(
    async (prompt: string, conversationId?: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      let convoId = conversationId ?? store.getState().activeId;
      if (!convoId) {
        convoId = store.getState().createConversation();
      }

      // Add the user's /imagine prompt as a user message.
      store.getState().addMessage(convoId, {
        role: "user",
        content: `/imagine ${trimmed}`,
      });

      // Add a placeholder assistant image message.
      const msgId = store.getState().addMessage(convoId, {
        role: "assistant",
        content: `Generating image: "${trimmed}"…`,
        type: "image",
        streaming: true,
      });

      store.getState().setGenerating(true);

      try {
        const res = await fetch("/api/image-gen", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: trimmed }),
        });
        const data = await res.json();
        if (data.image) {
          store.getState().setMessage(msgId, {
            content: `🎨 **${trimmed}**`,
            imageUrl: data.image,
            streaming: false,
          });
        } else {
          store.getState().setMessage(msgId, {
            content: `**Image generation failed.** ${data.error ?? "Unknown error"}`,
            streaming: false,
            error: true,
            type: "text",
          });
        }
      } catch (err) {
        store.getState().setMessage(msgId, {
          content: `**Image generation failed.** ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
          streaming: false,
          error: true,
          type: "text",
        });
      } finally {
        store.getState().setGenerating(false);
      }
    },
    [store]
  );

  const regenerate = useCallback(async () => {
    const active = store.getState().getActive();
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
    await send(userText, { conversationId: active.id });
  }, [send, store]);

  return { send, stop, regenerate, generateImage, webSearch, setWebSearch };
}

export type SpyroChatApi = ReturnType<typeof useSpyroChat>;

export type { Message };
