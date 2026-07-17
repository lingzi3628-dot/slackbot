"use client";

import { useCallback, useRef, useState } from "react";
import { useChatStore, type Message } from "@/store/chat-store";
import type { SpyroModelId } from "@/lib/spyro-engine";
import { useUsageStore } from "@/store/usage-store";

interface SendOptions {
  conversationId?: string;
  webSearch?: boolean;
}

/** Build a Markdown progress display from God Mode steps. */
function buildGodModeProgress(
  steps: Array<{ agent: string; icon: string; status: string; output?: string }>
): string {
  const lines: string[] = ["## ⚡ God Mode — Multi-Agent Collaboration", ""];

  for (const step of steps) {
    const statusIcon =
      step.status === "done" ? "✅" : step.status === "error" ? "❌" : "⏳";
    lines.push(`${statusIcon} **${step.icon} ${step.agent}** — ${step.status === "thinking" ? "working…" : step.status}`);

    if (step.output && step.status === "done") {
      // Show a collapsed summary of each agent's output.
      const summary = step.output.slice(0, 200);
      const truncated = step.output.length > 200 ? "…" : "";
      lines.push("");
      lines.push(`<details><summary>View output</summary>`);
      lines.push("");
      lines.push(summary + truncated);
      lines.push("");
      lines.push("</details>");
      lines.push("");
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("*Synthesizing final answer…*");

  return lines.join("\n");
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
  const [model, setModel] = useState<SpyroModelId>("openai");
  const [godMode, setGodMode] = useState(false);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    store.getState().setGenerating(false);
  }, [store]);

  const send = useCallback(
    async (text: string, opts?: SendOptions) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // God Mode → multi-agent pipeline
      if (godMode) {
        await sendGodMode(trimmed, opts?.conversationId);
        return;
      }

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
          body: JSON.stringify({ messages: history, webSearch: useWebSearch, model }),
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
        // Track token usage (approximate: 1 token ≈ 4 chars)
        const tokensUsed = Math.ceil(acc.length / 4);
        useUsageStore.getState().incrementTokens(tokensUsed);
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
          useUsageStore.getState().incrementImages();
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

  /** Edit a user message: update its content, truncate everything after it, resend. */
  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      const trimmed = newText.trim();
      if (!trimmed) return;
      const active = store.getState().getActive();
      if (!active) return;

      const msg = active.messages.find((m) => m.id === messageId);
      if (!msg || msg.role !== "user") return;

      // Update the message content + truncate everything after it.
      store.getState().setMessage(messageId, { content: trimmed });
      store.getState().truncateAfter(messageId);

      // Now resend — but send() will add a NEW user message, so we need to
      // remove the edited one from history first, then send.
      // Actually: truncateAfter keeps the edited message. So we build history
      // from the conversation (which now ends with the edited user message),
      // and call the engine directly without adding a new user message.
      const convo = store.getState().conversations.find((c) => c.id === active.id);
      if (!convo) return;
      const history = convo.messages.map((m) => ({ role: m.role, content: m.content }));

      // Add a placeholder assistant message to stream into.
      const assistantId = store.getState().addMessage(active.id, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      store.getState().setGenerating(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history, webSearch, model }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          store.getState().setMessage(assistantId, {
            streaming: false,
            error: true,
            content: `**SPYRO V1 hit a snag.** Request failed (${res.status}).`,
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
          content: acc.trim().length === 0
            ? "**SPYRO V1 returned an empty response.** Try rephrasing."
            : acc,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          store.getState().setMessage(assistantId, { streaming: false });
        } else {
          store.getState().setMessage(assistantId, {
            streaming: false,
            error: true,
            content: `**SPYRO V1 lost its fire.** ${err instanceof Error ? err.message : "Unknown error"}`,
          });
        }
      } finally {
        store.getState().setGenerating(false);
        abortRef.current = null;
      }
    },
    [store, webSearch, model]
  );

  /** Run God Mode — multi-agent pipeline with live progress updates. */
  const sendGodMode = useCallback(
    async (text: string, conversationId?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      let convoId = conversationId ?? store.getState().activeId;
      if (!convoId) {
        convoId = store.getState().createConversation();
      }

      // Add the user message.
      store.getState().addMessage(convoId, {
        role: "user",
        content: trimmed,
      });

      // Add a placeholder assistant message — we'll update it with progress.
      const assistantId = store.getState().addMessage(convoId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      store.getState().setGenerating(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Build conversation history (exclude the empty placeholder).
        const convo = store.getState().conversations.find((c) => c.id === convoId);
        const history = convo
          ? convo.messages
              .filter((m) => m.id !== assistantId)
              .map((m) => ({ role: m.role, content: m.content }))
          : [];

        const res = await fetch("/api/god-mode", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          store.getState().setMessage(assistantId, {
            streaming: false,
            error: true,
            content: `**God Mode failed.** Request error (${res.status}).`,
          });
          return;
        }

        // Parse NDJSON stream.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const steps: Array<{ agent: string; icon: string; status: string; output?: string }> = [];
        let finalAnswer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === "step") {
                const step = data.step;
                const existing = steps.findIndex((s) => s.agent === step.agent);
                if (existing >= 0) {
                  steps[existing] = step;
                } else {
                  steps.push(step);
                }

                // Update the message with a progress display.
                const progressMd = buildGodModeProgress(steps);
                store.getState().setMessage(assistantId, {
                  content: progressMd,
                  streaming: true,
                });
              } else if (data.type === "done") {
                // Use the last step's output as the final answer.
                const lastStep = steps[steps.length - 1];
                finalAnswer = lastStep?.output || "God Mode completed but produced no output.";
              } else if (data.type === "error") {
                finalAnswer = `**God Mode error.** ${data.error}`;
              }
            } catch {
              /* ignore parse errors */
            }
          }
        }

        // Set the final answer.
        store.getState().setMessage(assistantId, {
          streaming: false,
          content: finalAnswer || buildGodModeProgress(steps),
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          store.getState().setMessage(assistantId, { streaming: false });
        } else {
          store.getState().setMessage(assistantId, {
            streaming: false,
            error: true,
            content: `**God Mode failed.** ${err instanceof Error ? err.message : "Unknown error"}`,
          });
        }
      } finally {
        store.getState().setGenerating(false);
        abortRef.current = null;
      }
    },
    [store]
  );

  return { send, stop, regenerate, generateImage, editMessage, sendGodMode, webSearch, setWebSearch, model, setModel, godMode, setGodMode };
}

export type SpyroChatApi = ReturnType<typeof useSpyroChat>;

export type { Message };
