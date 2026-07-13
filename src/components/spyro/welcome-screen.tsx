"use client";

import { motion } from "framer-motion";
import { Code2, Flame, GraduationCap, Lightbulb, PenLine } from "lucide-react";
import { SpyroLogo } from "./spyro-logo";

const SUGGESTIONS = [
  {
    icon: Code2,
    title: "Write some code",
    prompt: "Write a TypeScript function that debounces an async function, with comments explaining how it works.",
  },
  {
    icon: Lightbulb,
    title: "Brainstorm ideas",
    prompt: "Give me 5 creative product ideas that combine AI with everyday household objects.",
  },
  {
    icon: GraduationCap,
    title: "Explain a concept",
    prompt: "Explain how vector embeddings work, as if I'm a curious beginner.",
  },
  {
    icon: PenLine,
    title: "Draft something",
    prompt: "Draft a friendly release note for a new dark-mode feature in a mobile app.",
  },
] as const;

export function WelcomeScreen({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-6 sm:py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center"
      >
        {/* Compact hero on mobile, full size on sm+ */}
        <div className="ember-aura relative grid h-16 w-16 place-items-center rounded-2xl spyro-bg-gradient spyro-glow-strong sm:h-20 sm:w-20 sm:rounded-3xl">
          <SpyroLogo className="h-10 w-10 sm:h-12 sm:w-12 [&_svg]:h-full [&_svg]:w-full" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight sm:mt-6 sm:text-4xl">
          <span className="spyro-text-gradient">SPYRO</span>{" "}
          <span className="text-foreground">V1</span>
        </h1>
        <p className="mt-2 max-w-md text-balance text-sm text-muted-foreground sm:text-base">
          The dragon-powered AI assistant. Ask anything — SPYRO V1 breathes fire
          on hard problems and answers in a flash.
        </p>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-primary" />
          Online · powered by the SPYRO dragon engine
        </div>
      </motion.div>

      {/* Single column on phones, 2 columns on sm+ (better readability) */}
      <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 sm:mt-10 sm:grid-cols-2 sm:gap-3">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
            onClick={() => onPick(s.prompt)}
            className="group flex flex-col gap-1.5 rounded-xl border border-border bg-card/60 p-3 text-left transition-all hover:border-primary/50 hover:bg-card hover:spyro-glow sm:gap-2 sm:rounded-2xl sm:p-4"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary sm:h-8 sm:w-8">
                <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
              <span className="text-xs font-medium sm:text-sm">{s.title}</span>
            </div>
            <p className="line-clamp-2 text-[11px] text-muted-foreground group-hover:text-foreground/80 sm:text-[13px]">
              {s.prompt}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

