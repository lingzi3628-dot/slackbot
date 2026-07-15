"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon,
  Code2,
  Zap,
  Globe,
  Mic,
  Volume2,
  Sparkles,
  Loader2,
  Download,
  Flame,
  ArrowLeft,
  Wand2,
  Settings2,
  Layers,
  Maximize2,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";
import { CodeLab } from "./code-lab-page";
import { GodModeTool } from "./god-mode-page";
import { VoiceStudio } from "./voice-studio-page";
import { WebScout } from "./web-scout-page";

// ── Greeting based on time ────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: "🌅" };
  if (hour < 17) return { text: "Good afternoon", icon: "☀️" };
  if (hour < 21) return { text: "Good evening", icon: "🌆" };
  return { text: "Good night", icon: "🌙" };
}

// ── Rate limiter (simulates Pollinations behavior) ────────────────────
function useRateLimiter() {
  const [useCount, setUseCount] = React.useState(0);

  // Load from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("spyro-img-count");
    if (stored) setUseCount(parseInt(stored, 10));
  }, []);

  const increment = React.useCallback(() => {
    const next = useCount + 1;
    setUseCount(next);
    localStorage.setItem("spyro-img-count", String(next));
  }, [useCount]);

  // First 3 uses: 10s. Then gradually increases to 30s.
  const waitTime = React.useMemo(() => {
    if (useCount < 3) return 10;
    if (useCount < 6) return 15;
    if (useCount < 10) return 20;
    if (useCount < 15) return 25;
    return 30;
  }, [useCount]);

  return { useCount, increment, waitTime };
}

// ── App definitions ───────────────────────────────────────────────────
interface SpyroApp {
  id: string;
  name: string;
  description: string;
  icon: typeof ImageIcon;
  gradient: string;
  status: "live" | "soon";
  badge?: string;
}

const APPS: SpyroApp[] = [
  {
    id: "image-gen",
    name: "Image Studio",
    description: "Generate stunning images from text",
    icon: ImageIcon,
    gradient: "from-orange-500 to-red-600",
    status: "live",
    badge: "New",
  },
  {
    id: "code-lab",
    name: "Code Lab",
    description: "Write, preview & iterate on code",
    icon: Code2,
    gradient: "from-amber-500 to-orange-600",
    status: "live",
  },
  {
    id: "god-mode",
    name: "God Mode",
    description: "Multi-agent collaboration engine",
    icon: Zap,
    gradient: "from-red-500 to-rose-700",
    status: "live",
    badge: "Pro",
  },
  {
    id: "voice-studio",
    name: "Voice Studio",
    description: "Speech to text & text to speech",
    icon: Mic,
    gradient: "from-yellow-500 to-amber-600",
    status: "live",
  },
  {
    id: "web-scout",
    name: "Web Scout",
    description: "Search & summarize the live web",
    icon: Globe,
    gradient: "from-orange-400 to-red-500",
    status: "live",
  },
  {
    id: "more",
    name: "More Tools",
    description: "New tools coming soon",
    icon: Sparkles,
    gradient: "from-amber-400 to-yellow-600",
    status: "soon",
  },
];

// ── Image Studio (full app) ───────────────────────────────────────────
function ImageStudio({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready" | "generating" | "result" | "error">("activating");
  const [prompt, setPrompt] = React.useState("");
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [history, setHistory] = React.useState<Array<{ prompt: string; url: string; time: number }>>([]);
  const [rateRemaining, setRateRemaining] = React.useState<number | null>(null);
  const { increment, waitTime, useCount } = useRateLimiter();

  // Activation sequence
  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 2500);
    return () => clearTimeout(timer);
  }, []);

  const generate = async () => {
    const p = prompt.trim();
    if (!p || phase === "generating") return;

    setPhase("generating");
    setError(null);
    setResultUrl(null);
    setProgress(0);

    // Simulate progress bar based on wait time
    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const pct = Math.min((elapsed / waitTime) * 100, 95);
      setProgress(pct);
    }, 200);

    try {
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();

      clearInterval(progressInterval);
      setProgress(100);

      if (data.image) {
        setResultUrl(data.image);
        setHistory((h) => [{ prompt: p, url: data.image, time: Date.now() }, ...h].slice(0, 8));
        increment();
        if (data.rateLimit) {
          setRateRemaining(data.rateLimit.remaining);
        }
        setTimeout(() => setPhase("result"), 300);
      } else if (data.rateLimited) {
        setError(data.error);
        setPhase("error");
      } else {
        setError(data.error || "Generation failed");
        setPhase("error");
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : "Network error");
      setPhase("error");
    }
  };

  // ── Activation screen ───────────────────────────────────────────────
  if (phase === "activating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-6"
        >
          <div className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <ImageIcon className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold">Image Studio</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Activating session…
            </motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-1 text-xs text-muted-foreground/60"
          >
            Preparing the SPYRO dragon engine
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ── Main image gen interface ────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to hub"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Image Studio</h2>
            <p className="text-[11px] text-muted-foreground">SPYRO V1 · Image Generation Engine</p>
          </div>
        </div>
      </div>

      {/* Generation area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: input + controls */}
        <div className="space-y-4">
          {/* Prompt input */}
          <div className="surface-elevated rounded-2xl p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A majestic dragon breathing fire over a medieval castle, dramatic lighting, highly detailed…"
              rows={4}
              disabled={phase === "generating"}
              className="w-full resize-none rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-50"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {rateRemaining !== null ? (
                  <span className={rateRemaining <= 2 ? "text-destructive" : ""}>
                    {rateRemaining <= 2 ? "⚠️" : "📸"} {rateRemaining} generations left this hour
                  </span>
                ) : useCount < 3 ? (
                  "⚡ Fast mode"
                ) : (
                  `⏱ ~${waitTime}s wait`
                )}
              </span>
              <button
                onClick={generate}
                disabled={!prompt.trim() || phase === "generating"}
                className="flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {phase === "generating" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress bar (during generation) */}
          <AnimatePresence>
            {phase === "generating" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="surface-elevated overflow-hidden rounded-2xl p-4"
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Breathing fire onto canvas…</span>
                  <span className="font-bold tabular-nums text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted/50">
                  <motion.div
                    className="h-full rounded-full spyro-bg-gradient"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground/60">
                  The dragon is painting your image. This takes ~{waitTime}s.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {phase === "error" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tips */}
          <div className="rounded-xl border border-border/30 bg-card/20 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Tips for better images
            </div>
            <ul className="space-y-1 text-[12px] text-muted-foreground">
              <li>• Be descriptive: lighting, mood, style, camera angle</li>
              <li>• Add art style: "oil painting", "photorealistic", "anime"</li>
              <li>• Specify quality: "highly detailed", "4K", "sharp focus"</li>
            </ul>
          </div>
        </div>

        {/* Right: result */}
        <div>
          <div className="surface-elevated flex min-h-[320px] items-center justify-center rounded-2xl p-4">
            {phase === "result" && resultUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <img
                  src={resultUrl}
                  alt={prompt}
                  className="w-full rounded-xl"
                  style={{ maxHeight: 400 }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="truncate text-xs text-muted-foreground">{prompt}</span>
                  <a
                    href={resultUrl}
                    download="spyro-image.jpg"
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" /> Save
                  </a>
                </div>
              </motion.div>
            ) : phase === "generating" ? (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="relative">
                  <div className="h-20 w-20 animate-pulse rounded-2xl spyro-bg-gradient opacity-50" />
                  <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-white" />
                </div>
                <span className="text-sm text-muted-foreground">Painting your image…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-border/50">
                  <ImageIcon className="h-7 w-7 opacity-40" />
                </div>
                <span className="text-sm">Your image will appear here</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Recent Generations
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {history.map((h, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-border/40">
                <img src={h.url} alt={h.prompt} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="line-clamp-2 text-[10px] text-white">{h.prompt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Hub (main dashboard) ──────────────────────────────────────────────
function Hub({ onOpenApp }: { onOpenApp: (id: string) => void }) {
  const conversations = useChatStore((s) => s.conversations);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const greeting = getGreeting();
  const hour = new Date().getHours();

  const allMessages = conversations.flatMap((c) => c.messages);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      {/* Welcome hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">{greeting.icon}</span>
          <span>{greeting.text}</span>
          <span className="relative flex h-1.5 w-1.5">
            {isGenerating && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            )}
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", isGenerating ? "bg-primary" : "bg-green-500")} />
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome to <span className="spyro-text-gradient">SPYRO</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {conversations.length > 0
            ? `You have ${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${allMessages.length} messages`
            : "Choose a tool below to get started"}
        </p>
      </motion.div>

      {/* Apps section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-3 flex items-center gap-2"
      >
        <Layers className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">SPYRO Apps & Tools</h2>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app, i) => (
          <motion.button
            key={app.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
            onClick={() => app.status === "live" && onOpenApp(app.id)}
            disabled={app.status === "soon"}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all",
              app.status === "live"
                ? "surface-elevated hover:spyro-glow cursor-pointer"
                : "border-border/30 opacity-60 cursor-not-allowed"
            )}
          >
            {/* Gradient glow on hover */}
            {app.status === "live" && (
              <div className={cn(
                "absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-0 blur-2xl transition-opacity group-hover:opacity-30",
                app.gradient
              )} />
            )}

            <div className="relative flex items-start justify-between">
              <div className={cn(
                "grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                app.gradient
              )}>
                <app.icon className="h-5 w-5" />
              </div>
              {app.badge && (
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {app.badge}
                </span>
              )}
              {app.status === "soon" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Soon
                </span>
              )}
            </div>

            <div className="relative mt-3">
              <h3 className="text-sm font-bold">{app.name}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">{app.description}</p>
            </div>

            {app.status === "live" && (
              <div className="relative mt-3 flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Open
                <ArrowLeft className="h-3 w-3 rotate-180" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Quick stats footer */}
      {conversations.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-1.5">
            <Flame className="h-3 w-3 text-primary" />
            {allMessages.length} total interactions
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            All tools operational
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── Main Dashboard export ─────────────────────────────────────────────
export function DashboardPage() {
  const [activeApp, setActiveApp] = React.useState<string | null>(null);

  return (
    <AnimatePresence mode="wait">
      {activeApp === "image-gen" ? (
        <motion.div
          key="image-studio"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="px-4 py-6 sm:py-8"
        >
          <ImageStudio onBack={() => setActiveApp(null)} />
        </motion.div>
      ) : activeApp === "code-lab" ? (
        <motion.div
          key="code-lab"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <CodeLab onBack={() => setActiveApp(null)} />
        </motion.div>
      ) : activeApp === "god-mode" ? (
        <motion.div
          key="god-mode"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <GodModeTool onBack={() => setActiveApp(null)} />
        </motion.div>
      ) : activeApp === "voice-studio" ? (
        <motion.div
          key="voice-studio"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <VoiceStudio onBack={() => setActiveApp(null)} />
        </motion.div>
      ) : activeApp === "web-scout" ? (
        <motion.div
          key="web-scout"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <WebScout onBack={() => setActiveApp(null)} />
        </motion.div>
      ) : (
        <motion.div
          key="hub"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.25 }}
        >
          <Hub onOpenApp={(id) => setActiveApp(id)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
