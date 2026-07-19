"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, CheckCircle2, AlertCircle, Loader2, Send, Power,
  PowerOff, ExternalLink, Key, Globe, Webhook, Copy, Check, MessageCircle,
  Code2, Sparkles,
} from "lucide-react";
import { useIntegrationsStore, type UserIntegration } from "@/store/integrations-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Platform = "telegram" | "discord" | "whatsapp" | "api" | "webhook";

interface PlatformDef {
  id: Platform;
  name: string;
  description: string;
  icon: string;
  color: string;
  setupGuide: string;
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
}

const PLATFORMS: PlatformDef[] = [
  {
    id: "telegram",
    name: "Telegram",
    description: "Chat with SPYRO V1 in Telegram. /start, /new, /help commands.",
    icon: "✈️",
    color: "from-blue-500 to-cyan-600",
    setupGuide: "Create a bot via @BotFather → paste the token here → click Connect.",
    fields: [
      { key: "token", label: "Bot Token", placeholder: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz", type: "password" },
      { key: "label", label: "Label", placeholder: "My SPYRO bot" },
    ],
  },
  {
    id: "discord",
    name: "Discord",
    description: "Add SPYRO V1 to your Discord server as a bot.",
    icon: "🎮",
    color: "from-indigo-500 to-purple-600",
    setupGuide: "Create a bot at discord.com/developers → paste the token → set your server ID.",
    fields: [
      { key: "token", label: "Bot Token", placeholder: "MTA...your-discord-bot-token", type: "password" },
      { key: "serverId", label: "Server ID", placeholder: "123456789012345678" },
      { key: "label", label: "Label", placeholder: "My Discord Server" },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Chat with SPYRO V1 via WhatsApp Cloud API.",
    icon: "💬",
    color: "from-green-500 to-emerald-600",
    setupGuide: "Set up WhatsApp Cloud API at developers.facebook.com → paste your access token + phone number ID.",
    fields: [
      { key: "token", label: "Access Token", placeholder: "EAAG...your-whatsapp-token", type: "password" },
      { key: "phoneId", label: "Phone Number ID", placeholder: "123456789012345" },
      { key: "verifyToken", label: "Verify Token", placeholder: "spyro-verify-123" },
      { key: "label", label: "Label", placeholder: "My WhatsApp Bot" },
    ],
  },
  {
    id: "api",
    name: "API Access",
    description: "Get an API key to integrate SPYRO V1 into your own apps.",
    icon: "🔑",
    color: "from-orange-500 to-red-600",
    setupGuide: "Generate an API key → use it to call POST /api/chat from your code.",
    fields: [
      { key: "label", label: "App Name", placeholder: "My Application" },
    ],
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Send SPYRO V1 replies to any URL (Slack, Zapier, n8n, etc.).",
    icon: "🔗",
    color: "from-amber-500 to-orange-600",
    setupGuide: "Paste your webhook URL → SPYRO will POST replies to it.",
    fields: [
      { key: "url", label: "Webhook URL", placeholder: "https://your-app.com/webhook" },
      { key: "label", label: "Label", placeholder: "Slack #spyro channel" },
    ],
  },
];

export function IntegrationsPage() {
  const integrations = useIntegrationsStore((s) => s.integrations);
  const addIntegration = useIntegrationsStore((s) => s.addIntegration);
  const updateIntegration = useIntegrationsStore((s) => s.updateIntegration);
  const removeIntegration = useIntegrationsStore((s) => s.removeIntegration);
  const { toast } = useToast();

  const [showForm, setShowForm] = React.useState<Platform | null>(null);
  const [formValues, setFormValues] = React.useState<Record<string, string>>({});

  const handleConnect = async (int: UserIntegration) => {
    updateIntegration(int.id, { connected: true });
    toast({ title: "Connecting…", description: `Activating ${int.label}…` });

    if (int.platform === "telegram") {
      try {
        const res = await fetch("/api/telegram/set-webhook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: int.token }),
        });
        const data = await res.json();
        if (data.ok) {
          updateIntegration(int.id, {
            connected: true,
            botUsername: data.bot?.username,
            botName: data.bot?.name,
          });
          toast({
            title: "✅ Connected!",
            description: `${data.bot?.username ?? int.label} is live!`,
          });
        } else {
          updateIntegration(int.id, { connected: false });
          toast({
            title: "Connection failed",
            description: data.error ?? "Unknown error",
            variant: "destructive",
          });
        }
      } catch {
        updateIntegration(int.id, { connected: false });
        toast({ title: "Connection failed", variant: "destructive" });
      }
    } else if (int.platform === "api") {
      // Generate an API key.
      const apiKey = `spyro-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      updateIntegration(int.id, { connected: true, botUsername: apiKey });
      toast({ title: "✅ API Key generated!", description: "Copy it from the card below." });
    } else if (int.platform === "webhook") {
      updateIntegration(int.id, { connected: true });
      toast({ title: "✅ Webhook connected!", description: "Replies will be sent to your URL." });
    } else {
      updateIntegration(int.id, { connected: true });
      toast({ title: "✅ Connected!", description: `${int.label} is now active.` });
    }
  };

  const handleDisconnect = async (int: UserIntegration) => {
    if (int.platform === "telegram") {
      try {
        await fetch("/api/telegram/unset-webhook", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token: int.token }),
        });
      } catch { /* ignore */ }
    }
    updateIntegration(int.id, { connected: false });
    toast({ title: "Disconnected", description: `${int.label} is offline.` });
  };

  const handleDelete = (int: UserIntegration) => {
    if (int.connected) void handleDisconnect(int);
    removeIntegration(int.id);
    toast({ title: "Removed", description: `${int.label} deleted.` });
  };

  const handleAdd = (platform: Platform) => {
    const def = PLATFORMS.find((p) => p.id === platform)!;
    const label = formValues.label || formValues.label || `${def.name} Bot`;
    const token = formValues.token || formValues.url || formValues.phoneId || "";

    addIntegration({
      platform: platform as "telegram",
      label,
      token,
      connected: false,
      // Store extra fields in the token if it's API/webhook.
      ...(platform === "api" && { token: `api-key-pending` }),
      ...(platform === "webhook" && { token: formValues.url || "" }),
    });

    setShowForm(null);
    setFormValues({});
    toast({ title: "Added", description: "Click Connect to activate." });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Integrations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect SPYRO V1 to your favorite platforms and tools.
        </p>
      </motion.div>

      {/* Platform grid */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PLATFORMS.map((platform, i) => {
          const userInts = integrations.filter((i2) => i2.platform === platform.id);
          const hasActive = userInts.some((i2) => i2.connected);
          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="surface-elevated rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <span className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-xl",
                  platform.color
                )}>
                  {platform.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold">{platform.name}</h2>
                    {hasActive && (
                      <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active
                      </span>
                    )}
                    {userInts.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        ({userInts.length})
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{platform.description}</p>
                </div>
              </div>

              {/* Existing integrations for this platform */}
              {userInts.length > 0 && (
                <div className="mt-3 space-y-2">
                  {userInts.map((int) => (
                    <div key={int.id} className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 p-2.5">
                      <span className={cn(
                        "grid h-7 w-7 shrink-0 place-items-center rounded-lg",
                        int.connected ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                      )}>
                        {int.connected ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{int.label}</div>
                        <div className="truncate text-[10px] text-muted-foreground">
                          {int.botUsername || int.token?.slice(0, 20) + "…" || "Not configured"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {int.connected ? (
                          <button
                            onClick={() => handleDisconnect(int)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <PowerOff className="h-3 w-3" /> Off
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnect(int)}
                            className="flex items-center gap-1 rounded-md spyro-bg-gradient px-2 py-1 text-[11px] text-primary-foreground"
                          >
                            <Power className="h-3 w-3" /> Connect
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(int)}
                          className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add button */}
              <button
                onClick={() => { setShowForm(platform.id); setFormValues({}); }}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add {platform.name}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Setup guide */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-elevated rounded-2xl p-5"
        >
          {(() => {
            const platform = PLATFORMS.find((p) => p.id === showForm)!;
            return (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <span className={cn("grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-lg", platform.color)}>
                    {platform.icon}
                  </span>
                  <div>
                    <h2 className="text-base font-bold">Add {platform.name}</h2>
                    <p className="text-[11px] text-muted-foreground">{platform.setupGuide}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {platform.fields.map((field) => (
                    <div key={field.key}>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">{field.label}</label>
                      <input
                        type={field.type || "text"}
                        value={formValues[field.key] || ""}
                        onChange={(e) => setFormValues((v) => ({ ...v, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleAdd(showForm)}
                    className="flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-4 py-2 text-xs font-medium text-primary-foreground"
                  >
                    <Send className="h-3.5 w-3.5" /> Add
                  </button>
                  <button
                    onClick={() => setShowForm(null)}
                    className="rounded-lg px-4 py-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </>
            );
          })()}
        </motion.div>
      )}

      {/* API usage example (if API integration exists) */}
      {integrations.some((i) => (i.platform as string) === "api" && i.connected) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="surface-elevated mt-4 rounded-2xl p-5"
        >
          <div className="mb-2 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">API Usage</h2>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">
            Call SPYRO V1 from your own code:
          </p>
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 text-[12px] text-foreground/90">
            <code>{`fetch("https://slackbot-seven.vercel.app/api/chat", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": "YOUR_API_KEY"
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello SPYRO!" }]
  })
}).then(r => r.text()).then(console.log)`}</code>
          </pre>
        </motion.div>
      )}
    </div>
  );
}
