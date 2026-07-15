"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Zap,
  Image as ImageIcon,
  Flame,
  TrendingUp,
  Clock,
  Mic,
  Globe,
  Database,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useIntegrationsStore } from "@/store/integrations-store";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const conversations = useChatStore((s) => s.conversations);
  const integrations = useIntegrationsStore((s) => s.integrations);

  // Compute stats.
  const allMessages = conversations.flatMap((c) => c.messages);
  const userMessages = allMessages.filter((m) => m.role === "user");
  const assistantMessages = allMessages.filter((m) => m.role === "assistant");
  const imageMessages = allMessages.filter((m) => m.type === "image");
  const errorMessages = allMessages.filter((m) => m.error);

  const totalWords = allMessages.reduce(
    (sum, m) => sum + m.content.split(/\s+/).filter(Boolean).length,
    0
  );

  const oldestConv = conversations.length > 0
    ? Math.min(...conversations.map((c) => c.createdAt))
    : null;
  const daysSinceStart = oldestConv
    ? Math.max(1, Math.ceil((Date.now() - oldestConv) / (1000 * 60 * 60 * 24)))
    : 0;

  const connectedIntegrations = integrations.filter((i) => i.connected).length;

  const stats = [
    {
      label: "Conversations",
      value: conversations.length,
      icon: MessageCircle,
      color: "text-primary",
    },
    {
      label: "Messages Sent",
      value: userMessages.length,
      icon: Zap,
      color: "text-primary",
    },
    {
      label: "Responses",
      value: assistantMessages.length,
      icon: Flame,
      color: "text-primary",
    },
    {
      label: "Images Generated",
      value: imageMessages.length,
      icon: ImageIcon,
      color: "text-primary",
    },
    {
      label: "Total Words",
      value: totalWords.toLocaleString(),
      icon: TrendingUp,
      color: "text-primary",
    },
    {
      label: "Days Active",
      value: daysSinceStart,
      icon: Clock,
      color: "text-primary",
    },
    {
      label: "Integrations",
      value: `${connectedIntegrations}/${integrations.length}`,
      icon: Globe,
      color: "text-primary",
    },
    {
      label: "Error Rate",
      value: allMessages.length > 0 ? `${((errorMessages.length / allMessages.length) * 100).toFixed(1)}%` : "0%",
      icon: Database,
      color: errorMessages.length > 0 ? "text-destructive" : "text-primary",
    },
  ];

  // Recent activity (last 5 conversations).
  const recentActivity = conversations.slice(0, 5).map((c) => ({
    title: c.title,
    messages: c.messages.length,
    time: new Date(c.updatedAt).toLocaleDateString(),
  }));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your SPYRO V1 usage at a glance.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="surface-elevated rounded-xl p-4"
          >
            <div className="flex items-center gap-2">
              <stat.icon className={cn("h-4 w-4", stat.color)} />
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <div className="mt-2 text-2xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent activity */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Recent Activity
        </h2>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            <Flame className="mx-auto mb-2 h-6 w-6 text-primary/40" />
            No activity yet. Start a conversation to see stats here.
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 px-4 py-3"
              >
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {item.messages} messages · {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Feature badges */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8"
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Active Features
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Streaming Chat", icon: MessageCircle },
            { label: "God Mode", icon: Zap },
            { label: "Voice Input", icon: Mic },
            { label: "Text-to-Speech", icon: Flame },
            { label: "Web Search", icon: Globe },
            { label: "Image Generation", icon: ImageIcon },
            { label: "Tool Calling", icon: Database },
            { label: "Code Preview", icon: TrendingUp },
          ].map((feat) => (
            <div
              key={feat.label}
              className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/30 px-3 py-1 text-xs text-muted-foreground"
            >
              <feat.icon className="h-3 w-3 text-primary" />
              {feat.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
