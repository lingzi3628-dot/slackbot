"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  MessageSquarePlus,
  Pencil,
  Trash2,
  X,
  Github,
  Flame,
  Download,
  Smartphone,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { exportAllConversationsAsJson } from "@/lib/export";
import { ModelBadge } from "./model-badge";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SidebarContentProps {
  onNavigate?: () => void;
}

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

  const { canInstall, promptInstall } = usePwaInstall();

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

  const handleNew = () => {
    createConversation();
    onNavigate?.();
  };

  const handleSelect = (id: string) => {
    setActive(id);
    onNavigate?.();
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4">
        <ModelBadge size="sm" showTagline />
      </div>

      {/* New chat */}
      <div className="px-3">
        <Button
          onClick={handleNew}
          className="w-full justify-start gap-2 spyro-bg-gradient text-primary-foreground hover:spyro-glow"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Conversation list */}
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

      {/* Footer */}
      <div className="border-t border-border p-3">
        {conversations.length > 0 && (
          <button
            onClick={() => exportAllConversationsAsJson(conversations)}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Export all conversations as JSON"
          >
            <Download className="h-3.5 w-3.5" />
            Export all ({conversations.length})
          </button>
        )}
        {canInstall ? (
          <Button
            onClick={promptInstall}
            className="mb-2 w-full justify-center gap-2 spyro-bg-gradient text-primary-foreground hover:spyro-glow"
          >
            <Download className="h-4 w-4" />
            Install app
          </Button>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="How to install SPYRO V1 on your phone"
              >
                <Smartphone className="h-3.5 w-3.5" />
                Install on phone
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="center"
              className="w-[260px] text-sm"
            >
              <div className="space-y-2">
                <p className="font-semibold text-foreground">
                  Install SPYRO V1 on your phone
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">iPhone (Safari):</span>{" "}
                  Tap the Share icon → <em>Add to Home Screen</em>.
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Android (Chrome):</span>{" "}
                  Menu (⋮) → <em>Install app</em> / <em>Add to Home screen</em>.
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Works offline once installed. No app store needed.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        )}
        <div className="flex items-center justify-between">
          <a
            href="https://github.com/meshmusic2836-lab/slackbot"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub repo
          </a>
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
