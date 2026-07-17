"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Rocket, X } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore } from "@/store/ui-store";
import { MessageBubble } from "./message-bubble";
import { WelcomeScreen } from "./welcome-screen";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  onPickSuggestion: (prompt: string) => void;
  onRegenerate: () => void;
  onEditMessage?: (messageId: string, newText: string) => void;
}

export function ChatMessages({
  onPickSuggestion,
  onRegenerate,
  onEditMessage,
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
  const setView = useUIStore((s) => s.setView);

  // ── Auto-migration: detect when this is a "deep project" that would
  // benefit from Studio. Show a banner suggesting to open Studio. ──
  const [showStudioBanner, setShowStudioBanner] = React.useState(false);
  const [studioTargetApp, setStudioTargetApp] = React.useState<string | null>(null);
  const [dismissedBanner, setDismissedBanner] = React.useState(false);

  React.useEffect(() => {
    if (dismissedBanner || messages.length < 3) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role !== "assistant") return;

    const content = lastMsg.content || "";
    const hasCodeBlock = content.includes("```") || content.includes("function ") || content.includes("const ") || content.includes("import ");
    const isLongResponse = content.length > 1500;
    const hasResearchTerms = /research|analysis|study|investigat|compar|evaluat|architect|literature|citation/i.test(content);
    const hasCodeTerms = /code|function|API|endpoint|database|deploy|debug|refactor|npm|python|javascript/i.test(content);
    const hasDataTerms = /spreadsheet|data|chart|graph|statistic|formula|calculate/i.test(content);
    const hasDocTerms = /document|report|proposal|letter|write|summarize/i.test(content);
    const conversationLength = messages.length;

    // Determine which Studio app to suggest
    if (hasCodeBlock || (conversationLength >= 4 && hasCodeTerms)) {
      setStudioTargetApp("code-editor");
      setShowStudioBanner(true);
    } else if (isLongResponse && hasResearchTerms) {
      setStudioTargetApp("research-browser");
      setShowStudioBanner(true);
    } else if (hasDataTerms && conversationLength >= 4) {
      setStudioTargetApp("spreadsheet");
      setShowStudioBanner(true);
    } else if (hasDocTerms && isLongResponse) {
      setStudioTargetApp("word");
      setShowStudioBanner(true);
    } else if (conversationLength >= 6) {
      setStudioTargetApp(null);
      setShowStudioBanner(true);
    }
  }, [messages, dismissedBanner]);

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
              onEdit={onEditMessage}
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

      {/* ── Studio auto-migration banner ── */}
      <AnimatePresence>
        {showStudioBanner && !dismissedBanner && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="absolute bottom-4 left-4 right-4 z-30"
          >
            <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-primary/20 bg-card/95 p-3 shadow-elevated backdrop-blur-xl">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl spyro-bg-gradient text-white">
                <Rocket className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  {studioTargetApp === "code-editor" ? "This looks like coding work" :
                   studioTargetApp === "research-browser" ? "This looks like research" :
                   studioTargetApp === "spreadsheet" ? "This looks like data analysis" :
                   studioTargetApp === "word" ? "This looks like document writing" :
                   "This looks like deep work"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {studioTargetApp === "code-editor" ? "Open the Code Editor in SPYRO Studio for a full IDE with terminal." :
                   studioTargetApp === "research-browser" ? "Open the Research Browser in SPYRO Studio for deeper analysis." :
                   studioTargetApp === "spreadsheet" ? "Open the AI Spreadsheet in SPYRO Studio for data work." :
                   studioTargetApp === "word" ? "Open AI Word in SPYRO Studio for document editing." :
                   "Open SPYRO Studio for a full workspace with code editor, terminal, and AI tools."}
                </p>
              </div>
              <button
                onClick={() => { setView("studio"); setDismissedBanner(true); }}
                className="shrink-0 rounded-lg spyro-bg-gradient px-3 py-1.5 text-[11px] font-medium text-white"
              >
                Open Studio
              </button>
              <button
                onClick={() => setDismissedBanner(true)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
