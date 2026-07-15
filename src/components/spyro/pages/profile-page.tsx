"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  LogOut,
  Flame,
  Zap,
  Image as ImageIcon,
  MessageCircle,
  Edit3,
  Check,
  ArrowLeft,
} from "lucide-react";
import { useLocalAuth } from "@/store/local-auth";
import { useChatStore } from "@/store/chat-store";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export function ProfilePage({ onBack }: { onBack: () => void }) {
  const { user, signOut, updateProfile } = useLocalAuth();
  const conversations = useChatStore((s) => s.conversations);
  const setView = useUIStore((s) => s.setView);

  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(user?.name || "");

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <button
          onClick={() => setView("login")}
          className="rounded-xl spyro-bg-gradient px-5 py-2 text-sm font-medium text-white"
        >
          Sign in to view profile
        </button>
      </div>
    );
  }

  const allMessages = conversations.flatMap((c) => c.messages);
  const imageCount = allMessages.filter((m) => m.type === "image").length;
  const daysActive = Math.max(1, Math.ceil((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)));

  const handleSignOut = () => {
    signOut();
    setView("login");
  };

  const saveName = () => {
    if (name.trim()) {
      updateProfile({ name: name.trim() });
    }
    setEditing(false);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-elevated mb-4 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-2xl font-bold text-white shadow-lg"
            style={{ background: user.avatarColor }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveName()}
                  className="rounded-lg border border-primary/40 bg-background px-2 py-1 text-lg font-bold focus:outline-none"
                  autoFocus
                />
                <button onClick={saveName} className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{user.name}</h1>
                <button
                  onClick={() => setEditing(true)}
                  className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-foreground"
                  aria-label="Edit name"
                >
                  <Edit3 className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground/70">
              <Calendar className="h-3 w-3" />
              Joined {new Date(user.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Conversations", value: conversations.length, icon: MessageCircle },
          { label: "Messages", value: allMessages.length, icon: Zap },
          { label: "Images", value: imageCount, icon: ImageIcon },
          { label: "Days Active", value: daysActive, icon: Flame },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="surface-elevated rounded-xl p-4"
          >
            <stat.icon className="h-4 w-4 text-primary" />
            <div className="mt-2 text-xl font-bold tabular-nums">{stat.value}</div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Account settings */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="surface-elevated mt-4 rounded-2xl p-5"
      >
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Account
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Account Type</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {user.email === "guest@spyro.ai" ? "Guest" : "Free"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">User ID</span>
            <span className="font-mono text-[11px] text-muted-foreground">{user.id}</span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/30 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </motion.div>
    </div>
  );
}
