"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Pin, Inbox as InboxIcon, Bot, Heart, Paperclip,
  Send, Sparkles, UserCog, ArrowLeft, Phone, Tag, Clock,
  Smile, Meh, Frown, Image as ImageIcon, FileText, MapPin,
  Mic, Play, File,
} from "lucide-react";
import { useCommsStore } from "@/store/comms-store";
import { cn } from "@/lib/utils";
import type {
  ConversationSummary, ConversationMessage, Attachment, Contact,
} from "@/lib/comms/types";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString();
}

function sentimentMeta(s: ConversationSummary["sentiment"]) {
  switch (s) {
    case "positive": return { icon: Smile, color: "text-emerald-400", bg: "bg-emerald-500/10" };
    case "neutral": return { icon: Meh, color: "text-cyan-400", bg: "bg-cyan-500/10" };
    case "negative": return { icon: Frown, color: "text-rose-400", bg: "bg-rose-500/10" };
    default: return { icon: Meh, color: "text-muted-foreground", bg: "bg-secondary" };
  }
}

function AttachmentChip({ a }: { a: Attachment }) {
  const icon = React.useMemo(() => {
    switch (a.type) {
      case "image": return ImageIcon;
      case "pdf": case "document": return FileText;
      case "voice": return Mic;
      case "audio": return Play;
      case "video": return Play;
      case "location": return MapPin;
      case "contact": return UserCog;
      case "sticker": return Tag;
      default: return File;
    }
  }, [a.type]);
  const Icon = icon;
  return (
    <div className="mt-1 flex max-w-[240px] items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate text-[11px] text-muted-foreground">{a.filename || a.type}</span>
    </div>
  );
}

export function CommsInbox({ channelId }: { channelId: string }) {
  const conversations = useCommsStore((s) => s.conversations);
  const activeConversation = useCommsStore((s) => s.activeConversation);
  const loadingConvo = useCommsStore((s) => s.loadingConvo);
  const setActiveConversation = useCommsStore((s) => s.setActiveConversation);
  const setLoadingConvo = useCommsStore((s) => s.setLoadingConvo);

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "unread" | "ai" | "human" | "negative">("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [mobileOpenConvo, setMobileOpenConvo] = React.useState(false);

  const filtered = React.useMemo(() => {
    let list = conversations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.contactName.toLowerCase().includes(q) ||
        c.lastMessagePreview.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    switch (filter) {
      case "unread": list = list.filter((c) => c.unreadCount > 0); break;
      case "ai": list = list.filter((c) => c.aiHandled); break;
      case "human": list = list.filter((c) => c.humanTakenOver); break;
      case "negative": list = list.filter((c) => c.sentiment === "negative"); break;
    }
    return list;
  }, [conversations, search, filter]);

  const openConversation = React.useCallback(async (id: string) => {
    setSelectedId(id);
    setMobileOpenConvo(true);
    setLoadingConvo(true);
    setActiveConversation(null);
    try {
      const res = await fetch(`/api/comms/conversation?channelId=${channelId}&conversationId=${id}&channelType=whatsapp`, { cache: "no-store" });
      const data = await res.json();
      setActiveConversation(data);
    } catch {
      /* ignore */
    } finally {
      setLoadingConvo(false);
    }
  }, [channelId, setActiveConversation, setLoadingConvo]);

  const sendMessage = React.useCallback(async () => {
    const text = draft.trim();
    if (!text || !selectedId) return;
    setDraft("");
    try {
      await fetch("/api/comms/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelId, conversationId: selectedId, text, channelType: "whatsapp" }),
      });
      // Optimistically append to the active conversation.
      setActiveConversation((prev) => prev ? {
        ...prev,
        messages: [...prev.messages, {
          id: `m_${Date.now()}`,
          conversationId: selectedId,
          direction: "out" as const,
          status: "sent" as const,
          text,
          attachments: [],
          createdAt: Date.now(),
          authorIsAgent: true,
          authorIsAI: false,
        }],
      } : prev);
    } catch { /* ignore */ }
  }, [draft, selectedId, channelId, setActiveConversation]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Conversation list */}
      <div className={cn(
        "flex w-full flex-col border-r border-border lg:w-80 lg:flex",
        mobileOpenConvo && "hidden lg:flex"
      )}>
        {/* Search + filters */}
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-xl border border-border bg-secondary/30 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
            />
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {([
              ["all", "All"],
              ["unread", "Unread"],
              ["ai", "AI"],
              ["human", "Human"],
              ["negative", "Needs attention"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  filter === key ? "bg-primary/15 text-primary" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-xs text-muted-foreground">
              <InboxIcon className="mb-2 h-6 w-6 opacity-40" />
              No conversations
            </div>
          ) : (
            filtered.map((c, i) => {
              const isActive = c.id === selectedId;
              const s = sentimentMeta(c.sentiment);
              return (
                <motion.button
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => openConversation(c.id)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-border/50 p-3 text-left transition-colors",
                    isActive ? "bg-secondary/60" : "hover:bg-secondary/30"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white" style={{ background: c.contactAvatarColor }}>
                      {c.contactName.charAt(0)}
                    </div>
                    {c.pinned && <Pin className="absolute -right-1 -top-1 h-3 w-3 fill-primary text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.contactName}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{c.lastMessagePreview}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {c.aiHandled && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-400">
                          <Bot className="h-2.5 w-2.5" /> AI
                        </span>
                      )}
                      {c.humanTakenOver && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
                          <Heart className="h-2.5 w-2.5" /> Human
                        </span>
                      )}
                      <s.icon className={cn("h-3 w-3", s.color)} />
                      {c.unreadCount > 0 && (
                        <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail pane */}
      <div className={cn(
        "flex min-w-0 flex-1 flex-col",
        !mobileOpenConvo && "hidden lg:flex"
      )}>
        <AnimatePresence mode="wait">
          {!selectedId ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col items-center justify-center p-8 text-center"
            >
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-secondary/60">
                <InboxIcon className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-semibold">Select a conversation</h3>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Pick a chat from the left to see the full thread, AI summary and suggested replies.
              </p>
            </motion.div>
          ) : loadingConvo || !activeConversation ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                <span className="text-xs">Loading conversation…</span>
              </div>
            </motion.div>
          ) : (
            <ConversationDetail
              key="detail"
              summary={activeConversation.summary}
              messages={activeConversation.messages}
              contact={activeConversation.contact}
              notes={activeConversation.internalNotes}
              activity={activeConversation.activity}
              draft={draft}
              setDraft={setDraft}
              onSend={sendMessage}
              onBack={() => setMobileOpenConvo(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ConversationDetail({
  summary, messages, contact, notes, activity, draft, setDraft, onSend, onBack,
}: {
  summary: ConversationSummary;
  messages: ConversationMessage[];
  contact: Contact;
  notes: Array<{ id: string; text: string; author: string; createdAt: number }>;
  activity: Array<{ id: string; type: string; description: string; timestamp: number }>;
  draft: string;
  setDraft: (s: string) => void;
  onSend: () => void;
  onBack: () => void;
}) {
  const [showProfile, setShowProfile] = React.useState(false);
  const s = sentimentMeta(summary.sentiment);
  const SIcon = s.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="flex h-full"
    >
      {/* Main thread */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center gap-3 border-b border-border px-3 sm:px-4">
          <button onClick={onBack} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden" aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setShowProfile(false)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white" style={{ background: contact.avatarColor }}>
              {contact.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{contact.name}</div>
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                {contact.phone && <><Phone className="h-2.5 w-2.5" />{contact.phone}</>}
                <SIcon className={cn("h-2.5 w-2.5", s.color)} />
              </div>
            </div>
          </button>
          <div className="flex items-center gap-1">
            {summary.humanTakenOver ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-400">
                <Heart className="h-3 w-3" /> Human
              </span>
            ) : (
              <button className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-500/20">
                <UserCog className="h-3 w-3" /> Take over
              </button>
            )}
            <button
              onClick={() => setShowProfile((v) => !v)}
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg hover:bg-secondary",
                showProfile ? "bg-secondary text-foreground" : "text-muted-foreground"
              )}
              aria-label="Customer profile"
            >
              <UserCog className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* AI summary banner */}
        {summary.aiSummary && (
          <div className="border-b border-border bg-violet-500/[0.04] p-3">
            <div className="flex items-start gap-2">
              <div className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-violet-500/15">
                <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">AI Summary</div>
                <p className="mt-0.5 text-xs text-foreground/90">{summary.aiSummary}</p>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} contactName={contact.name} />
          ))}
        </div>

        {/* Suggested replies */}
        {summary.suggestedReplies.length > 0 && (
          <div className="border-t border-border bg-card/40 p-2">
            <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3 text-violet-400" />
              Suggested replies
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {summary.suggestedReplies.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setDraft(r)}
                  className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer — replies are sent from the connected WhatsApp number */}
        <div className="border-t border-border p-3">
          <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
            <Send className="h-2.5 w-2.5 text-emerald-400" />
            <span>Sent from your connected WhatsApp number</span>
          </div>
          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2">
            <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Attach">
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Type a message…"
              rows={1}
              className="max-h-32 min-h-[32px] flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={onSend}
              disabled={!draft.trim()}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg spyro-bg-gradient text-white transition-opacity disabled:opacity-40"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile / activity drawer */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden shrink-0 border-l border-border bg-card/40 lg:block"
          >
            <div className="h-full overflow-y-auto p-4">
              <div className="flex flex-col items-center text-center">
                <div className="grid h-16 w-16 place-items-center rounded-full text-xl font-bold text-white" style={{ background: contact.avatarColor }}>
                  {contact.name.charAt(0)}
                </div>
                <h3 className="mt-3 text-sm font-semibold">{contact.name}</h3>
                {contact.phone && <p className="text-xs text-muted-foreground">{contact.phone}</p>}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", s.bg, s.color)}>
                    <SIcon className="h-2.5 w-2.5" />
                    {summary.sentiment}
                  </span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
                    {contact.conversationCount} chats
                  </span>
                </div>
              </div>

              {/* Tags */}
              {contact.tags.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                        <Tag className="h-2.5 w-2.5" />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned agent */}
              <div className="mt-4">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Assigned agent</div>
                <div className="rounded-xl border border-border p-2 text-xs">
                  {summary.assignedAgentId ? (
                    <div className="flex items-center gap-2">
                      <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 text-[10px] font-bold text-white">A</div>
                      <span>{summary.assignedAgentId === "a1" ? "Sales Assistant" : "Support Specialist"}</span>
                    </div>
                  ) : (
                    <button className="text-primary hover:underline">+ Assign agent</button>
                  )}
                </div>
              </div>

              {/* Custom fields */}
              {Object.keys(contact.customFields).length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Profile</div>
                  <dl className="space-y-1">
                    {Object.entries(contact.customFields).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {/* Purchase history */}
              {contact.purchaseHistory && contact.purchaseHistory.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Purchase history</div>
                  <div className="space-y-1">
                    {contact.purchaseHistory.map((p, i) => (
                      <div key={i} className="flex justify-between rounded-lg border border-border p-2 text-xs">
                        <span className="truncate">{p.item}</span>
                        <span className="font-medium">${p.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal notes */}
              {notes.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Internal notes</div>
                  <div className="space-y-1.5">
                    {notes.map((n) => (
                      <div key={n.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2 text-xs">
                        <p className="text-amber-100/90">{n.text}</p>
                        <div className="mt-1 text-[10px] text-muted-foreground">— {n.author}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Activity timeline */}
              {activity.length > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Activity</div>
                  <div className="space-y-2">
                    {activity.map((a) => (
                      <div key={a.id} className="flex items-start gap-2 text-xs">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <div>
                          <p>{a.description}</p>
                          <div className="text-[10px] text-muted-foreground">{timeAgo(a.timestamp)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MessageBubble({ message: m, contactName }: { message: ConversationMessage; contact: string; contactName: string }) {
  const isOut = m.direction === "out";
  return (
    <div className={cn("flex", isOut ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[78%] rounded-2xl px-3 py-2",
        isOut
          ? "bg-primary text-primary-foreground"
          : m.internalNote
            ? "bg-amber-500/10 text-amber-200 border border-amber-500/20"
            : "bg-secondary text-foreground"
      )}>
        {m.internalNote && (
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
            <UserCog className="h-3 w-3" /> Internal note
          </div>
        )}
        {m.text && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.text}</p>}
        {m.attachments.map((a) => <AttachmentChip key={a.id} a={a} />)}
        <div className={cn(
          "mt-1 flex items-center gap-1 text-[9px]",
          isOut ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {m.authorIsAI && <Bot className="h-2.5 w-2.5" />}
          {!isOut && <span>{m.authorName ?? contactName}</span>}
          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {isOut && (
            <span className={cn(m.status === "read" && "text-cyan-300")}>
              {m.status === "read" ? "✓✓" : m.status === "delivered" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
