"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Square, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  /** Register a function that focuses the textarea (used by keyboard shortcuts). */
  registerFocus?: (fn: () => void) => void;
}

export function ChatInput({ onSend, onStop, registerFocus }: ChatInputProps) {
  const isGenerating = useChatStore((s) => s.isGenerating);
  const [value, setValue] = React.useState("");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Expose a focus function to the parent (for the "/" shortcut).
  React.useEffect(() => {
    if (registerFocus) {
      registerFocus(() => {
        const ta = taRef.current;
        if (ta) {
          ta.focus();
          ta.setSelectionRange(ta.value.length, ta.value.length);
        }
      });
    }
  }, [registerFocus]);

  // Auto-resize the textarea up to a max height.
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  const submit = () => {
    const text = value.trim();
    if (!text || isGenerating) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(() => {
      taRef.current?.focus();
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-3 pl-safe pr-safe sm:px-4 sm:pb-4">
      <div
        className={cn(
          "glass relative flex items-end gap-2 rounded-2xl border border-border p-2 shadow-lg transition-all",
          "focus-within:border-primary/60 focus-within:spyro-glow"
        )}
      >
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Message SPYRO V1…"
          className={cn(
            "max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5",
            "text-[16px] leading-relaxed text-foreground placeholder:text-muted-foreground",
            "focus:outline-none"
          )}
          aria-label="Message SPYRO V1"
          enterKeyHint="send"
        />

        <div className="flex items-center gap-1.5 pb-1 pr-1">
          <AnimatePresence mode="wait" initial={false}>
            {isGenerating ? (
              <motion.button
                key="stop"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={onStop}
                className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-foreground transition-colors hover:bg-muted/70"
                aria-label="Stop generating"
              >
                <Square className="h-4 w-4 fill-current" />
              </motion.button>
            ) : (
              <motion.button
                key="send"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={submit}
                disabled={!value.trim()}
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-xl spyro-bg-gradient text-primary-foreground transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  "enabled:hover:scale-105 enabled:spyro-glow-strong"
                )}
                aria-label="Send message"
              >
                <ArrowUp className="h-5 w-5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-primary/70" />
        <span className="hidden sm:inline">SPYRO V1 can make mistakes. Verify important info.</span>
        <span className="sm:hidden">SPYRO V1 can make mistakes.</span>
      </p>
    </div>
  );
}
