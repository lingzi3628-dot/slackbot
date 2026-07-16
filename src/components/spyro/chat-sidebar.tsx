"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
  Flame,
  MessageCircle,
  Plug,
  Settings as SettingsIcon,
  Info,
  Search,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore, type View } from "@/store/ui-store";
import { useLocalAuth } from "@/store/local-auth";
import { ModelBadge } from "./model-badge";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarContentProps {
  onNavigate?: () => void;
}

const NAV_ITEMS: { view: View; label: string; icon: typeof Flame }[] = [
  { view: "chat", label: "Chat", icon: MessageCircle },
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
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

  // Filter conversations by search query (title + message content).
  const filteredConversations = React.useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setDraft(current);
  };
  const commitEdit = () => {
    if (editingId) renameConversation(editingId, draft);
    setEditingId(null);
    setDraft("");
  };

  const handleNav = (view: View) => {
    setView(view);
    onNavigate?.();
  };

  const handleNew = () => {
    createConversation();
    setView("chat");
    onNavigate?.();
  };

  const handleSelect = (id: string) => {
    setActive(id);
    setView("chat");
    onNavigate?.();
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden">
      {/* Brand — compact */}
      <div className="px-5 pt-5 pb-3">
        <ModelBadge size="sm" />
      </div>

      {/* Navigation — pill-style */}
      <div className="px-3 pb-3">
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleNav(item.view)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.label}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-border/50" />

      {/* New chat + conversation list (only in chat view) */}
      {activeView === "chat" && (
        <>
          <div className="px-3 pt-3">
            <Button
              onClick={handleNew}
              className="w-full justify-start gap-2 spyro-bg-gradient text-primary-foreground hover:spyro-glow"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </Button>
          </div>

          {/* Search */}
          {conversations.length > 0 && (
            <div className="px-3 pt-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats…"
                  className="w-full rounded-lg border border-border/50 bg-muted/30 py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex-1 overflow-y-auto px-2 pb-2">
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {search ? `Results (${filteredConversations.length})` : "Recent"}
            </div>
            {filteredConversations.length === 0 ? (
              <div className="mx-2 rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground/80">
                <Flame className="mx-auto mb-2 h-4 w-4 text-primary/50" />
                No chats yet
              </div>
            ) : (
              <ul className="space-y-0.5">
                <AnimatePresence initial={false}>
                  {filteredConversations.map((c) => {
                    const isActive = c.id === activeId;
                    const isEditing = editingId === c.id;
                    return (
                      <motion.li
                        key={c.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div
                          className={cn(
                            "group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                            isActive
                              ? "bg-muted/60 text-foreground"
                              : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                          )}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit();
                                if (e.key === "Escape") {
                                  setEditingId(null);
                                  setDraft("");
                                }
                              }}
                              onBlur={commitEdit}
                              className="flex-1 rounded border border-primary/50 bg-background px-1.5 py-0.5 text-sm focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => handleSelect(c.id)}
                              className="flex flex-1 flex-col items-start overflow-hidden text-left"
                            >
                              <span className={cn(
                                "w-full truncate",
                                isActive ? "font-medium" : "font-normal"
                              )}>
                                {c.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground/60">
                                {timeAgo(c.updatedAt)}
                              </span>
                            </button>
                          )}

                          {!isEditing && (
                            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(c.id, c.title);
                                }}
                                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                                aria-label="Rename conversation"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteConversation(c.id);
                                }}
                                className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                                aria-label="Delete conversation"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          )}

                          {isEditing && (
                            <button
                              onClick={commitEdit}
                              className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
                              aria-label="Save name"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
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

      {/* Footer — user + theme */}
      <div className="mt-auto border-t border-border/50 p-3">
        {isAuthed && localUser ? (
          <button
            onClick={() => { setView("profile"); onNavigate?.(); }}
            className="mb-2 flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted/50"
          >
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
              style={{ background: localUser.avatarColor }}
            >
              {localUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{localUser.name}</div>
              <div className="truncate text-[10px] text-muted-foreground">{localUser.email}</div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => { setView("login"); onNavigate?.(); }}
            className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg spyro-bg-gradient py-2 text-xs font-medium text-white"
          >
            <UserIcon className="h-3.5 w-3.5" />
            Sign In
          </button>
        )}
        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

export function SidebarCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
      aria-label="Close sidebar"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
