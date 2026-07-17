"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Sparkles, Flame, ArrowRight, Zap, Bot,
  TrendingUp, Clock, Plus, LayoutGrid,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore } from "@/store/ui-store";
import { useLocalAuth } from "@/store/local-auth";
import { cn } from "@/lib/utils";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: "🌅" };
  if (hour < 17) return { text: "Good afternoon", icon: "☀️" };
  if (hour < 21) return { text: "Good evening", icon: "🌆" };
  return { text: "Good night", icon: "🌙" };
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function HomePage() {
  const conversations = useChatStore((s) => s.conversations);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const setActive = useChatStore((s) => s.setActive);
  const createConversation = useChatStore((s) => s.createConversation);
  const setView = useUIStore((s) => s.setView);
  const user = useLocalAuth((s) => s.user);

  const greeting = getGreeting();
  const allMessages = conversations.flatMap((c) => c.messages);
  const recentConvos = [...conversations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4);

  const hasActivity = conversations.length > 0;
  const daysActive = user?.createdAt ? Math.max(1, Math.ceil((Date.now() - user.createdAt) / 86400000)) : 1;

  // Always-meaningful stats — never show empty zeros.
  const stats = [
    { label: "Conversations", value: conversations.length, icon: MessageCircle, accent: "text-violet-400" },
    { label: "Messages", value: allMessages.length, icon: Sparkles, accent: "text-cyan-400" },
    { label: "Days active", value: daysActive, icon: TrendingUp, accent: "text-emerald-400" },
    { label: "Status", value: isGenerating ? "Thinking" : "Ready", icon: Zap, accent: isGenerating ? "text-amber-400" : "text-emerald-400" },
  ];

  const recommendations = hasActivity
    ? [
        { title: "Summarize my last conversation", icon: Sparkles, view: "chat" as const },
        { title: "Generate an image", icon: Flame, view: "apps" as const },
        { title: "Build an AI agent", icon: Bot, view: "agents" as const },
        { title: "Search the web", icon: TrendingUp, view: "chat" as const },
      ]
    : [
        { title: "Start your first chat", icon: MessageCircle, view: "chat" as const },
        { title: "Generate an image", icon: Flame, view: "apps" as const },
        { title: "Explore AI tools", icon: LayoutGrid, view: "apps" as const },
        { title: "Browse the API", icon: Bot, view: "agents" as const },
      ];

  const handleNewChat = () => {
    createConversation();
    setView("chat");
  };

  const handleOpenConvo = (id: string) => {
    setActive(id);
    setView("chat");
  };

  return (
    <div className="ambient-mesh min-h-full">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-lg">{greeting.icon}</span>
            <span>{greeting.text}</span>
            <span className="relative flex h-1.5 w-1.5">
              {isGenerating && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              )}
              <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", isGenerating ? "bg-primary" : "bg-emerald-500")} />
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {user?.name ? (
              <>Welcome back, <span className="spyro-text-gradient">{user.name.split(" ")[0]}</span></>
            ) : (
              <>Welcome to <span className="spyro-text-gradient">SPYRO</span></>
            )}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {conversations.length > 0
              ? `You have ${conversations.length} conversation${conversations.length === 1 ? "" : "s"} · ${allMessages.length} messages`
              : "Your AI Operating System is ready. Start a conversation or pick a tool below."}
          </p>
        </motion.div>

        {/* Continue working — recent conversations */}
        {recentConvos.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="h-4 w-4 text-primary" />
                Continue working
              </h2>
              <button
                onClick={() => setView("chat")}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                View all →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {recentConvos.map((c, i) => {
                const lastMsg = c.messages[c.messages.length - 1];
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.04 }}
                    onClick={() => handleOpenConvo(c.id)}
                    className="group surface-elevated p-4 text-left transition-all hover:spyro-glow"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium">{c.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {lastMsg?.content?.slice(0, 80) || "No messages yet"}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/60">
                      <MessageCircle className="h-3 w-3" />
                      {c.messages.length} messages
                      <span>·</span>
                      {timeAgo(c.updatedAt)}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* AI Recommendations */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Recommendations
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {recommendations.map((r, i) => (
              <motion.button
                key={r.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                onClick={() => setView(r.view)}
                className="group surface p-3 text-left transition-all hover:spyro-glow"
              >
                <r.icon className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs font-medium leading-tight">{r.title}</p>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Usage Statistics */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Usage Statistics
            </h2>
            <button
              onClick={() => setView("analytics")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Details →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.04 }}
                className="surface p-4"
              >
                <div className="flex items-center justify-between">
                  <s.icon className={cn("h-4 w-4", s.accent)} />
                </div>
                <div className="mt-2 text-2xl font-bold tracking-tight">{s.value}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick actions */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-4 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            New chat
          </button>
          <button
            onClick={() => setView("apps")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
          >
            <LayoutGrid className="h-4 w-4" />
            Browse apps
          </button>
        </motion.section>
      </div>
    </div>
  );
}
