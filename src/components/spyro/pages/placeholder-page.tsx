"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, type LucideIcon } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bullets: string[];
  ctaLabel?: string;
  ctaView?: "chat" | "apps" | "home";
  accent?: string;
}

/**
 * Premium empty-state / coming-soon page used while a section of the
 * SPYRO OS spec is being built out. Follows the design system:
 * centered, calm, with a clear primary action.
 */
export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  bullets,
  ctaLabel = "Open Chat",
  ctaView = "chat",
  accent = "from-violet-500 to-cyan-500",
}: PlaceholderPageProps) {
  const setView = useUIStore((s) => s.setView);

  return (
    <div className="ambient-mesh min-h-full">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center sm:py-24">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className={cn(
            "ember-aura relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-elevated",
            accent
          )}
        >
          <Icon className="h-9 w-9" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base"
        >
          {description}
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 grid w-full gap-2 text-left sm:grid-cols-2"
        >
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded-2xl border border-border bg-card/60 p-3 text-left text-xs text-muted-foreground backdrop-blur-sm"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{b}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={() => setView(ctaView)}
            className="inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("apps")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
          >
            Browse Apps
          </button>
        </motion.div>

        <p className="mt-10 text-[11px] uppercase tracking-widest text-muted-foreground/40">
          Part of SPYRO OS · Active development
        </p>
      </div>
    </div>
  );
}
