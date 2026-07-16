"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeInfo {
  mode: "live" | "demo";
  evolutionApiConfigured: boolean;
  webhookConfigured: boolean;
  appUrl: string | null;
  setupSteps: string[];
}

export function ModeBanner() {
  const [mode, setMode] = React.useState<ModeInfo | null>(null);
  const [showDetails, setShowDetails] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/comms/mode", { cache: "no-store" })
      .then((r) => r.json())
      .then(setMode)
      .catch(() => {});
  }, []);

  if (!mode || dismissed) return null;

  const isLive = mode.mode === "live";

  return (
    <>
      {/* Compact banner */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 text-[11px]",
        isLive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-amber-500/10 text-amber-400"
      )}>
        {isLive ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
        <span className="flex-1">
          {isLive
            ? "LIVE MODE — Real WhatsApp connected. AI agents reply from your number."
            : "DEMO MODE — Simulated connection. Add Evolution API credentials to go live."}
        </span>
        {!isLive && (
          <button
            onClick={() => setShowDetails(true)}
            className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium hover:bg-amber-500/30"
          >
            How to go live
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="grid h-5 w-5 place-items-center rounded hover:bg-black/10"
          aria-label="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Setup details modal */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 95 }}
            className="flex items-start justify-center overflow-y-auto p-4 sm:items-center"
            onClick={() => setShowDetails(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] shadow-elevated"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Info className="h-4 w-4 text-amber-400" />
                  Go live with Evolution API
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-5">
                <p className="text-sm text-muted-foreground">
                  To connect real WhatsApp devices and have your AI agents reply from your own number, you need an Evolution API instance. Here's how:
                </p>

                <ol className="mt-4 space-y-3">
                  {mode.setupSteps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-xs leading-relaxed text-foreground/90">{step}</span>
                    </li>
                  ))}
                </ol>

                <div className="mt-5 rounded-xl border border-border bg-card/40 p-4">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Environment variables</div>
                  <pre className="overflow-x-auto rounded-lg bg-background p-3 text-[11px] leading-relaxed text-foreground/80"><code>{`# Required for LIVE mode
EVOLUTION_API_URL=https://your-evolution-instance.com
EVOLUTION_API_KEY=your-evolution-api-key

# Required for incoming message webhooks
NEXT_PUBLIC_APP_URL=https://your-spyro-app.com`}</code></pre>
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-400">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div className="font-medium">Evolution API</div>
                    <div className="mt-0.5 text-cyan-400/70">
                      Open-source WhatsApp API. Deploy via Docker or use a hosted provider.
                      Docs: <span className="underline">github.com/EvolutionAPI/evolution-api</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-[11px] text-muted-foreground">
                  Current status:
                  <span className={cn("ml-1 font-medium", mode.evolutionApiConfigured ? "text-emerald-400" : "text-rose-400")}>
                    {mode.evolutionApiConfigured ? "Evolution API ✓" : "Evolution API ✗"}
                  </span>
                  <span className={cn("ml-2 font-medium", mode.webhookConfigured ? "text-emerald-400" : "text-rose-400")}>
                    {mode.webhookConfigured ? "Webhook URL ✓" : "Webhook URL ✗"}
                  </span>
                </div>
              </div>

              <div className="shrink-0 border-t border-border px-6 py-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full rounded-xl spyro-bg-gradient py-2 text-xs font-medium text-white"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
