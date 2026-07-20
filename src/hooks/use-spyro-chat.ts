"use client";

import { useCallback, useRef, useState } from "react";
import { useChatStore, type Message } from "@/store/chat-store";
import type { SpyroModelId } from "@/lib/spyro-engine";
import { useUsageStore } from "@/store/usage-store";
import { getCsrfToken } from "@/lib/csrf-client";

interface SendOptions {
  conversationId?: string;
  webSearch?: boolean;
}

// ── Inline image-generation intent detection ─────────────────────────
// Lets users say things like "generate a photo of a sunset over Nairobi"
// or "draw a dragon in the cyberpunk style" directly in chat — no slash
// command needed. Returns the prompt to render, or null if the message
// is not an image-generation request.
const CODE_KEYWORDS =
  /\b(code|function|html|css|javascript|typescript|python|java|sql|api|component|class|method|algorithm|script|program|snippet|tutorial|explain|how (do|to)|what is|why|regex)\b/i;

// Matches "generate a photo of X", "create an image of X", "make a picture of X", etc.
const IMAGE_OF_PATTERN =
  /^(?:generate|create|draw|make|render|paint|design|illustrate|produce|sketch)\s+(?:a|an|me|some|the)?\s*(?:photo|image|picture|pic|drawing|painting|illustration|render|rendering|artwork|art|wallpaper|logo|portrait|landscape|scene)\s+(?:of|showing|depicting|with|that|where|about)?\s*(.+)/i;

// Matches "draw a cat", "paint a sunset" — pure-image-verb + subject, no object noun.
const DIRECT_VERB_PATTERN =
  /^(?:draw|paint|render|sketch)\s+(?:a|an|the)?\s*(.+)/i;

// ── Autonomous image marker detection ────────────────────────────────
// The LLM can emit [SPYRO_IMAGE: <prompt>] in its response to autonomously
// trigger image generation. We extract these markers, strip them from the
// displayed text, and render the images as follow-up messages.
const SPYRO_IMAGE_MARKER = /\[SPYRO_IMAGE:\s*([^\]]+)\]/gi;

export function extractImageMarkers(text: string): { cleanedText: string; prompts: string[] } {
  const prompts: string[] = [];
  let match: RegExpExecArray | null;
  // Reset lastIndex (regex is reused)
  SPYRO_IMAGE_MARKER.lastIndex = 0;
  while ((match = SPYRO_IMAGE_MARKER.exec(text)) !== null) {
    const p = match[1].trim();
    if (p.length > 2) prompts.push(p);
  }
  // Remove the markers from the displayed text. Also clean up any leftover
  // double spaces or empty lines left behind.
  const cleanedText = text
    .replace(SPYRO_IMAGE_MARKER, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { cleanedText, prompts };
}

export function detectImageIntent(text: string): string | null {
  const t = text.trim();
  if (!t) return null;

  // 1. Explicit /imagine slash command. Also strips a leading /imagine
  //    from the captured prompt (fixes "/imagine /imagine prompt" → "prompt").
  const cmdMatch = t.match(/^\/imagine\s+(.+)/i);
  if (cmdMatch) {
    let p = cmdMatch[1].trim();
    // Strip any additional leading /imagine (user might type it twice).
    p = p.replace(/^\/imagine\s+/i, "").trim();
    if (p.length > 2) return p;
    return null;
  }

  // 2. Only attempt on reasonably short, non-code messages.
  if (t.length > 320 || CODE_KEYWORDS.test(t)) return null;

  // 2a. "generate a photo of X" / "create an image of X"
  const ofMatch = t.match(IMAGE_OF_PATTERN);
  if (ofMatch && ofMatch[1] && ofMatch[1].trim().length > 2) {
    return ofMatch[1].trim();
  }

  // 2b. Bare "draw a cat" / "paint a sunset" — only when the message is short.
  if (t.split(/\s+/).length < 14) {
    const direct = t.match(DIRECT_VERB_PATTERN);
    if (direct && direct[1] && direct[1].trim().length > 2) {
      return direct[1].trim();
    }
  }

  return null;
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

      // Inline image generation: detect natural-language requests like
      // "generate a photo of a sunset" or "draw a dragon" (and the
      // explicit /imagine command). Routes to the image engine instead
      // of the chat API so the user gets a real, watermarked image.
      const imagePrompt = detectImageIntent(trimmed);
      if (imagePrompt) {
        await generateImage(imagePrompt, opts?.conversationId, trimmed);
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
        const csrfToken = await getCsrfToken();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrfToken,
          },
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

        // ── Check for autonomous image-generation markers ────────────
        // The LLM may emit [SPYRO_IMAGE: prompt] to trigger image gen.
        // Strip the marker from the displayed text, then generate the
        // image(s) as follow-up messages.
        const { cleanedText, prompts } = extractImageMarkers(acc);
        const finalText =
          acc.trim().length === 0
            ? "**SPYRO V1 returned an empty response.** Try rephrasing your prompt."
            : cleanedText || acc;

        store.getState().setMessage(assistantId, {
          streaming: false,
          error: acc.trim().length === 0 ? true : undefined,
          content: finalText,
        });
        // Track token usage (approximate: 1 token ≈ 4 chars)
        const tokensUsed = Math.ceil(acc.length / 4);
        useUsageStore.getState().incrementTokens(tokensUsed);

        // Auto-generate any images the LLM requested via markers.
        // Each prompt becomes a separate image message below the text.
        for (const p of prompts) {
          await generateImage(p, conversationId);
        }
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
    async (prompt: string, conversationId?: string, rawUserText?: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      let convoId = conversationId ?? store.getState().activeId;
      if (!convoId) {
        convoId = store.getState().createConversation();
      }

      // Show the user's original text (e.g. "generate a photo of a
      // dragon") so the conversation reads naturally. Falls back to
      // "/imagine <prompt>" only when invoked via the slash command.
      const displayText = rawUserText?.trim() || `/imagine ${trimmed}`;
      store.getState().addMessage(convoId, {
        role: "user",
        content: displayText,
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
        const csrfToken = await getCsrfToken();
        const res = await fetch("/api/image-gen", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrfToken,
          },
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
        } else if (data.rateLimited) {
          store.getState().setMessage(msgId, {
            content: `**You're generating images a little too fast.** ${
              data.error ?? "Please try again shortly."
            }`,
            streaming: false,
            error: true,
            type: "text",
          });
        } else {
          store.getState().setMessage(msgId, {
            content: `**Image generation failed.** ${
              data.error ?? "The SPYRO image engine is busy — try again in a moment."
            }`,
            streaming: false,
            error: true,
            type: "text",
          });
        }
      } catch (err) {
        store.getState().setMessage(msgId, {
          content: `**Image generation failed.** ${
            err instanceof Error ? err.message : "The SPYRO image engine is busy — try again in a moment."
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
        const csrfToken = await getCsrfToken();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-csrf-token": csrfToken,
          },
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
