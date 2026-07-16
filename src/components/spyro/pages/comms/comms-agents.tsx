"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Bot, MessageCircle, Mail, Send, Clock, Zap, ShieldAlert,
  Check, X, Plus, Sparkles,
} from "lucide-react";
import { useCommsStore } from "@/store/comms-store";
import { cn } from "@/lib/utils";
import type { AgentAssignment, ChannelType } from "@/lib/comms/types";

const CHANNEL_META: Record<ChannelType, { icon: typeof MessageCircle; label: string; color: string }> = {
  whatsapp: { icon: MessageCircle, label: "WhatsApp", color: "text-emerald-400" },
  telegram: { icon: Send, label: "Telegram", color: "text-cyan-400" },
  slack: { icon: MessageCircle, label: "Slack", color: "text-violet-400" },
  discord: { icon: MessageCircle, label: "Discord", color: "text-indigo-400" },
  email: { icon: Mail, label: "Email", color: "text-amber-400" },
  sms: { icon: MessageCircle, label: "SMS", color: "text-rose-400" },
  instagram: { icon: MessageCircle, label: "Instagram", color: "text-pink-400" },
  messenger: { icon: MessageCircle, label: "Messenger", color: "text-blue-400" },
};

const RESPONSE_STYLES = ["concise", "balanced", "detailed", "friendly", "formal"] as const;
const APPROVAL_MODES = [
  { value: "auto", label: "Auto-reply", desc: "Agent replies instantly, no approval" },
  { value: "approval_required", label: "Approval required", desc: "Every reply needs human approval" },
  { value: "approval_for_sensitive", label: "Sensitive only", desc: "Approval only for sensitive actions" },
] as const;

export function CommsAgents() {
  const agents = useCommsStore((s) => s.agents);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AI Agents</h2>
          <p className="text-xs text-muted-foreground">Assign agents to channels · control behaviour · set escalation rules</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-3 py-2 text-xs font-medium text-white shadow-soft transition-transform hover:scale-[1.02]">
          <Plus className="h-3.5 w-3.5" />
          New agent
        </button>
      </div>

      <div className="space-y-4">
        {agents.map((a, i) => (
          <AgentCard key={a.agentId} agent={a} index={i} />
        ))}
      </div>

      {agents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary/60">
            <Bot className="h-6 w-6 opacity-50" />
          </div>
          <p className="mt-3 text-sm">No agents yet</p>
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent: a, index }: { agent: AgentAssignment; index: number }) {
  const setAgents = useCommsStore((s) => s.setAgents);
  const agents = useCommsStore((s) => s.agents);
  const [open, setOpen] = React.useState(false);

  const update = (patch: Partial<AgentAssignment>) => {
    const next = agents.map((x) => x.agentId === a.agentId ? { ...x, ...patch } : x);
    setAgents(next);
  };

  const toggleChannel = (ch: ChannelType) => {
    const has = a.channels.includes(ch);
    update({
      channels: has ? a.channels.filter((c) => c !== ch) : [...a.channels, ch],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="surface overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-soft">
          <Bot className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{a.agentName}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {a.channels.map((ch) => {
              const meta = CHANNEL_META[ch];
              const Icon = meta.icon;
              return (
                <span key={ch} className={cn("inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px]", meta.color)}>
                  <Icon className="h-2.5 w-2.5" />
                  {meta.label}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
            <Zap className="h-2.5 w-2.5" /> Active
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium hover:bg-secondary"
          >
            {open ? "Hide" : "Configure"}
          </button>
        </div>
      </div>

      {/* Collapsed quick view */}
      {!open && (
        <div className="grid grid-cols-2 gap-2 border-t border-border px-4 py-3 text-xs sm:grid-cols-4">
          <Stat label="Business hours" value={`${a.businessHours.start}–${a.businessHours.end}`} />
          <Stat label="Response style" value={a.responseStyle} />
          <Stat label="Approval" value={APPROVAL_MODES.find((m) => m.value === a.approvalMode)?.label ?? a.approvalMode} />
          <Stat label="Confidence" value={`${Math.round(a.escalationRules.confidenceThreshold * 100)}%`} />
        </div>
      )}

      {/* Expanded configuration */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border p-4"
        >
          {/* Channels */}
          <Section title="Allowed channels">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CHANNEL_META) as ChannelType[]).map((ch) => {
                const meta = CHANNEL_META[ch];
                const Icon = meta.icon;
                const active = a.channels.includes(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
                      active
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className={cn("grid h-4 w-4 place-items-center rounded", active ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                      {active ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                    </span>
                    <Icon className={cn("h-3.5 w-3.5", meta.color)} />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Business hours */}
          <Section title="Business hours">
            <div className="flex flex-wrap items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <input
                type="time"
                value={a.businessHours.start}
                onChange={(e) => update({ businessHours: { ...a.businessHours, start: e.target.value } })}
                className="rounded-lg border border-border bg-card px-2 py-1 text-xs focus:border-primary/30 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="time"
                value={a.businessHours.end}
                onChange={(e) => update({ businessHours: { ...a.businessHours, end: e.target.value } })}
                className="rounded-lg border border-border bg-card px-2 py-1 text-xs focus:border-primary/30 focus:outline-none"
              />
              <span className="text-xs text-muted-foreground">· {a.businessHours.timezone}</span>
              <div className="flex gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => {
                  const active = a.businessHours.daysActive.includes(i);
                  return (
                    <span
                      key={i}
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full text-[10px] font-medium",
                        active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>
            </div>
          </Section>

          {/* Response style */}
          <Section title="Response style">
            <div className="flex flex-wrap gap-1.5">
              {RESPONSE_STYLES.map((s) => (
                <button
                  key={s}
                  onClick={() => update({ responseStyle: s })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs capitalize transition-colors",
                    a.responseStyle === s ? "border-primary/30 bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>

          {/* Approval mode */}
          <Section title="Approval mode">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {APPROVAL_MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => update({ approvalMode: m.value })}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    a.approvalMode === m.value ? "border-primary/30 bg-primary/5" : "border-border bg-card hover:bg-secondary/50"
                  )}
                >
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{m.desc}</div>
                </button>
              ))}
            </div>
          </Section>

          {/* Auto-reply mode */}
          <Section title="Auto-reply mode">
            <div className="flex flex-wrap gap-1.5">
              {([
                { value: "always", label: "Always" },
                { value: "business_hours", label: "Business hours only" },
                { value: "off", label: "Off" },
              ] as const).map((m) => (
                <button
                  key={m.value}
                  onClick={() => update({ autoReplyMode: m.value })}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                    a.autoReplyMode === m.value ? "border-primary/30 bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Escalation rules */}
          <Section title="Escalation rules">
            <div className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Confidence threshold</span>
                  <span className="font-medium">{Math.round(a.escalationRules.confidenceThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(a.escalationRules.confidenceThreshold * 100)}
                  onChange={(e) => update({
                    escalationRules: { ...a.escalationRules, confidenceThreshold: Number(e.target.value) / 100 },
                  })}
                  className="w-full accent-primary"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  If the AI is less than this confident, escalate to a human.
                </p>
              </div>

              <label className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  Auto-escalate on negative sentiment
                </span>
                <input
                  type="checkbox"
                  checked={a.escalationRules.autoEscalateOnNegative}
                  onChange={(e) => update({
                    escalationRules: { ...a.escalationRules, autoEscalateOnNegative: e.target.checked },
                  })}
                  className="h-4 w-4 accent-primary"
                />
              </label>

              <label className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                  Notify on human takeover
                </span>
                <input
                  type="checkbox"
                  checked={a.escalationRules.notifyOnHumanTakeover}
                  onChange={(e) => update({
                    escalationRules: { ...a.escalationRules, notifyOnHumanTakeover: e.target.checked },
                  })}
                  className="h-4 w-4 accent-primary"
                />
              </label>

              <div>
                <div className="mb-1 text-xs text-muted-foreground">Escalation keywords</div>
                <div className="flex flex-wrap gap-1">
                  {a.escalationRules.escalateKeywords.map((k) => (
                    <span key={k} className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                      {k}
                      <button onClick={() => update({
                        escalationRules: { ...a.escalationRules, escalateKeywords: a.escalationRules.escalateKeywords.filter((x) => x !== k) },
                      })}>
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* Knowledge sources */}
          <Section title="Knowledge sources">
            <div className="flex flex-wrap gap-1.5">
              {a.knowledgeSources.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px]">
                  <Sparkles className="h-2.5 w-2.5 text-violet-400" />
                  {k}
                </span>
              ))}
              <button className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:text-foreground">
                <Plus className="h-2.5 w-2.5" /> Add source
              </button>
            </div>
          </Section>
        </motion.div>
      )}
    </motion.div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-medium capitalize">{value}</div>
    </div>
  );
}
