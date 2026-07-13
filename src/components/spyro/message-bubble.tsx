"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  RefreshCw,
  RotateCw,
  User,
  AlertTriangle,
  Volume2,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SpyroLogo } from "./spyro-logo";
import { Markdown } from "./markdown";
import { TypingIndicator } from "./typing-indicator";
import type { Message } from "@/store/chat-store";

interface MessageBubbleProps {
  message: Message;
  isLast: boolean;
  isGenerating: boolean;
  onRegenerate: () => void;
}

export function MessageBubble({
  message,
  isLast,
  isGenerating,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const isUser = message.role === "user";
  const isImage = message.type === "image";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const speak = async () => {
    // If already playing, stop.
    if (playing && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      return;
    }
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: message.content }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audioRef.current = audio;
      audio.play();
      setPlaying(true);
    } catch {
      /* ignore */
    }
  };

  const showTyping =
    !isUser && message.streaming && message.content.length === 0 && !isImage;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex w-full gap-3 message-enter",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm",
          isUser
            ? "bg-muted text-muted-foreground"
            : "spyro-bg-gradient text-primary-foreground spyro-glow"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <SpyroLogo className="h-5 w-5 [&_svg]:h-full [&_svg]:w-full" />
        )}
      </div>

      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1 sm:max-w-[78%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div className="mb-0.5 flex items-center gap-2 px-1">
          <span className="text-xs font-medium text-muted-foreground">
            {isUser ? "You" : "SPYRO V1"}
          </span>
          {message.error && (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
              <AlertTriangle className="h-3 w-3" /> error
            </span>
          )}
        </div>

        <div
          className={cn(
            "relative rounded-2xl px-4 py-3 shadow-sm transition-colors",
            isUser
              ? "rounded-tr-md bg-primary text-primary-foreground"
              : message.error
                ? "rounded-tl-md border border-destructive/40 bg-destructive/10"
                : "rounded-tl-md border border-border bg-card"
          )}
        >
          {showTyping ? (
            <TypingIndicator />
          ) : isImage ? (
            <div className="break-words">
              {message.imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={message.imageUrl}
                    alt={message.content}
                    className="max-w-full rounded-lg"
                    style={{ maxHeight: 400 }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {message.content}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {message.content}
                </p>
              )}
              {message.streaming && (
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary spyro-glow" />
              )}
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="break-words">
              <Markdown>{message.content}</Markdown>
              {message.streaming && (
                <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary spyro-glow" />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {!message.streaming && message.content.length > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 px-1 transition-opacity",
              message.error
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100 focus-within:opacity-100 max-sm:opacity-100"
            )}
          >
            <button
              onClick={copy}
              className="touch-target inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Copy message"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy
                </>
              )}
            </button>
            {/* TTS — only for assistant text messages */}
            {!isUser && !isImage && (
              <button
                onClick={speak}
                className="touch-target inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={playing ? "Stop speaking" : "Speak message"}
              >
                {playing ? (
                  <>
                    <Square className="h-3 w-3" /> Stop
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3 w-3" /> Speak
                  </>
                )}
              </button>
            )}
            {!isUser && isLast && !isGenerating && (
              <button
                onClick={onRegenerate}
                className="touch-target inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Regenerate response"
              >
                {message.error ? (
                  <>
                    <RotateCw className="h-3 w-3" /> Retry
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
