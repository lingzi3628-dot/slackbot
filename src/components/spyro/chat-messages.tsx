"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { MessageBubble } from "./message-bubble";
import { WelcomeScreen } from "./welcome-screen";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  onPickSuggestion: (prompt: string) => void;
  onRegenerate: () => void;
}

export function ChatMessages({
  onPickSuggestion,
  onRegenerate,
}: ChatMessagesProps) {
  const active = useChatStore((s) =>
    s.conversations.find((c) => c.id === s.activeId) ?? null
  );
  const isGenerating = useChatStore((s) => s.isGenerating);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = React.useState(false);
  const stickToBottom = React.useRef(true);

  const messages = active?.messages ?? [];

  // Track whether the user is pinned to the bottom.
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = distance < 120;
    setShowJump(distance > 240);
  };

  // Auto-scroll on new content if pinned to bottom.
  React.useEffect(() => {
    if (stickToBottom.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  React.useEffect(() => {
    // Reset stickiness when switching conversations.
    stickToBottom.current = true;
  }, [active?.id]);

  if (!active || messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto">
        <WelcomeScreen onPick={onPickSuggestion} />
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl space-y-6 px-3 py-6 sm:px-4">
          {messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              isLast={i === messages.length - 1}
              isGenerating={isGenerating}
              onRegenerate={onRegenerate}
            />
          ))}
          <div ref={bottomRef} className="h-1" />
        </div>
      </div>

      {showJump && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => {
            stickToBottom.current = true;
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          }}
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2",
            "grid h-9 w-9 place-items-center rounded-full border border-border",
            "bg-card/90 text-foreground shadow-lg backdrop-blur transition-colors hover:bg-card"
          )}
          aria-label="Jump to latest message"
        >
          <ArrowDown className="h-4 w-4" />
        </motion.button>
      )}
    </div>
  );
}
