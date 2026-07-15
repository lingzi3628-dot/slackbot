"use client";

import { Menu, Plus, Eraser, Download, Globe, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelBadge } from "./model-badge";
import { useChatStore } from "@/store/chat-store";
import { SPYRO_MODELS, type SpyroModelId } from "@/lib/spyro-engine";
import { cn } from "@/lib/utils";
import * as React from "react";

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  onNewChat: () => void;
  onExport?: () => void;
  webSearch?: boolean;
  onToggleWebSearch?: () => void;
  model?: SpyroModelId;
  onModelChange?: (m: SpyroModelId) => void;
  godMode?: boolean;
  onToggleGodMode?: () => void;
}

export function ChatHeader({
  onOpenSidebar,
  onNewChat,
  onExport,
  webSearch,
  onToggleWebSearch,
  model,
  onModelChange,
  godMode,
  onToggleGodMode,
}: ChatHeaderProps) {
  const activeId = useChatStore((s) => s.activeId);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const conversations = useChatStore((s) => s.conversations);
  const active = conversations.find((c) => c.id === activeId);
  const canExport = !!active && active.messages.length > 0;

  const [modelOpen, setModelOpen] = React.useState(false);
  const currentModel = SPYRO_MODELS.find((m) => m.id === model) ?? SPYRO_MODELS[0];

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-1 border-b border-border/40 bg-background/70 pl-safe pr-safe pt-safe backdrop-blur-2xl sm:gap-2 sm:px-4">
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
        {/* Model selector — pill button */}
        {onModelChange && (
          <div className="relative">
            <button
              onClick={() => setModelOpen((v) => !v)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Select model"
            >
              <span className="hidden sm:inline">{currentModel.label.replace("SPYRO V1 ", "")}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", modelOpen && "rotate-180")} />
            </button>
            {modelOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setModelOpen(false)}
                />
                <div className="absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-xl border border-border/60 bg-popover p-1 shadow-2xl">
                  {SPYRO_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onModelChange(m.id);
                        setModelOpen(false);
                      }}
                      className={cn(
                        "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50",
                        m.id === model && "bg-primary/10"
                      )}
                    >
                      <span className={cn(
                        "text-sm",
                        m.id === model ? "font-medium text-primary" : "font-medium"
                      )}>
                        {m.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{m.description}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Web search toggle — pill */}
        {onToggleWebSearch && (
          <button
            onClick={onToggleWebSearch}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              webSearch
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            aria-label="Toggle web search"
            title={webSearch ? "Web search ON" : "Web search OFF"}
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        )}

        {/* God Mode toggle — lightning pill */}
        {onToggleGodMode && (
          <button
            onClick={onToggleGodMode}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
              godMode
                ? "spyro-bg-gradient text-primary-foreground spyro-glow"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            aria-label="Toggle God Mode"
            title={godMode ? "God Mode ON — multi-agent collaboration" : "God Mode OFF"}
          >
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">God Mode</span>
          </button>
        )}

        {canExport && onExport && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            aria-label="Export conversation"
            title="Export conversation"
            className="h-8 w-8"
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
            className="h-8 w-8"
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
