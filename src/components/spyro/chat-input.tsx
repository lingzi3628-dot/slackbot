"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Square, Sparkles, Mic, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  onImagine?: (prompt: string) => void;
  registerFocus?: (fn: () => void) => void;
}

export function ChatInput({ onSend, onStop, onImagine, registerFocus }: ChatInputProps) {
  const isGenerating = useChatStore((s) => s.isGenerating);
  const [value, setValue] = React.useState("");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Voice recording state
  const [recording, setRecording] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

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
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  // ── Voice recording ──────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ audio: base64 }),
        });
        const data = await res.json();
        if (data.text) {
          setValue((v) => (v ? v + " " : "") + data.text);
          requestAnimationFrame(() => taRef.current?.focus());
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      alert("Transcription failed.");
    } finally {
      setTranscribing(false);
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
          placeholder="Message SPYRO V1…  (or /imagine <prompt>)"
          className={cn(
            "max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5",
            "text-[16px] leading-relaxed text-foreground placeholder:text-muted-foreground",
            "focus:outline-none"
          )}
          aria-label="Message SPYRO V1"
          enterKeyHint="send"
        />

        <div className="flex items-center gap-1 pb-1 pr-1">
          {/* Image generation button */}
          {onImagine && (
            <button
              onClick={() => {
                const prompt = value.trim() || window.prompt("Describe the image to generate:");
                if (prompt) {
                  onImagine(prompt);
                  setValue("");
                }
              }}
              disabled={isGenerating}
              className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground disabled:opacity-40"
              aria-label="Generate image"
              title="Generate image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          )}

          {/* Mic button */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={transcribing || isGenerating}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl transition-colors disabled:opacity-40",
              recording
                ? "bg-destructive text-white animate-pulse"
                : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
            aria-label={recording ? "Stop recording" : "Start voice input"}
            title={recording ? "Stop recording" : "Voice input"}
          >
            {transcribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          {/* Send / Stop */}
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
