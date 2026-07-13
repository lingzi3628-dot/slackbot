/**
 * Integration framework — common types for all connectors
 * (Telegram, Discord, Slack, future platforms).
 */

export type IntegrationStatus = "connected" | "disconnected" | "needs_config";

export interface IntegrationInfo {
  /** Unique id, e.g. "telegram". */
  id: string;
  /** Human-readable name, e.g. "Telegram". */
  name: string;
  /** One-line description. */
  description: string;
  /** Icon (emoji for simplicity — integrations can override). */
  icon: string;
  /** Whether the integration is ready (has its required env vars). */
  status: IntegrationStatus;
  /** Setup instructions shown in the UI + docs. */
  setupUrl: string;
  /** Where the webhook lives (relative to the API root). */
  webhookPath: string;
}

/**
 * Returns the list of all registered integrations + their live status
 * (based on whether the required environment variables are set).
 */
export function getIntegrations(): IntegrationInfo[] {
  return [
    {
      id: "telegram",
      name: "Telegram",
      description:
        "Chat with SPYRO V1 directly in Telegram. Supports /start, /new, /help.",
      icon: "✈️",
      status: process.env.TELEGRAM_BOT_TOKEN ? "connected" : "needs_config",
      setupUrl: "/docs/integrations#telegram",
      webhookPath: "/api/telegram/webhook",
    },
    {
      id: "discord",
      name: "Discord",
      description: "Coming soon — invite SPYRO V1 to your Discord server.",
      icon: "🎮",
      status: "disconnected",
      setupUrl: "/docs/integrations#discord",
      webhookPath: "/api/discord/webhook",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Coming soon — add SPYRO V1 as a Slack app.",
      icon: "💼",
      status: "disconnected",
      setupUrl: "/docs/integrations#slack",
      webhookPath: "/api/slack/webhook",
    },
  ];
}
