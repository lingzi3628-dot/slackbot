"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Square, Sparkles, Mic, Loader2, Search, Trash2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat-store";
import { SlashMenu, type SlashCommand } from "./slash-menu";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  onSlashCommand?: (cmd: string) => void;
  registerFocus?: (fn: () => void) => void;
}

export function ChatInput({ onSend, onStop, onSlashCommand, registerFocus }: ChatInputProps) {
  const isGenerating = useChatStore((s) => s.isGenerating);
  const [value, setValue] = React.useState("");
  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const [slashOpen, setSlashOpen] = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  React.useEffect(() => {
    if (registerFocus) {
      registerFocus(() => {
        const ta = taRef.current;
        if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribe(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch { /* ignore */ }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) { mediaRecorderRef.current.stop(); setRecording(false); }
  };

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch("/api/transcribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ audio: base64 }) });
        const data = await res.json();
        if (data.text) { setValue((v) => (v ? v + " " : "") + data.text); requestAnimationFrame(() => taRef.current?.focus()); }
      };
      reader.readAsDataURL(blob);
    } catch { /* ignore */ }
    finally { setTranscribing(false); }
  };

  const slashCommands: SlashCommand[] = React.useMemo(() => {
    const cmds: SlashCommand[] = [
      { command: "/search", label: "Web search", description: "Search the web for current information", icon: Search, action: () => { const q = value.replace(/^\/search\s*/, "").trim(); if (q) onSend(q); setValue(""); setSlashOpen(false); } },
      { command: "/clear", label: "Clear chat", description: "Delete all messages in this conversation", icon: Trash2, action: () => { if (onSlashCommand) onSlashCommand("/clear"); setValue(""); setSlashOpen(false); } },
      { command: "/help", label: "Help", description: "Show available commands and features", icon: HelpCircle, action: () => { if (onSlashCommand) onSlashCommand("/help"); setValue(""); setSlashOpen(false); } },
    ];
    const typed = value.toLowerCase();
    return cmds.filter((c) => c.command.startsWith(typed) || typed === "/");
  }, [value, onSend, onSlashCommand]);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-4 pl-safe pr-safe sm:px-4">
      <div className="relative">
        <SlashMenu open={slashOpen && slashCommands.length > 0} commands={slashCommands} onSelect={(cmd) => cmd.action()} onClose={() => setSlashOpen(false)} />
        <div
          className={cn(
            "glass relative flex items-end gap-2 rounded-[24px] p-2 transition-all",
            "focus-within:border-primary/20 focus-within:spyro-glow"
          )}
        >
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => { setValue(e.target.value); setSlashOpen(e.target.value.startsWith("/")); }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Ask SPYRO anything…"
            className={cn(
              "max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-4 py-3",
              "text-[16px] leading-relaxed text-foreground placeholder:text-muted-foreground/50",
              "focus:outline-none"
            )}
            aria-label="Message SPYRO V1"
            enterKeyHint="send"
          />
          <div className="flex items-center gap-1 pb-1 pr-1">
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing || isGenerating}
              className={cn("grid h-10 w-10 place-items-center rounded-[14px] transition-all disabled:opacity-40", recording ? "bg-destructive text-white animate-pulse" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}
              aria-label={recording ? "Stop recording" : "Voice input"}
            >
              {transcribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
            </button>
            <AnimatePresence mode="wait" initial={false}>
              {isGenerating ? (
                <motion.button key="stop" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} onClick={onStop} className="grid h-10 w-10 place-items-center rounded-[14px] bg-secondary text-foreground transition-colors hover:bg-secondary/70">
                  <Square className="h-4 w-4 fill-current" />
                </motion.button>
              ) : (
                <motion.button key="send" initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} onClick={submit} disabled={!value.trim()} className={cn("grid h-10 w-10 place-items-center rounded-[14px] spyro-bg-gradient text-white transition-all", "disabled:cursor-not-allowed disabled:opacity-30", "enabled:hover:scale-105 enabled:spyro-glow-strong")}>
                  <ArrowUp className="h-5 w-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/40">
        <Sparkles className="h-3 w-3" />
        SPYRO V1 can make mistakes. Verify important info.
      </p>
    </div>
  );
}
