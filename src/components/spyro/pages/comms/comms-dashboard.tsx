"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Activity, Bot, Clock, Zap, Heart, TrendingUp,
  CheckCircle2, AlertTriangle, RefreshCw, Power, Phone,
} from "lucide-react";
import { useCommsStore } from "@/store/comms-store";
import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/lib/comms/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function activityIcon(type: ActivityEntry["type"]) {
  switch (type) {
    case "connection": return { icon: Power, color: "text-emerald-400 bg-emerald-500/10" };
    case "disconnection": return { icon: Power, color: "text-rose-400 bg-rose-500/10" };
    case "message": return { icon: MessageCircle, color: "text-cyan-400 bg-cyan-500/10" };
    case "ai_reply": return { icon: Bot, color: "text-violet-400 bg-violet-500/10" };
    case "human_takeover": return { icon: Heart, color: "text-amber-400 bg-amber-500/10" };
    case "agent_assigned": return { icon: Bot, color: "text-violet-400 bg-violet-500/10" };
    case "contact_created": return { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" };
    case "sync": return { icon: RefreshCw, color: "text-cyan-400 bg-cyan-500/10" };
    default: return { icon: Activity, color: "text-muted-foreground bg-secondary" };
  }
}

export function CommsDashboard({ onSync }: { onSync?: () => void }) {
  const dashboard = useCommsStore((s) => s.dashboard);
  const connection = useCommsStore((s) => s.connection);

  if (!dashboard) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  const stats = [
    { label: "Messages today", value: dashboard.messagesToday, icon: MessageCircle, accent: "text-violet-400" },
    { label: "Active conversations", value: dashboard.activeConversations, icon: Activity, accent: "text-cyan-400" },
    { label: "AI response rate", value: `${Math.round(dashboard.aiResponseRate * 100)}%`, icon: Bot, accent: "text-emerald-400" },
    { label: "Human takeover rate", value: `${Math.round(dashboard.humanTakeoverRate * 100)}%`, icon: Heart, accent: "text-amber-400" },
  ];

  const health = dashboard.health;
  const healthLabel = health.score >= 90 ? "Excellent" : health.score >= 70 ? "Good" : health.score >= 50 ? "Fair" : "Poor";
  const healthColor = health.score >= 90 ? "text-emerald-400" : health.score >= 70 ? "text-cyan-400" : health.score >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Connection banner — shows the connected phone number prominently */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="ambient-mesh surface-elevated mb-6 overflow-hidden"
      >
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-soft">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">WhatsApp</h2>
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  dashboard.status === "connected" ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-muted-foreground"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", dashboard.status === "connected" ? "bg-emerald-400" : "bg-muted-foreground")} />
                  {dashboard.status === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {dashboard.deviceName ?? "No device"} {dashboard.lastSyncAt ? `· Synced ${timeAgo(dashboard.lastSyncAt)}` : ""}
              </p>
              {/* Connected phone number — this is the number AI agents reply from */}
              {connection?.phoneNumber && dashboard.status === "connected" && (
                <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px]">
                  <Phone className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400">Replies sent from:</span>
                  <span className="font-mono font-medium text-foreground">{connection.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSync}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium backdrop-blur-sm transition-colors hover:bg-secondary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Sync now
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
            className="surface p-4"
          >
            <div className="flex items-center justify-between">
              <s.icon className={cn("h-4 w-4", s.accent)} />
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Connection health */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="surface p-5 lg:col-span-1"
        >
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Connection health</h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative grid h-20 w-20 place-items-center">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
                <circle
                  cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6"
                  className={healthColor}
                  strokeDasharray={`${(health.score / 100) * 213.6} 213.6`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <div className={cn("text-lg font-bold", healthColor)}>{health.score}</div>
                <div className="text-[9px] text-muted-foreground">/ 100</div>
              </div>
            </div>
            <div>
              <div className={cn("text-sm font-semibold", healthColor)}>{healthLabel}</div>
              <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                {health.latencyMs != null && <div>Latency: {health.latencyMs}ms</div>}
                {health.uptimeHours != null && <div>Uptime: {Math.round(health.uptimeHours)}h</div>}
                {connection?.phoneNumber && <div>{connection.phoneNumber}</div>}
              </div>
            </div>
          </div>

          {health.lastError ? (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div>
                <div className="font-medium">Last error</div>
                <div className="text-amber-400/70">{health.lastError}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All systems operational
            </div>
          )}
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="surface p-5 lg:col-span-2"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Recent activity</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">Last 24h</span>
          </div>

          <div className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
            {dashboard.recentActivity.map((a, i) => {
              const meta = activityIcon(a.type);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.03 }}
                  className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/40"
                >
                  <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg", meta.color)}>
                    <meta.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-tight">{a.description}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" />
                      {timeAgo(a.timestamp)}
                      {a.actor && <><span>·</span><span>{a.actor}</span></>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Connected agents */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="surface mt-6 p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Connected agents</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">{dashboard.connectedAgents} active</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <AgentMiniCard id="a1" name="Sales Assistant" channels={["whatsapp", "telegram"]} />
          <AgentMiniCard id="a2" name="Support Specialist" channels={["whatsapp", "email"]} />
        </div>
      </motion.div>
    </div>
  );
}

function AgentMiniCard({ id, name, channels }: { id: string; name: string; channels: string[] }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 text-sm font-bold text-white">
        {name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium">{name}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          {channels.map((c) => (
            <span key={c} className="rounded bg-secondary px-1.5 py-0.5 capitalize">{c}</span>
          ))}
        </div>
      </div>
      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
        <Zap className="h-3 w-3" />
        Active
      </span>
    </div>
  );
}
