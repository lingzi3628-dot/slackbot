"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, MessageSquarePlus, Pencil, Trash2, X, Flame,
  MessageCircle, Plug, Settings as SettingsIcon, Info, Search,
  LayoutDashboard, User as UserIcon, Bot, Terminal,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore, type View } from "@/store/ui-store";
import { useLocalAuth } from "@/store/local-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarContentProps {
  onNavigate?: () => void;
}

const NAV_ITEMS: { view: View; label: string; icon: typeof Flame }[] = [
  { view: "chat", label: "Chat", icon: MessageCircle },
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "agent-builder", label: "Agents", icon: Bot },
  { view: "api-playground", label: "API", icon: Terminal },
  { view: "integrations", label: "Integrations", icon: Plug },
  { view: "integration-control", label: "AI Control", icon: SettingsIcon },
  { view: "profile", label: "Profile", icon: UserIcon },
  { view: "about", label: "About", icon: Info },
];

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

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  const conversations = useChatStore((s) => s.conversations);
  const activeId = useChatStore((s) => s.activeId);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActive = useChatStore((s) => s.setActive);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const renameConversation = useChatStore((s) => s.renameConversation);

  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);
  const localUser = useLocalAuth((s) => s.user);
  const isAuthed = useLocalAuth((s) => s.isAuthed);

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.messages.some((m) => m.content.toLowerCase().includes(q)));
  }, [conversations, search]);

  const handleNav = (view: View) => { setView(view); onNavigate?.(); };
  const handleNew = () => { createConversation(); setView("chat"); onNavigate?.(); };
  const handleSelect = (id: string) => { setActive(id); setView("chat"); onNavigate?.(); };

  const startEdit = (id: string, current: string) => { setEditingId(id); setDraft(current); };
  const commitEdit = () => { if (editingId) renameConversation(editingId, draft); setEditingId(null); setDraft(""); };

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden">
      {/* Brand — minimal */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg spyro-bg-gradient">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight">SPYRO</span>
        </div>
      </div>

      {/* Navigation — minimal, spacious */}
      <div className="px-2 pb-3">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all",
                  isActive ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-border" />

      {/* New chat + conversations (chat view only) */}
      {activeView === "chat" && (
        <>
          <div className="px-3 pt-3">
            <Button onClick={handleNew} className="w-full justify-start gap-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/70">
              <MessageSquarePlus className="h-4 w-4" /> New chat
            </Button>
          </div>

          {/* Search */}
          {conversations.length > 0 && (
            <div className="px-3 pt-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full rounded-lg border border-border bg-secondary/30 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-primary/20 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="mt-3 flex-1 overflow-y-auto px-2 pb-2">
            {filtered.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-muted-foreground/40">No conversations</div>
            ) : (
              <ul className="space-y-0.5">
                <AnimatePresence initial={false}>
                  {filtered.map((c) => {
                    const isActive = c.id === activeId;
                    const isEditing = editingId === c.id;
                    return (
                      <motion.li key={c.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <div className={cn("group relative flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors", isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground")}>
                          {isEditing ? (
                            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditingId(null); setDraft(""); } }} onBlur={commitEdit} className="flex-1 rounded border border-primary/30 bg-background px-1.5 py-0.5 text-xs focus:outline-none" />
                          ) : (
                            <button onClick={() => handleSelect(c.id)} className="flex flex-1 flex-col items-start overflow-hidden text-left">
                              <span className="w-full truncate">{c.title}</span>
                              <span className="text-[10px] text-muted-foreground/50">{timeAgo(c.updatedAt)}</span>
                            </button>
                          )}
                          {!isEditing && (
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <button onClick={(e) => { e.stopPropagation(); startEdit(c.id, c.title); }} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          )}
                          {isEditing && <button onClick={commitEdit} className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"><Check className="h-3.5 w-3.5" /></button>}
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </>
      )}

      {/* Footer — user */}
      <div className="mt-auto border-t border-border p-3">
        {isAuthed && localUser ? (
          <button onClick={() => { setView("profile"); onNavigate?.(); }} className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-secondary/50">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: localUser.avatarColor }}>{localUser.name.charAt(0).toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{localUser.name}</div>
              <div className="truncate text-[10px] text-muted-foreground">{localUser.email}</div>
            </div>
          </button>
        ) : (
          <button onClick={() => { setView("register"); onNavigate?.(); }} className="flex w-full items-center justify-center gap-1.5 rounded-xl spyro-bg-gradient py-2 text-xs font-medium text-white">Sign In</button>
        )}
      </div>
    </div>
  );
}

export function SidebarCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close sidebar">
      <X className="h-4 w-4" />
    </button>
  );
}
