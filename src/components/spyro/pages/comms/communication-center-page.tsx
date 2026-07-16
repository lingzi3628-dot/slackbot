"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, LayoutDashboard, Inbox as InboxIcon, Users, Bot,
  Plus, Power, RefreshCw, AlertCircle, Loader2, CheckCircle2,
} from "lucide-react";
import { useCommsStore, type CommsTab } from "@/store/comms-store";
import { cn } from "@/lib/utils";
import { ConnectWizard } from "./connect-wizard";
import { CommsDashboard } from "./comms-dashboard";
import { CommsInbox } from "./comms-inbox";
import { CommsContacts } from "./comms-contacts";
import { CommsAgents } from "./comms-agents";

const TABS: { id: CommsTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "agents", label: "Agents", icon: Bot },
];

export function CommunicationCenter() {
  const channelId = useCommsStore((s) => s.channelId);
  const connection = useCommsStore((s) => s.connection);
  const setConnection = useCommsStore((s) => s.setConnection);
  const setChannelId = useCommsStore((s) => s.setChannelId);
  const setDashboard = useCommsStore((s) => s.setDashboard);
  const setConversations = useCommsStore((s) => s.setConversations);
  const setContacts = useCommsStore((s) => s.setContacts);
  const setAgents = useCommsStore((s) => s.setAgents);
  const activeTab = useCommsStore((s) => s.activeTab);
  const setActiveTab = useCommsStore((s) => s.setActiveTab);

  const [showWizard, setShowWizard] = React.useState(false);
  const [bootstrapping, setBootstrapping] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  // Bootstrap: check if there's an existing connection for this browser.
  // In demo mode there isn't, so we land on the disconnected empty state.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      // Try to restore a previous channel id from localStorage.
      try {
        const stored = localStorage.getItem("spyro-comms-channel");
        if (stored) {
          const res = await fetch(`/api/comms/status?channelId=${stored}&channelType=whatsapp`, { cache: "no-store" });
          const data = await res.json();
          if (data.status === "connected") {
            setChannelId(stored);
            setConnection(data);
            await loadAll(stored);
          }
        }
      } catch { /* ignore */ }
      if (!cancelled) setBootstrapping(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const loadAll = React.useCallback(async (id: string) => {
    const [dash, chats, contacts, agents] = await Promise.all([
      fetch(`/api/comms/dashboard?channelId=${id}&channelType=whatsapp`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/comms/chats?channelId=${id}&channelType=whatsapp`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/comms/contacts?channelId=${id}&channelType=whatsapp`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/comms/agents`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    setDashboard(dash);
    setConversations(chats.conversations ?? []);
    setContacts(contacts.contacts ?? []);
    setAgents(agents.agents ?? []);
  }, [setDashboard, setConversations, setContacts, setAgents]);

  const handleConnected = React.useCallback(async () => {
    setShowWizard(false);
    // Read the latest channelId from the store — the closure may be stale
    // because the wizard just set it.
    const id = useCommsStore.getState().channelId;
    if (!id) return;
    // Persist so refresh keeps the connection (demo mode).
    try { localStorage.setItem("spyro-comms-channel", id); } catch { /* ignore */ }
    // Refresh status + load data.
    const res = await fetch(`/api/comms/status?channelId=${id}&channelType=whatsapp`, { cache: "no-store" });
    const data = await res.json();
    setConnection(data);
    await loadAll(id);
  }, [setConnection, loadAll]);

  const handleSync = React.useCallback(async () => {
    if (!channelId) return;
    setSyncing(true);
    try {
      await fetch("/api/comms/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelId, channelType: "whatsapp" }),
      });
      await loadAll(channelId);
    } finally {
      setSyncing(false);
    }
  }, [channelId, loadAll]);

  const handleDisconnect = React.useCallback(async () => {
    if (!channelId) return;
    await fetch("/api/comms/disconnect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ channelId, channelType: "whatsapp" }),
    });
    try { localStorage.removeItem("spyro-comms-channel"); } catch { /* ignore */ }
    setChannelId(null);
    setConnection(null);
    setDashboard(null);
    setConversations([]);
    setContacts([]);
  }, [channelId, setChannelId, setConnection, setDashboard, setConversations, setContacts]);

  // ── Bootstrapping ─────────────────────────────────────────────────
  if (bootstrapping) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Loading Communication Center…</span>
        </div>
      </div>
    );
  }

  // ── Disconnected empty state ──────────────────────────────────────
  const isConnected = connection?.status === "connected";

  if (!isConnected) {
    return (
      <div className="ambient-mesh min-h-full">
        {/* Mobile menu button */}
        <div className="sticky top-0 z-20 flex h-12 items-center px-3 lg:hidden">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", metaKey: true }))}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-8 text-center sm:py-16">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-elevated"
          >
            <MessageCircle className="h-9 w-9" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Communication Center
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base"
          >
            Connect WhatsApp and assign AI agents to your conversations. Spyro handles the rest — unified inbox, smart replies, sentiment, escalation and full customer context.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid w-full gap-2 text-left sm:grid-cols-2"
          >
            {[
              "Connect WhatsApp with a single QR scan",
              "Auto-sync chats, contacts and history",
              "Unified inbox with AI summaries & suggested replies",
              "Assign AI agents per channel or contact",
              "Sentiment, escalation & human takeover controls",
              "Channel-agnostic — Telegram, Slack, Email coming next",
            ].map((b) => (
              <div
                key={b}
                className="flex items-start gap-2 rounded-2xl border border-border bg-card/60 p-3 text-xs text-muted-foreground backdrop-blur-sm"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{b}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-8"
          >
            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-6 py-3 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4" />
              Connect WhatsApp
            </button>
          </motion.div>

          <p className="mt-10 text-[11px] uppercase tracking-widest text-muted-foreground/40">
            Powered by Evolution API · End-to-end encrypted
          </p>
        </div>

        <AnimatePresence>
          {showWizard && (
            <ConnectWizard onConnected={handleConnected} onCancel={() => setShowWizard(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Connected workspace ───────────────────────────────────────────
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Tab bar + actions */}
      <div className="flex items-center gap-1 border-b border-border px-3 py-2 sm:px-4">
        <button
          onClick={() => {
            // Dispatch the sidebar toggle shortcut the main app listens for.
            window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", metaKey: true }));
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Open menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <t.icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium transition-colors hover:bg-secondary disabled:opacity-50"
            aria-label="Sync"
          >
            <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
            <span className="hidden sm:inline">{syncing ? "Syncing…" : "Sync"}</span>
          </button>
          <button
            onClick={handleDisconnect}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium text-rose-400 transition-colors hover:bg-rose-500/5"
            aria-label="Disconnect"
          >
            <Power className="h-3 w-3" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Active tab */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {activeTab === "dashboard" && <CommsDashboard onSync={handleSync} />}
        {activeTab === "inbox" && channelId && <CommsInbox channelId={channelId} />}
        {activeTab === "contacts" && <CommsContacts />}
        {activeTab === "agents" && <CommsAgents />}
      </div>
    </div>
  );
}
