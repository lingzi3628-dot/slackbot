"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSpyroChat } from "@/hooks/use-spyro-chat";
import { useChatStore } from "@/store/chat-store";
import { ChatHeader } from "@/components/spyro/chat-header";
import { ChatInput } from "@/components/spyro/chat-input";
import { ChatMessages } from "@/components/spyro/chat-messages";
import {
  SidebarContent,
  SidebarCloseButton,
} from "@/components/spyro/chat-sidebar";

export default function Home() {
  const { send, stop, regenerate } = useSpyroChat();
  const createConversation = useChatStore((s) => s.createConversation);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch with the persisted zustand store.
  React.useEffect(() => setMounted(true), []);

  const handleSend = (text: string) => {
    void send(text);
  };

  const handleNewChat = () => {
    createConversation();
    setMobileOpen(false);
  };

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Ambient ember background */}
      <EmberBackground />

      {/* Desktop sidebar */}
      <aside className="relative z-10 hidden w-72 shrink-0 overflow-hidden border-r border-border bg-sidebar/60 backdrop-blur-xl lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[300px] border-border bg-sidebar p-0"
        >
          <SheetTitle className="sr-only">Conversations</SheetTitle>
          <SidebarCloseButton onClose={() => setMobileOpen(false)} />
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <ChatHeader
          onOpenSidebar={() => setMobileOpen(true)}
          onNewChat={handleNewChat}
        />

        {mounted ? (
          <ChatMessages
            onPickSuggestion={handleSend}
            onRegenerate={() => void regenerate()}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <span className="text-sm">Waking the dragon…</span>
            </div>
          </div>
        )}

        <ChatInput onSend={handleSend} onStop={stop} />
      </div>
    </div>
  );
}

/** Subtle floating ember particles for atmosphere. */
function EmberBackground() {
  const embers = React.useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${(i * 7.3 + 5) % 100}%`,
        delay: `${(i * 1.7) % 12}s`,
        duration: `${10 + (i % 6) * 2}s`,
        size: `${2 + (i % 3)}px`,
      })),
    []
  );
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Radial warm glow at the top */}
      <div
        className="absolute -top-1/3 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 22%, transparent) 0%, transparent 70%)",
        }}
      />
      {/* Floating embers */}
      {embers.map((e) => (
        <span
          key={e.id}
          className="absolute bottom-0 rounded-full bg-primary/60"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            animation: `drift ${e.duration} linear ${e.delay} infinite`,
            boxShadow: "0 0 8px color-mix(in oklch, var(--primary) 80%, transparent)",
          }}
        />
      ))}
    </div>
  );
}
