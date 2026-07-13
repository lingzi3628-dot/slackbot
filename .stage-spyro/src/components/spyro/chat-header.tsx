"use client";

import { Menu, Plus, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelBadge } from "./model-badge";
import { useChatStore } from "@/store/chat-store";

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  onNewChat: () => void;
}

export function ChatHeader({ onOpenSidebar, onNewChat }: ChatHeaderProps) {
  const activeId = useChatStore((s) => s.activeId);
  const clearMessages = useChatStore((s) => s.clearMessages);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-2 backdrop-blur-xl sm:px-4">
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

      <div className="flex items-center gap-1">
        {activeId && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 sm:inline-flex"
            onClick={() => clearMessages(activeId)}
          >
            <Eraser className="h-4 w-4" />
            Clear
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
