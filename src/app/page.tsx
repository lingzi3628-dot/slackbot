"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSpyroChat } from "@/hooks/use-spyro-chat";
import { useChatStore } from "@/store/chat-store";
import { useUIStore } from "@/store/ui-store";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { exportConversationAsMarkdown } from "@/lib/export";
import { ChatHeader } from "@/components/spyro/chat-header";
import { ChatInput } from "@/components/spyro/chat-input";
import { ChatMessages } from "@/components/spyro/chat-messages";
import {
  SidebarContent,
  SidebarCloseButton,
} from "@/components/spyro/chat-sidebar";
import { IntegrationsPage } from "@/components/spyro/pages/integrations-page";
import { SettingsPage } from "@/components/spyro/pages/settings-page";
import { AboutPage } from "@/components/spyro/pages/about-page";
import { AuthPage } from "@/components/spyro/pages/auth-page";
import { useAuthStore } from "@/store/auth-store";
import { useSupabaseSync } from "@/hooks/use-supabase-sync";

export default function Home() {
  const { send, stop, regenerate, generateImage, webSearch, setWebSearch } = useSpyroChat();
  const createConversation = useChatStore((s) => s.createConversation);
  const activeView = useUIStore((s) => s.activeView);
  const setView = useUIStore((s) => s.setView);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const inputFocusRef = React.useRef<() => void>(() => {});

  React.useEffect(() => setMounted(true), []);

  // Init Supabase auth (no-op if not configured) + cloud sync.
  const initAuth = useAuthStore((s) => s.init);
  React.useEffect(() => { void initAuth(); }, [initAuth]);
  useSupabaseSync();

  const handleSend = (text: string) => {
    void send(text, { webSearch });
  };

  const handleNewChat = () => {
    createConversation();
    setView("chat");
    setMobileOpen(false);
  };

  const handleExport = () => {
    const active = useChatStore.getState().getActive();
    if (active && active.messages.length > 0) {
      exportConversationAsMarkdown(active);
    }
  };

  const handleImagine = (prompt: string) => {
    void generateImage(prompt);
  };

  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onFocusInput: () => inputFocusRef.current(),
    onToggleSidebar: () => setMobileOpen((v) => !v),
    onCloseSidebar: () => setMobileOpen(false),
  });

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-background">
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
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarCloseButton onClose={() => setMobileOpen(false)} />
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {activeView === "chat" ? (
          <>
            <ChatHeader
              onOpenSidebar={() => setMobileOpen(true)}
              onNewChat={handleNewChat}
              onExport={handleExport}
              webSearch={webSearch}
              onToggleWebSearch={() => setWebSearch(!webSearch)}
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
            <ChatInput
              onSend={handleSend}
              onStop={stop}
              onImagine={handleImagine}
              registerFocus={(fn) => (inputFocusRef.current = fn)}
            />
          </>
        ) : (
          <>
            {/* Mobile header for non-chat views */}
            <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 pl-safe pr-safe pt-safe backdrop-blur-xl sm:px-4">
              <button
                onClick={() => setMobileOpen(true)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                aria-label="Open menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <h1 className="flex-1 text-base font-semibold capitalize">
                {activeView}
              </h1>
            </header>
            <div className="flex-1 overflow-y-auto">
              {activeView === "integrations" && <IntegrationsPage />}
              {activeView === "settings" && <SettingsPage />}
              {activeView === "auth" && <AuthPage />}
              {activeView === "about" && <AboutPage />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
      <div
        className="absolute -top-1/3 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 22%, transparent) 0%, transparent 70%)",
        }}
      />
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
