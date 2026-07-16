"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageCircle, Bot, Settings,
  Home, FolderKanban, BookOpen,
  FileText, BarChart3, Zap, LayoutGrid, ArrowRight, Inbox,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore, type View } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof Search;
  category: "Navigate" | "Conversations" | "Actions";
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const conversations = useChatStore((s) => s.conversations);
  const setActive = useChatStore((s) => s.setActive);
  const setView = useUIStore((s) => s.setView);

  // ⌘K / Ctrl+K to toggle
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onkeydown);
  }, []);

  // Focus input when opened
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build command items
  const items: CommandItem[] = React.useMemo(() => {
    const navItems: CommandItem[] = [
      { id: "nav-home", label: "Home", description: "Your command center", icon: Home, category: "Navigate", action: () => { setView("home"); setOpen(false); }, keywords: ["home", "dashboard", "start"] },
      { id: "nav-projects", label: "Projects", description: "Organize your work", icon: FolderKanban, category: "Navigate", action: () => { setView("projects"); setOpen(false); }, keywords: ["project", "workspace", "folder"] },
      { id: "nav-chat", label: "Chats", description: "AI conversations", icon: MessageCircle, category: "Navigate", action: () => { setView("chat"); setOpen(false); }, keywords: ["chat", "message", "ask", "conversation"] },
      { id: "nav-inbox", label: "Communication Center", description: "WhatsApp & messaging inbox", icon: Inbox, category: "Navigate", action: () => { setView("communication"); setOpen(false); }, keywords: ["whatsapp", "inbox", "communication", "message", "contact", "agent"] },
      { id: "nav-knowledge", label: "Knowledge", description: "Your second brain", icon: BookOpen, category: "Navigate", action: () => { setView("knowledge"); setOpen(false); }, keywords: ["knowledge", "docs", "notes", "memory"] },
      { id: "nav-agents", label: "Agents", description: "Persistent AI workers", icon: Bot, category: "Navigate", action: () => { setView("agents"); setOpen(false); }, keywords: ["agent", "bot", "assistant", "worker"] },
      { id: "nav-files", label: "Files", description: "Everything you upload", icon: FileText, category: "Navigate", action: () => { setView("files"); setOpen(false); }, keywords: ["file", "upload", "media", "asset"] },
      { id: "nav-apps", label: "Apps", description: "Studios & tools", icon: LayoutGrid, category: "Navigate", action: () => { setView("apps"); setOpen(false); }, keywords: ["app", "studio", "tool", "image", "code", "voice"] },
      { id: "nav-automation", label: "Automation", description: "AI executes repetitive work", icon: Zap, category: "Navigate", action: () => { setView("automation"); setOpen(false); }, keywords: ["automation", "workflow", "trigger", "schedule"] },
      { id: "nav-analytics", label: "Analytics", description: "Productivity & usage", icon: BarChart3, category: "Navigate", action: () => { setView("analytics"); setOpen(false); }, keywords: ["analytics", "stats", "usage", "chart"] },
      { id: "nav-settings", label: "Settings", description: "Preferences", icon: Settings, category: "Navigate", action: () => { setView("settings"); setOpen(false); }, keywords: ["settings", "preferences", "config"] },
    ];

    const convoItems: CommandItem[] = conversations.slice(0, 8).map((c) => ({
      id: `convo-${c.id}`,
      label: c.title,
      description: `${c.messages.length} messages`,
      icon: MessageCircle,
      category: "Conversations",
      action: () => { setActive(c.id); setView("chat"); setOpen(false); },
      keywords: [c.title.toLowerCase()],
    }));

    return [...navItems, ...convoItems];
  }, [conversations, setActive, setView]);

  // Filter by query
  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((item) =>
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q))
    );
  }, [items, query]);

  // Group by category
  const grouped = React.useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  // Flat list for keyboard navigation
  const flatList = filtered;

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatList[selectedIndex]?.action();
    }
  };

  // Scroll selected item into view
  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Palette */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative w-full max-w-xl overflow-hidden rounded-[28px] shadow-elevated"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-5 py-4">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={onKeyDown}
                placeholder="Search conversations, navigate, run commands…"
                className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <kbd className="shrink-0 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[400px] overflow-y-auto p-2">
              {flatList.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No results for "{query}"</p>
                </div>
              ) : (
                Object.entries(grouped).map(([category, items]) => (
                  <div key={category} className="mb-2">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                      {category}
                    </div>
                    {items.map((item) => {
                      runningIndex++;
                      const idx = runningIndex;
                      const isSelected = idx === selectedIndex;
                      return (
                        <button
                          key={item.id}
                          data-index={idx}
                          onClick={item.action}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            isSelected ? "bg-secondary" : "hover:bg-secondary/50"
                          )}
                        >
                          <span className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                            isSelected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                          )}>
                            <item.icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{item.label}</div>
                            {item.description && (
                              <div className="truncate text-xs text-muted-foreground">{item.description}</div>
                            )}
                          </div>
                          {isSelected && (
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/50">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-secondary px-1 py-0.5">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-secondary px-1 py-0.5">↵</kbd>
                  Select
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/50">SPYRO OS</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
