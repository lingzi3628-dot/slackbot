"use client";

import { motion } from "framer-motion";
import { Moon, Sun, Monitor, Download, Trash2, Smartphone } from "lucide-react";
import { useTheme } from "next-themes";
import { useChatStore } from "@/store/chat-store";
import { exportAllConversationsAsJson } from "@/lib/export";
import { useToast } from "@/hooks/use-toast";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const conversations = useChatStore((s) => s.conversations);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const { canInstall, promptInstall } = usePwaInstall();
  const { toast } = useToast();

  const themeOptions: { key: "system" | "dark" | "light"; label: string; icon: typeof Moon }[] = [
    { key: "system", label: "System", icon: Monitor },
    { key: "dark", label: "Dark", icon: Moon },
    { key: "light", label: "Light", icon: Sun },
  ];

  const clearAll = () => {
    if (conversations.length === 0) return;
    if (!confirm(`Delete all ${conversations.length} conversations?`)) return;
    conversations.forEach((c) => deleteConversation(c.id));
    toast({ title: "All conversations cleared" });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize your SPYRO V1 experience.
        </p>
      </motion.div>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTheme(opt.key)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                (theme === opt.key || (theme === "system" && opt.key === "system"))
                  ? "border-primary bg-primary/5 spyro-glow"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <opt.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Data */}
      <Section title="Data">
        <button
          onClick={() => exportAllConversationsAsJson(conversations)}
          disabled={conversations.length === 0}
          className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium">Export all conversations</div>
            <div className="text-xs text-muted-foreground">
              {conversations.length} conversation{conversations.length === 1 ? "" : "s"} → JSON
            </div>
          </div>
        </button>
        <button
          onClick={clearAll}
          disabled={conversations.length === 0}
          className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-destructive/10 hover:border-destructive/40 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          <div className="flex-1">
            <div className="text-sm font-medium">Clear all conversations</div>
            <div className="text-xs text-muted-foreground">
              Permanently delete all chats
            </div>
          </div>
        </button>
      </Section>

      {/* App */}
      <Section title="App">
        {canInstall && (
          <button
            onClick={promptInstall}
            className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
          >
            <Smartphone className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="text-sm font-medium">Install app</div>
              <div className="text-xs text-muted-foreground">
                Add SPYRO V1 to your home screen
              </div>
            </div>
          </button>
        )}
        <div className="flex w-full items-center gap-3 rounded-xl border border-border p-3">
          <div className="flex-1">
            <div className="text-sm font-medium">Version</div>
            <div className="text-xs text-muted-foreground">SPYRO V1 · 2.0.0</div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
