"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { SpyroLogo } from "../spyro-logo";

export function AboutPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-8 text-center sm:py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong sm:h-24 sm:w-24"
      >
        <SpyroLogo className="h-12 w-12 sm:h-14 sm:w-14 [&_svg]:h-full [&_svg]:w-full" />
      </motion.div>

      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
        <span className="spyro-text-gradient">SPYRO</span> V1
      </h1>
      <p className="mt-2 max-w-md text-balance text-muted-foreground">
        The dragon-powered AI assistant. Bold, witty, and always helpful —
        SPYRO V1 breathes fire on hard problems and answers in a flash.
      </p>

      <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
        <Flame className="h-3.5 w-3.5 text-primary" />
        Version 2.0.0
      </div>

      <div className="mt-8 w-full space-y-4 text-left">
        <Card title="What can SPYRO V1 do?">
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Answer questions and explain concepts</li>
            <li>• Write and debug code</li>
            <li>• Brainstorm ideas and draft content</li>
            <li>• Chat on the web, on your phone (PWA), on Telegram</li>
          </ul>
        </Card>

        <Card title="How does it work?">
          <p className="text-sm text-muted-foreground">
            SPYRO V1 is powered by a free AI text API, rebranded with a
            dragon-themed persona. Your conversations are stored locally on
            your device — nothing is sent to a server except your prompts to
            generate replies.
          </p>
        </Card>

        <Card title="Privacy">
          <p className="text-sm text-muted-foreground">
            Your chats live on your device. Only your prompts are sent to the
            SPYRO V1 engine. No accounts, no tracking, no ads.{" "}
            <a href="/privacy" className="text-primary underline underline-offset-2">
              Read the privacy policy →
            </a>
          </p>
        </Card>
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Built with fire by SPYRO Labs. 🐉🔥
      </p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
