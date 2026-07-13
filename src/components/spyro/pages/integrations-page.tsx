"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Power,
  PowerOff,
  ExternalLink,
} from "lucide-react";
import { useIntegrationsStore, type UserIntegration } from "@/store/integrations-store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function IntegrationsPage() {
  const [showForm, setShowForm] = React.useState(false);
  const integrations = useIntegrationsStore((s) => s.integrations);
  const addIntegration = useIntegrationsStore((s) => s.addIntegration);
  const updateIntegration = useIntegrationsStore((s) => s.updateIntegration);
  const removeIntegration = useIntegrationsStore((s) => s.removeIntegration);
  const { toast } = useToast();

  const handleConnect = async (int: UserIntegration) => {
    updateIntegration(int.id, { connected: true });
    toast({
      title: "Connecting…",
      description: `Registering webhook for ${int.label}…`,
    });
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
          description: `${data.bot?.username ?? int.label} is live. Message it on Telegram!`,
        });
      } else {
        updateIntegration(int.id, { connected: false });
        toast({
          title: "Connection failed",
          description: data.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      updateIntegration(int.id, { connected: false });
      toast({
        title: "Connection failed",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async (int: UserIntegration) => {
    try {
      await fetch("/api/telegram/unset-webhook", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: int.token }),
      });
      updateIntegration(int.id, { connected: false });
      toast({ title: "Disconnected", description: `${int.label} is offline.` });
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleDelete = (int: UserIntegration) => {
    if (int.connected) {
      void handleDisconnect(int);
    }
    removeIntegration(int.id);
    toast({ title: "Removed", description: `${int.label} deleted.` });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect SPYRO V1 to your own chat platforms. Add a bot token, click
          connect, and start chatting.
        </p>
      </motion.div>

      {/* Telegram section */}
      <Section
        icon="✈️"
        title="Telegram"
        description="Chat with SPYRO V1 in Telegram. Create a bot with @BotFather, paste the token here."
      >
        <div className="space-y-3">
          <AnimatePresence>
            {integrations
              .filter((i) => i.platform === "telegram")
              .map((int) => (
                <IntegrationCard
                  key={int.id}
                  integration={int}
                  onConnect={() => void handleConnect(int)}
                  onDisconnect={() => void handleDisconnect(int)}
                  onDelete={() => handleDelete(int)}
                />
              ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showForm ? (
            <AddBotForm
              onCancel={() => setShowForm(false)}
              onAdd={(label, token) => {
                addIntegration({
                  platform: "telegram",
                  label,
                  token,
                  connected: false,
                });
                setShowForm(false);
                toast({
                  title: "Bot added",
                  description: "Click Connect to activate it.",
                });
              }}
            />
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowForm(true)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add Telegram bot
            </motion.button>
          )}
        </AnimatePresence>
      </Section>

      <Section
        icon="🎮"
        title="Discord"
        description="Coming soon — invite SPYRO V1 to your Discord server."
        soon
      />
      <Section
        icon="💼"
        title="Slack"
        description="Coming soon — add SPYRO V1 as a Slack app."
        soon
      />
    </div>
  );
}

function Section({
  icon,
  title,
  description,
  children,
  soon,
}: {
  icon: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  soon?: boolean;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-xl">
          {icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{title}</h2>
            {soon && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  onDelete,
}: {
  integration: UserIntegration;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
    >
      <div
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
          integration.connected
            ? "bg-primary/15 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {integration.connected ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <AlertCircle className="h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{integration.label}</span>
          {integration.botUsername && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {integration.botUsername}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {integration.connected ? "Live" : "Not connected"}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {integration.connected ? (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <PowerOff className="h-3.5 w-3.5" />
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-2.5 py-1.5 text-xs text-primary-foreground transition-all hover:spyro-glow"
          >
            <Power className="h-3.5 w-3.5" />
            Connect
          </button>
        )}
        <button
          onClick={onDelete}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function AddBotForm({
  onAdd,
  onCancel,
}: {
  onAdd: (label: string, token: string) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = React.useState("");
  const [token, setToken] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const testAndAdd = () => {
    if (!label.trim() || !token.trim()) {
      setError("Both fields are required.");
      return;
    }
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(token.trim())) {
      setError("Invalid token format. It should look like 123456789:ABCdef...");
      return;
    }
    setError(null);
    onAdd(label.trim(), token.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-xl border border-border bg-card p-4"
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Label (any name you like)
          </label>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My SPYRO bot"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary/60 focus:outline-none"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Bot token (from @BotFather)
          </label>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs focus:border-primary/60 focus:outline-none"
            type="password"
          />
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            Get a token from{" "}
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer noopener"
              className="text-primary underline underline-offset-2"
            >
              @BotFather
            </a>{" "}
            on Telegram
          </p>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={testAndAdd}
            className="flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            <Send className="h-3.5 w-3.5" />
            Add bot
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}
