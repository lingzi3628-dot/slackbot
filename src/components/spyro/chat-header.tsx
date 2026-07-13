"use client";

import { Menu, Plus, Eraser, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelBadge } from "./model-badge";
import { useChatStore } from "@/store/chat-store";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  onNewChat: () => void;
  onExport?: () => void;
  webSearch?: boolean;
  onToggleWebSearch?: () => void;
}

export function ChatHeader({
  onOpenSidebar,
  onNewChat,
  onExport,
  webSearch,
  onToggleWebSearch,
}: ChatHeaderProps) {
  const activeId = useChatStore((s) => s.activeId);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const conversations = useChatStore((s) => s.conversations);
  const active = conversations.find((c) => c.id === activeId);
  const canExport = !!active && active.messages.length > 0;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-border bg-background/80 pl-safe pr-safe pt-safe backdrop-blur-xl sm:gap-2 sm:px-4">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open conversations"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center justify-center lg:justify-start">
        <ModelBadge size="sm" />
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1">
        {/* Web search toggle */}
        {onToggleWebSearch && (
          <button
            onClick={onToggleWebSearch}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
              webSearch
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-label="Toggle web search"
            title={webSearch ? "Web search ON" : "Web search OFF"}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        )}
        {canExport && onExport && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            aria-label="Export conversation"
            title="Export conversation"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        {activeId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => clearMessages(activeId)}
            aria-label="Clear conversation"
            title="Clear conversation"
          >
            <Eraser className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onNewChat}
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
