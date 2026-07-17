"use client";

import { Zap, Clock, Webhook, Mail } from "lucide-react";
import { PlaceholderPage } from "./placeholder-page";

export function AutomationPage() {
  return (
    <PlaceholderPage
      icon={Zap}
      title="Automation"
      description="Let AI execute repetitive work. Trigger workflows on schedule, webhook, email, file upload or calendar event."
      bullets={[
        "Triggers: manual, schedule, webhook, email",
        "Workflow blocks: AI, condition, loop, delay",
        "Integrations: Slack, GitHub, Discord, email",
        "Execution logs & retry queue",
        "Error handling & monitoring dashboard",
        "Visual flow builder",
      ]}
      ctaLabel="Try God Mode"
      ctaView="apps"
      accent="from-violet-500 to-cyan-500"
    />
  );
}
