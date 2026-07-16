"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Search, Phone, Tag, Smile, Meh, Frown, Bot, Clock, Plus, X,
} from "lucide-react";
import { useCommsStore } from "@/store/comms-store";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/comms/types";

function timeAgo(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function sentimentMeta(s: Contact["sentiment"]) {
  switch (s) {
    case "positive": return { icon: Smile, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    case "neutral": return { icon: Meh, color: "text-cyan-400", bg: "bg-cyan-500/10" };
    case "negative": return { icon: Frown, color: "text-rose-400", bg: "bg-rose-500/10" };
    default: return { icon: Meh, color: "text-muted-foreground", bg: "bg-secondary" };
  }
}

export function CommsContacts() {
  const contacts = useCommsStore((s) => s.contacts);

  const [search, setSearch] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Contact | null>(null);

  const allTags = React.useMemo(() => {
    const s = new Set<string>();
    contacts.forEach((c) => c.tags.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [contacts]);

  const filtered = React.useMemo(() => {
    let list = contacts;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
      );
    }
    if (tagFilter) list = list.filter((c) => c.tags.includes(tagFilter));
    return list;
  }, [contacts, search, tagFilter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Contacts</h2>
          <p className="text-xs text-muted-foreground">{contacts.length} contacts · synced from WhatsApp</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts…"
            className="w-full rounded-xl border border-border bg-secondary/30 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setTagFilter(null)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
              !tagFilter ? "bg-primary/15 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(t === tagFilter ? null : t)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                tagFilter === t ? "bg-primary/15 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Contacts grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c, i) => {
          const s = sentimentMeta(c.sentiment);
          const SIcon = s.icon;
          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(c)}
              className="surface p-4 text-left transition-all hover:spyro-glow"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: c.avatarColor }}>
                  {c.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">{c.name}</h3>
                    <SIcon className={cn("h-3 w-3 shrink-0", s.color)} />
                  </div>
                  {c.phone && <p className="truncate text-xs text-muted-foreground">{c.phone}</p>}
                </div>
              </div>

              {c.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.tags.slice(0, 3).map((t) => (
                    <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-1.5 py-0.5 text-[9px]">
                      <Tag className="h-2 w-2" />
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bot className="h-2.5 w-2.5" />
                  {c.assignedAgentId ? (c.assignedAgentId === "a1" ? "Sales Assistant" : "Support Specialist") : "Unassigned"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  {timeAgo(c.lastInteractionAt)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary/60">
            <Phone className="h-6 w-6 opacity-50" />
          </div>
          <p className="mt-3 text-sm">No contacts found</p>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <ContactDetailDrawer contact={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ContactDetailDrawer({ contact: c, onClose }: { contact: Contact; onClose: () => void }) {
  const s = sentimentMeta(c.sentiment);
  const SIcon = s.icon;
  return (
    <div className="fixed inset-0 z-[80] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative h-full w-full max-w-md overflow-y-auto border-l border-border bg-card shadow-elevated"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/90 px-5 py-4 backdrop-blur-xl">
          <h3 className="text-sm font-semibold">Contact</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Avatar + name */}
          <div className="flex flex-col items-center text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full text-2xl font-bold text-white" style={{ background: c.avatarColor }}>
              {c.name.charAt(0)}
            </div>
            <h2 className="mt-3 text-lg font-bold">{c.name}</h2>
            {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
            <div className="mt-2 flex items-center gap-2">
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", s.bg, s.color)}>
                <SIcon className="h-2.5 w-2.5" />
                {c.sentiment}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                {c.conversationCount} conversations
              </span>
            </div>
          </div>

          {/* Tags */}
          {c.tags.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1">
                {c.tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                    <Tag className="h-2.5 w-2.5" />
                    {t}
                  </span>
                ))}
                <button className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
                  <Plus className="h-2.5 w-2.5" /> Add tag
                </button>
              </div>
            </Section>
          )}

          {/* Assigned agent */}
          <Section title="Assigned agent">
            <div className="rounded-xl border border-border p-3">
              {c.assignedAgentId ? (
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-xs font-bold text-white">A</div>
                  <div>
                    <div className="text-xs font-medium">{c.assignedAgentId === "a1" ? "Sales Assistant" : "Support Specialist"}</div>
                    <div className="text-[10px] text-muted-foreground">Auto-reply active</div>
                  </div>
                </div>
              ) : (
                <button className="text-xs text-primary hover:underline">+ Assign an agent</button>
              )}
            </div>
          </Section>

          {/* Custom fields */}
          {Object.keys(c.customFields).length > 0 && (
            <Section title="Profile fields">
              <dl className="space-y-1.5">
                {Object.entries(c.customFields).map(([k, v]) => (
                  <div key={k} className="flex justify-between rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}

          {/* Purchase history */}
          {c.purchaseHistory && c.purchaseHistory.length > 0 && (
            <Section title="Purchase history">
              <div className="space-y-1.5">
                {c.purchaseHistory.map((p, i) => (
                  <div key={i} className="flex justify-between rounded-lg border border-border p-2 text-xs">
                    <div>
                      <div className="font-medium">{p.item}</div>
                      <div className="text-[10px] text-muted-foreground">{timeAgo(p.date)}</div>
                    </div>
                    <span className="font-semibold">${p.amount}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Notes */}
          {c.notes && (
            <Section title="Internal notes">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90">
                {c.notes}
              </div>
            </Section>
          )}

          {/* Last interaction */}
          <Section title="Last interaction">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {timeAgo(c.lastInteractionAt)}
            </div>
          </Section>
        </div>
      </motion.div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
