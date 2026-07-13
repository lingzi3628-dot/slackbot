"use client";

import * as React from "react";
import { Plug, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "connected" | "disconnected" | "needs_config";
  setupUrl: string;
  webhookPath: string;
}

/**
 * Integrations panel — shows the live status of all registered integrations
 * (Telegram, Discord, Slack, …) in the sidebar.
 */
export function IntegrationsPanel() {
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((data) => setIntegrations(data.integrations ?? []))
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || integrations.length === 0) return null;

  const connected = integrations.filter((i) => i.status === "connected").length;

  return (
    <div className="px-3 pb-2">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Plug className="h-3 w-3" />
        Integrations
        {connected > 0 && (
          <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] text-primary">
            {connected} live
          </span>
        )}
      </div>
      <div className="space-y-1">
        {integrations.map((int) => (
          <div
            key={int.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm",
              int.status === "connected"
                ? "bg-primary/5"
                : "opacity-60"
            )}
          >
            <span className="text-base">{int.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-medium">{int.name}</span>
                {int.status === "connected" ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />
                ) : int.status === "needs_config" ? (
                  <AlertCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
                ) : null}
              </div>
              <p className="truncate text-[10px] text-muted-foreground">
                {int.status === "connected"
                  ? "Live"
                  : int.status === "needs_config"
                    ? "Needs setup"
                    : "Coming soon"}
              </p>
            </div>
            {int.status === "needs_config" && (
              <a
                href={int.setupUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={`Set up ${int.name}`}
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
