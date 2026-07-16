"use client";

import { BarChart3, TrendingUp, DollarSign, Clock } from "lucide-react";
import { PlaceholderPage } from "./placeholder-page";

export function AnalyticsPage() {
  return (
    <PlaceholderPage
      icon={BarChart3}
      title="Analytics"
      description="Understand your productivity, AI usage and costs. Charts, insights and recommendations to help you work smarter."
      bullets={[
        "User productivity & saved time",
        "AI usage broken down by model",
        "Cost tracking & budget alerts",
        "Automation success rates",
        "Knowledge growth over time",
        "Agent performance metrics",
      ]}
      ctaLabel="Start a chat"
      ctaView="chat"
      accent="from-emerald-500 to-cyan-500"
    />
  );
}
