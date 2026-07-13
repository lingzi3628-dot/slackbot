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
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore, type View } from "@/store/ui-store";
import { ModelBadge } from "./model-badge";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarContentProps {
  onNavigate?: () => void;
}

const NAV_ITEMS: { view: View; label: string; icon: typeof Flame }[] = [
  { view: "chat", label: "Chat", icon: MessageCircle },
  { view: "integrations", label: "Integrations", icon: Plug },
  { view: "settings", label: "Settings", icon: SettingsIcon },
  { view: "about", label: "About", icon: Info },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
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

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");

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
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4">
        <ModelBadge size="sm" showTagline />
      </div>

      {/* Navigation */}
      <div className="px-3 pb-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                activeView === item.view
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* New chat + conversation list (only in chat view) */}
      {activeView === "chat" && (
        <>
          <div className="px-3">
            <Button
              onClick={handleNew}
              className="w-full justify-start gap-2 spyro-bg-gradient text-primary-foreground hover:spyro-glow"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New chat
            </Button>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto px-2 pb-2">
            <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Conversations
            </div>
            {conversations.length === 0 ? (
              <div className="mx-2 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                <Flame className="mx-auto mb-2 h-5 w-5 text-primary/60" />
                No chats yet. Start a new conversation to wake the dragon.
              </div>
            ) : (
              <ul className="space-y-0.5">
                <AnimatePresence initial={false}>
                  {conversations.map((c) => {
                    const isActive = c.id === activeId;
                    const isEditing = editingId === c.id;
                    return (
                      <motion.li
                        key={c.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                      >
                        <div
                          className={cn(
                            "group relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
                              <span className="w-full truncate font-medium">
                                {c.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground/80">
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

      {/* Footer */}
      <div className="mt-auto border-t border-border p-3">
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
