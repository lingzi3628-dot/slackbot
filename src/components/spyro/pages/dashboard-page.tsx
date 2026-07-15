"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Zap,
  Image as ImageIcon,
  Flame,
  TrendingUp,
  Clock,
  Globe,
  Database,
  Mic,
  Volume2,
  Code2,
  Sparkles,
  Activity,
  Layers,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useChatStore } from "@/store/chat-store";
import { useIntegrationsStore } from "@/store/integrations-store";
import { cn } from "@/lib/utils";

// ── Animated counter ──────────────────────────────────────────────────
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

// ── Chart colors ──────────────────────────────────────────────────────
const CHART_COLORS = ["#ff7a1a", "#e8421b", "#ffd27a", "#ff9a3c", "#d8421b", "#ffae42"];

const EMBER_GRADIENT_ID = "emberGradient";

// ── Main Dashboard ────────────────────────────────────────────────────
export function DashboardPage() {
  const conversations = useChatStore((s) => s.conversations);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const integrations = useIntegrationsStore((s) => s.integrations);

  // ── Compute stats ───────────────────────────────────────────────────
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

  // ── Activity over last 7 days ───────────────────────────────────────
  const activityData = React.useMemo(() => {
    const days: { day: string; messages: number; date: string }[] = [];
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
        date: new Date(dayStart).toLocaleDateString(),
      });
    }
    return days;
  }, [allMessages]);

  // ── Message type breakdown ──────────────────────────────────────────
  const messageTypeData = [
    { name: "User Messages", value: userMessages.length, color: CHART_COLORS[0] },
    { name: "AI Responses", value: assistantMessages.length, color: CHART_COLORS[1] },
    { name: "Images", value: imageMessages.length, color: CHART_COLORS[2] },
  ].filter((d) => d.value > 0);

  // ── Conversation size distribution ──────────────────────────────────
  const convSizeData = conversations
    .map((c) => ({
      name: c.title.length > 15 ? c.title.slice(0, 15) + "…" : c.title,
      messages: c.messages.length,
    }))
    .sort((a, b) => b.messages - a.messages)
    .slice(0, 6);

  // ── Recent activity ─────────────────────────────────────────────────
  const recentActivity = conversations.slice(0, 6).map((c) => ({
    title: c.title,
    messages: c.messages.length,
    time: new Date(c.updatedAt).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
    }),
    images: c.messages.filter((m) => m.type === "image").length,
  }));

  // ── Feature usage ───────────────────────────────────────────────────
  const features = [
    { label: "Streaming Chat", icon: MessageCircle, active: true },
    { label: "God Mode", icon: Zap, active: true },
    { label: "Voice Input", icon: Mic, active: true },
    { label: "Text-to-Speech", icon: Volume2, active: true },
    { label: "Web Search", icon: Globe, active: true },
    { label: "Image Generation", icon: ImageIcon, active: true },
    { label: "Tool Calling", icon: Database, active: true },
    { label: "Code Preview", icon: Code2, active: true },
  ];

  const connectedIntegrations = integrations.filter((i) => i.connected).length;
  const errorRate = allMessages.length > 0
    ? (errorMessages.length / allMessages.length) * 100
    : 0;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time SPYRO V1 usage analytics
          </p>
        </div>
        {/* Live status badge */}
        <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            {isGenerating && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isGenerating ? "bg-primary" : "bg-green-500"
              )}
            />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {isGenerating ? "Generating…" : "Online"}
          </span>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Conversations" value={conversations.length} icon={MessageCircle} delay={0} />
        <StatCard label="Messages" value={allMessages.length} icon={Zap} delay={0.05} />
        <StatCard label="Images" value={imageMessages.length} icon={ImageIcon} delay={0.1} />
        <StatCard label="Words" value={totalWords} icon={TrendingUp} delay={0.15} />
        <StatCard label="Days Active" value={daysActive} icon={Clock} delay={0.2} />
        <StatCard
          label="Integrations"
          value={connectedIntegrations}
          suffix={`/${integrations.length}`}
          icon={Globe}
          delay={0.25}
        />
        <StatCard label="Errors" value={errorMessages.length} icon={Database} delay={0.3} />
        <StatCard
          label="Avg Msg/Chat"
          value={conversations.length > 0 ? Math.round(allMessages.length / conversations.length) : 0}
          icon={Layers}
          delay={0.35}
        />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Activity over 7 days */}
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
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No activity yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id={EMBER_GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff7a1a" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#ff7a1a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                />
                <Area
                  type="monotone"
                  dataKey="messages"
                  stroke="#ff7a1a"
                  strokeWidth={2}
                  fill={`url(#${EMBER_GRADIENT_ID})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Message type breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="surface-elevated rounded-xl p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Message Breakdown</h2>
          </div>
          {messageTypeData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No messages yet
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={messageTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {messageTypeData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {messageTypeData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="flex-1 text-xs text-muted-foreground">{d.name}</span>
                    <span className="text-sm font-semibold tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Conversation sizes bar chart */}
      {convSizeData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="surface-elevated mt-4 rounded-xl p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Top Conversations by Size</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={convSizeData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: "rgba(255,122,26,0.1)" }}
              />
              <Bar dataKey="messages" radius={[0, 6, 6, 0]}>
                {convSizeData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent activity + features */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="surface-elevated rounded-xl p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Recent Activity</h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <Flame className="mx-auto mb-2 h-6 w-6 text-primary/40" />
              No activity yet
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {recentActivity.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.04 }}
                    className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/20 px-3 py-2"
                  >
                    <MessageCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{item.title}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {item.messages} msg{item.images > 0 && ` · ${item.images} img`} · {item.time}
                      </div>
                    </div>
                    {item.images > 0 && (
                      <ImageIcon className="h-3 w-3 text-primary/60" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Active features */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="surface-elevated rounded-xl p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Active Features</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map((feat, i) => (
              <motion.div
                key={feat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55 + i * 0.03 }}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                  feat.active
                    ? "border-primary/30 bg-primary/5 text-foreground"
                    : "border-border/50 text-muted-foreground"
                )}
              >
                <feat.icon className={cn("h-3 w-3", feat.active ? "text-primary" : "text-muted-foreground")} />
                {feat.label}
                {feat.active && (
                  <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Health bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <span>System Health</span>
              <span className={cn(errorRate < 5 ? "text-green-500" : "text-destructive")}>
                {errorRate < 5 ? "Excellent" : errorRate < 15 ? "Fair" : "Poor"}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(100 - errorRate, 5)}%` }}
                transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  errorRate < 5 ? "bg-green-500" : errorRate < 15 ? "bg-yellow-500" : "bg-destructive"
                )}
              />
            </div>
            <div className="mt-1 text-right text-[10px] text-muted-foreground">
              {errorRate.toFixed(1)}% error rate
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
