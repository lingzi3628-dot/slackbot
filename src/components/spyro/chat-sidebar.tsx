"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, MessageSquarePlus, Pencil, Trash2, X,
  MessageCircle, Settings as SettingsIcon, Search,
  Home, FolderKanban, BookOpen, Bot, LayoutGrid,
  BarChart3, Flame, Inbox, Bell, Plus, ChevronDown,
  Zap, MessageSquare, FolderPlus, Upload, Globe, Rocket,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore, type View } from "@/store/ui-store";
import { useLocalAuth } from "@/store/local-auth";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarContentProps {
  onNavigate?: () => void;
}

// ── Navigation configuration (data-driven) ───────────────────────────
// Supports: permissions, badges, notification counts, nested routes,
// and future plugins. Per the spec: max 9 primary items.
interface NavItem {
  view: View;
  label: string;
  icon: typeof Home;
  badge?: string;
  notificationCount?: number;
}

const NAV_ITEMS: NavItem[] = [
  { view: "home", label: "Home", icon: Home },
  { view: "projects", label: "Projects", icon: FolderKanban },
  { view: "chat", label: "Chats", icon: MessageCircle },
  { view: "agents", label: "Agents", icon: Bot },
  { view: "knowledge", label: "Knowledge", icon: BookOpen },
  { view: "communication", label: "Communication", icon: Inbox, badge: "New" },
  { view: "studio", label: "Launch Studio", icon: Rocket, badge: "New" },
  { view: "analytics", label: "Analytics", icon: BarChart3 },
  { view: "settings", label: "Settings", icon: SettingsIcon },
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
  const [showQuickCreate, setShowQuickCreate] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const handleNav = (view: View) => { setView(view); onNavigate?.(); };
  const handleNew = () => { createConversation(); setView("chat"); onNavigate?.(); };
  const handleSelect = (id: string) => { setActive(id); setView("chat"); onNavigate?.(); };
  const startEdit = (id: string, current: string) => { setEditingId(id); setDraft(current); };
  const commitEdit = () => { if (editingId) renameConversation(editingId, draft); setEditingId(null); setDraft(""); };

  // Workspace switcher
  const workspaceTemplate = useWorkspaceStore((s) => s.template);
  const resetWorkspace = useWorkspaceStore((s) => s.resetWorkspace);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = React.useState(false);
  const handleSwitchWorkspace = () => {
    resetWorkspace();
    setShowWorkspaceMenu(false);
  };

  const openSearch = () => {
    // Dispatch ⌘K
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden">
      {/* ── Top: Logo + Workspace Switcher ──────────────────────────── */}
      <div className="relative px-3 pt-4 pb-2">
        <button
          onClick={() => setShowWorkspaceMenu((v) => !v)}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-secondary/60"
        >
          <div className={cn(
            "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
            workspaceTemplate ? cn("bg-gradient-to-br", workspaceTemplate.color) : "spyro-bg-gradient"
          )}>
            {workspaceTemplate ? <workspaceTemplate.icon className="h-4 w-4 text-white" /> : <Flame className="h-4 w-4 text-white" />}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-sm font-bold tracking-tight">
              {workspaceTemplate ? workspaceTemplate.name : "SPYRO"}
            </div>
            <div className="truncate text-[9px] text-muted-foreground">
              {workspaceTemplate ? "Workspace" : "AI Operating System"}
            </div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>

        {/* Workspace switcher dropdown */}
        <AnimatePresence>
          {showWorkspaceMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowWorkspaceMenu(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-3 right-3 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-elevated"
              >
                <div className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Current workspace
                </div>
                <div className="flex items-center gap-2 rounded-lg px-2 py-2">
                  <div className={cn("grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br", workspaceTemplate?.color || "from-violet-500 to-cyan-500")}>
                    {workspaceTemplate ? <workspaceTemplate.icon className="h-3 w-3 text-white" /> : <Flame className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-xs font-medium">{workspaceTemplate?.name || "Default"}</span>
                </div>
                <div className="my-1 h-px bg-border" />
                <button
                  onClick={handleSwitchWorkspace}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Switch workspace
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ── Global Search (⌘K) ──────────────────────────────────────── */}
      <div className="px-3 pb-2">
        <button
          onClick={openSearch}
          className="flex w-full items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <kbd className="rounded border border-border bg-secondary px-1 py-0.5 text-[9px] font-medium">⌘K</kbd>
        </button>
      </div>

      {/* ── Primary Navigation ──────────────────────────────────────── */}
      <div className="px-2 pb-2">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={cn(
                  "group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] transition-all",
                  isActive
                    ? "bg-primary/10 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                  />
                )}
                <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                    {item.badge}
                  </span>
                )}
                {item.notificationCount && item.notificationCount > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {item.notificationCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Conversations (only on chat view) ───────────────────────── */}
      {activeView === "chat" && (
        <>
          <div className="px-3 pt-1">
            <Button onClick={handleNew} className="w-full justify-start gap-2 rounded-xl bg-secondary text-foreground hover:bg-secondary/70">
              <MessageSquarePlus className="h-4 w-4" /> New chat
            </Button>
          </div>

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

          <div className="mt-2 flex-1 overflow-y-auto px-2 pb-2">
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

      {/* ── Bottom: Notifications + Profile ─────────────────────────── */}
      <div className="mt-auto border-t border-border p-2">
        {/* Quick create FAB (in-sidebar version) */}
        <div className="relative mb-1">
          <button
            onClick={() => setShowQuickCreate((v) => !v)}
            className="flex w-full items-center gap-2 rounded-xl spyro-bg-gradient px-3 py-2 text-xs font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-3.5 w-3.5" />
            Quick Create
          </button>
          <AnimatePresence>
            {showQuickCreate && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowQuickCreate(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute bottom-full left-0 right-0 z-20 mb-2 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-elevated"
                >
                  {QUICK_CREATE_ITEMS.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(setView, createConversation); setShowQuickCreate(false); onNavigate?.(); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-secondary"
                    >
                      <item.icon className="h-3.5 w-3.5 text-primary" />
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications + Profile row */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          {isAuthed && localUser ? (
            <button
              onClick={() => { setView("profile"); onNavigate?.(); }}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1.5 text-left transition-colors hover:bg-secondary/50"
            >
              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold text-white" style={{ background: localUser.avatarColor }}>
                {localUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{localUser.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">{localUser.email}</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => { setView("register"); onNavigate?.(); }}
              className="flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg spyro-bg-gradient py-2 text-xs font-medium text-white"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quick Create items (data-driven) ──────────────────────────────────
const QUICK_CREATE_ITEMS: Array<{
  label: string;
  icon: typeof Plus;
  action: (setView: (v: View) => void, createConversation: () => void) => void;
}> = [
  { label: "New Chat", icon: MessageSquare, action: (setView, create) => { create(); setView("chat"); } },
  { label: "New Project", icon: FolderPlus, action: (setView) => setView("projects") },
  { label: "New Agent", icon: Bot, action: (setView) => setView("agents") },
  { label: "Upload File", icon: Upload, action: (setView) => setView("apps") },
  { label: "Research Topic", icon: Globe, action: (setView) => setView("chat") },
  { label: "Connect WhatsApp", icon: Inbox, action: (setView) => setView("communication") },
  { label: "Automation", icon: Zap, action: (setView) => setView("apps") },
];

export function SidebarCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close sidebar">
      <X className="h-4 w-4" />
    </button>
  );
}
