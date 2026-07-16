"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mic,
  Volume2,
  Loader2,
  Sparkles,
  Square,
  Play,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function VoiceStudio({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready">("activating");
  const [mode, setMode] = React.useState<"stt" | "tts">("stt");

  // STT state
  const [recording, setRecording] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);

  // TTS state
  const [ttsText, setTtsText] = React.useState("");
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [ttsLoading, setTtsLoading] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ── STT ─────────────────────────────────────────────────────────────
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
      alert("Microphone access denied.");
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
          setTranscript(data.text);
        }
      };
      reader.readAsDataURL(blob);
    } catch {
      alert("Transcription failed.");
    } finally {
      setTranscribing(false);
    }
  };

  // ── TTS ─────────────────────────────────────────────────────────────
  const generateTts = async () => {
    const text = ttsText.trim();
    if (!text || ttsLoading) return;

    setTtsLoading(true);
    setAudioUrl(null);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch {
      alert("TTS failed.");
    } finally {
      setTtsLoading(false);
    }
  };

  // ── Activation ──────────────────────────────────────────────────────
  if (phase === "activating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-6"
        >
          <div className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Mic className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold">Voice Studio</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Calibrating audio engine…
            </motion.span>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-1 text-xs text-muted-foreground/60">
            Loading SPYRO V1 voice models
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Voice Studio</h2>
            <p className="text-[11px] text-muted-foreground">SPYRO V1 · Speech to Text · Text to Speech</p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border/40 bg-card/20 p-1">
        {[
          { id: "stt" as const, label: "Speech → Text", icon: Mic },
          { id: "tts" as const, label: "Text → Speech", icon: Volume2 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
              mode === tab.id ? "spyro-bg-gradient text-white" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* STT mode */}
      {mode === "stt" && (
        <div className="space-y-4">
          <div className="surface-elevated rounded-2xl p-6">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                className={cn(
                  "grid h-20 w-20 place-items-center rounded-full transition-all",
                  recording ? "bg-destructive text-white animate-pulse" : "spyro-bg-gradient text-white hover:scale-105",
                  "disabled:opacity-50"
                )}
                aria-label={recording ? "Stop recording" : "Start recording"}
              >
                {transcribing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : recording ? (
                  <Square className="h-8 w-8 fill-current" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                {transcribing ? "Transcribing…" : recording ? "Recording… Click to stop" : "Click to start recording"}
              </span>
            </div>
          </div>

          {transcript && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-elevated rounded-2xl p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Transcript</div>
              <p className="whitespace-pre-wrap text-sm">{transcript}</p>
              <button
                onClick={() => navigator.clipboard.writeText(transcript)}
                className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Sparkles className="h-3 w-3" /> Copy text
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* TTS mode */}
      {mode === "tts" && (
        <div className="space-y-4">
          <div className="surface-elevated rounded-2xl p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Text to speak</label>
            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Type or paste text here…"
              rows={4}
              disabled={ttsLoading}
              className="w-full resize-none rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-50"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{ttsText.length}/1000 chars</span>
              <button
                onClick={generateTts}
                disabled={!ttsText.trim() || ttsLoading}
                className="flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {ttsLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</> : <><Sparkles className="h-4 w-4" /> Speak</>}
              </button>
            </div>
          </div>

          {audioUrl && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-elevated rounded-2xl p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Audio</div>
              <audio ref={audioRef} src={audioUrl} controls className="w-full" />
              <a href={audioUrl} download="spyro-voice.wav" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                <Download className="h-3 w-3" /> Download audio
              </a>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
