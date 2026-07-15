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
  Database,
  Sparkles,
  Loader2,
  Download,
  Flame,
  Activity,
  Clock,
  MessageCircle,
  TrendingUp,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useChatStore } from "@/store/chat-store";
import { useIntegrationsStore } from "@/store/integrations-store";
import { cn } from "@/lib/utils";

const EMBER_GRADIENT_ID = "emberGradDash";

// ── Image Generation Tool (inline in dashboard) ───────────────────────
function ImageGenTool() {
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<
    Array<{ prompt: string; url: string; time: number }>
  >([]);

  const generate = async () => {
    const p = prompt.trim();
    if (!p || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/image-gen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: p }),
      });
      const data = await res.json();
      if (data.image) {
        setResult(data.image);
        setHistory((h) => [{ prompt: p, url: data.image, time: Date.now() }, ...h].slice(0, 12));
      } else {
        setError(data.error || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="surface-elevated rounded-2xl p-5"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-lg spyro-bg-gradient text-primary-foreground">
          <ImageIcon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">Image Generation</h2>
          <p className="text-[11px] text-muted-foreground">SPYRO V1 Tool · Text → Image</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
          placeholder="Describe an image…"
          disabled={loading}
          className="flex-1 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={generate}
          disabled={loading || !prompt.trim()}
          className="flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Generating image…</span>
            </div>
          </motion.div>
        )}
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4"
          >
            <img
              src={result}
              alt={prompt}
              className="w-full rounded-xl border border-border/40"
              style={{ maxHeight: 400 }}
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="truncate text-xs text-muted-foreground">{prompt}</span>
              <a
                href={result}
                download="spyro-image.jpg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Download className="h-3 w-3" /> Download
              </a>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Recent Generations
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {history.map((h, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border/40">
                <img src={h.url} alt={h.prompt} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="line-clamp-2 text-[10px] text-white">{h.prompt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Stat card with count-up ───────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function StatCard({
  label,
  value,
  icon: Icon,
  delay = 0,
  suffix = "",
}: {
  label: string;
  value: number;
  icon: typeof Flame;
  delay?: number;
  suffix?: string;
}) {
  const animated = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="surface-elevated group relative overflow-hidden rounded-xl p-4"
    >
      <div className="absolute -right-4 -top-4 opacity-5 transition-opacity group-hover:opacity-10">
        <Icon className="h-16 w-16" />
      </div>
      <div className="relative">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        </div>
        <div className="mt-2 text-2xl font-bold tabular-nums">
          {animated.toLocaleString()}{suffix}
        </div>
      </div>
    </motion.div>
  );
}

// ── Tools grid ────────────────────────────────────────────────────────
const TOOLS = [
  { name: "Image Generation", icon: ImageIcon, desc: "Text → Image", status: "active", toolId: "image-gen" },
  { name: "Code Generator", icon: Code2, desc: "Write + preview code", status: "active" },
  { name: "God Mode", icon: Zap, desc: "Multi-agent collaboration", status: "active" },
  { name: "Web Search", icon: Globe, desc: "Real-time information", status: "active" },
  { name: "Voice Input", icon: Mic, desc: "Speech → Text", status: "active" },
  { name: "Text to Speech", icon: Volume2, desc: "Text → Audio", status: "active" },
  { name: "Calculator", icon: Database, desc: "Math expressions", status: "active" },
  { name: "More Coming", icon: Sparkles, desc: "Stay tuned", status: "soon" },
];

// ── Main Dashboard ────────────────────────────────────────────────────
export function DashboardPage() {
  const conversations = useChatStore((s) => s.conversations);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const integrations = useIntegrationsStore((s) => s.integrations);

  const allMessages = conversations.flatMap((c) => c.messages);
  const userMessages = allMessages.filter((m) => m.role === "user");
  const assistantMessages = allMessages.filter((m) => m.role === "assistant");
  const imageMessages = allMessages.filter((m) => m.type === "image");
  const errorMessages = allMessages.filter((m) => m.error);

  const totalWords = allMessages.reduce(
    (sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length,
    0
  );

  const oldestConv = conversations.length > 0
    ? Math.min(...conversations.map((c) => c.createdAt))
    : null;
  const daysActive = oldestConv
    ? Math.max(1, Math.ceil((Date.now() - oldestConv) / (1000 * 60 * 60 * 24)))
    : 0;

  const connectedIntegrations = integrations.filter((i) => i.connected).length;
  const errorRate = allMessages.length > 0
    ? (errorMessages.length / allMessages.length) * 100
    : 0;

  // 7-day activity
  const activityData = React.useMemo(() => {
    const days: { day: string; messages: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.setHours(0, 0, 0, 0)).getTime();
      const dayEnd = dayStart + 86400000;
      const count = allMessages.filter(
        (m) => m.createdAt >= dayStart && m.createdAt < dayEnd
      ).length;
      days.push({
        day: new Date(dayStart).toLocaleDateString("en", { weekday: "short" }),
        messages: count,
      });
    }
    return days;
  }, [allMessages]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            SPYRO <span className="spyro-text-gradient">AI Tools</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live dashboard · tools · analytics
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            {isGenerating && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            )}
            <span className={cn("relative inline-flex h-2 w-2 rounded-full", isGenerating ? "bg-primary" : "bg-green-500")} />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {isGenerating ? "Working…" : "Online"}
          </span>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Conversations" value={conversations.length} icon={MessageCircle} delay={0} />
        <StatCard label="Messages" value={allMessages.length} icon={Zap} delay={0.05} />
        <StatCard label="Words" value={totalWords} icon={TrendingUp} delay={0.1} />
        <StatCard label="Days Active" value={daysActive} icon={Clock} delay={0.15} />
      </div>

      {/* Tools grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6"
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          SPYRO V1 Tools
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.04 }}
              className={cn(
                "surface-elevated rounded-xl p-4 transition-all",
                tool.status === "active" ? "hover:spyro-glow" : "opacity-50"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg",
                  tool.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  <tool.icon className="h-4 w-4" />
                </div>
                {tool.status === "active" && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </div>
              <div className="mt-2 text-sm font-medium">{tool.name}</div>
              <div className="text-[11px] text-muted-foreground">{tool.desc}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Image Generation Tool (full width) */}
      <div className="mt-6">
        <ImageGenTool />
      </div>

      {/* Activity chart + health */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activity chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="surface-elevated rounded-xl p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Last 7 Days</h2>
          </div>
          {activityData.every((d) => d.messages === 0) ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No activity yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id={EMBER_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a1a" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="messages" stroke="#ff7a1a" strokeWidth={2} fill={`url(#${EMBER_GRADIENT_ID})`} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* System health */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="surface-elevated rounded-xl p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">System Health</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Error Rate</span>
              <span className={cn("text-sm font-semibold", errorRate < 5 ? "text-green-500" : "text-destructive")}>
                {errorRate.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(100 - errorRate, 5)}%` }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className={cn("h-full rounded-full", errorRate < 5 ? "bg-green-500" : errorRate < 15 ? "bg-yellow-500" : "bg-destructive")}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">Integrations</span>
              <span className="text-sm font-semibold">{connectedIntegrations}/{integrations.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Responses</span>
              <span className="text-sm font-semibold">{assistantMessages.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Avg Msg/Chat</span>
              <span className="text-sm font-semibold">
                {conversations.length > 0 ? Math.round(allMessages.length / conversations.length) : 0}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
