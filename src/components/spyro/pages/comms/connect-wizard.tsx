"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, RefreshCw, Check, Loader2, X,
  ShieldCheck, Zap, Phone, ArrowRight, Copy, AlertCircle,
  ExternalLink, Sparkles, Clock,
} from "lucide-react";
import { useCommsStore } from "@/store/comms-store";
import { cn } from "@/lib/utils";

interface ConnectWizardProps {
  onConnected?: () => void;
  onCancel?: () => void;
}

type Phase =
  | "idle"           // Step 1: Enter phone number
  | "generating"     // Requesting pairing code
  | "pairing-code"   // Step 2: Show code + instructions (SIMULATION)
  | "entered"        // Step 3: User confirmed they entered the code
  | "syncing"        // Connected, syncing
  | "connected"      // Done
  | "error";         // Failed

export function ConnectWizard({ onConnected, onCancel }: ConnectWizardProps) {
  const setChannelId = useCommsStore((s) => s.setChannelId);
  const setConnection = useCommsStore((s) => s.setConnection);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [pairingCode, setPairingCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const simTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = React.useCallback(() => {
    if (simTimerRef.current) { clearTimeout(simTimerRef.current); simTimerRef.current = null; }
  }, []);

  // Generate a realistic-looking pairing code (simulation)
  const generateSimCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
  };

  const start = React.useCallback(async () => {
    setError(null);
    setPairingCode(null);
    setCopied(false);
    setPhase("generating");

    // SIMULATION MODE — real-time WhatsApp coming soon
    // Generate a demo pairing code after a brief delay
    await new Promise((r) => setTimeout(r, 1500));

    const code = generateSimCode();
    const sessionId = `sim_${Date.now().toString(36)}`;
    setPairingCode(code);
    setChannelId(sessionId);
    setConnection({
      channelId: sessionId,
      type: "whatsapp",
      status: "connecting",
      phoneNumber: phone.trim(),
      health: { score: 100 },
    });
    setPhase("pairing-code");
  }, [phone, setChannelId, setConnection]);

  // Step 3: User clicked "I've entered the code" → simulate connection
  const confirmEntered = React.useCallback(async () => {
    setPhase("entered");
    // Simulate the linking process (3 seconds)
    simTimerRef.current = setTimeout(async () => {
      const channelId = useCommsStore.getState().channelId;
      if (channelId) {
        setConnection({
          channelId,
          type: "whatsapp",
          status: "connected",
          deviceName: "WhatsApp Web",
          phoneNumber: phone.trim(),
          connectedAt: Date.now(),
          lastSyncAt: Date.now(),
          health: { score: 96, latencyMs: 240 },
        });
      }
      setPhase("syncing");
      await new Promise((r) => setTimeout(r, 1000));
      setPhase("connected");
      simTimerRef.current = setTimeout(() => onConnected?.(), 1500);
    }, 3000);
  }, [phone, setConnection, onConnected]);

  const refreshCode = React.useCallback(() => {
    setPhase("generating");
    setTimeout(() => {
      setPairingCode(generateSimCode());
      setPhase("pairing-code");
    }, 800);
  }, []);

  React.useEffect(() => () => { clearTimers(); }, [clearTimers]);

  const copyCode = () => {
    if (pairingCode) {
      navigator.clipboard?.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedCode = pairingCode
    ? pairingCode.length === 8
      ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}`
      : pairingCode
    : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 90 }}
      className="flex items-start justify-center overflow-y-auto p-4 sm:items-center"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => phase === "connected" && onCancel?.()} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="glass-strong relative flex w-full max-w-md max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[28px] shadow-elevated"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15">
              <MessageCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold">Connect WhatsApp</h2>
            {/* Simulation badge */}
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="h-2.5 w-2.5" />
              Preview
            </span>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: IDLE — phone number input */}
            {phase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                {/* Step indicator */}
                <div className="mb-5 flex items-center justify-center gap-2">
                  <StepDot active label="1. Phone" />
                  <StepLine />
                  <StepDot label="2. Code" />
                  <StepLine />
                  <StepDot label="3. Link" />
                </div>

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="ember-aura relative mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-elevated"
                >
                  <MessageCircle className="h-7 w-7" />
                </motion.div>
                <h3 className="text-lg font-semibold">Step 1: Enter your number</h3>
                <p className="mx-auto mt-2 max-w-xs text-xs text-muted-foreground">
                  Enter the WhatsApp phone number you want to connect. Include the country code (e.g. +254…). This is YOUR number — the one SPYRO will send replies from.
                </p>

                <div className="mx-auto mt-5 max-w-xs">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && phone.trim()) start(); }}
                      placeholder="+254 712 884 220"
                      className="w-full rounded-xl border border-border bg-secondary/30 py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    Must include country code. This number must have an active WhatsApp account.
                  </p>
                </div>

                <button
                  onClick={start}
                  disabled={!phone.trim()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-40"
                >
                  <ArrowRight className="h-4 w-4" />
                  Get pairing code
                </button>

                {/* Coming soon banner */}
                <div className="mx-auto mt-5 flex max-w-xs items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-left">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <div className="text-[10px] leading-relaxed text-amber-400/90">
                    <span className="font-semibold">Real-time WhatsApp coming soon.</span> This is a preview of the connection flow. Real device pairing requires a residential IP proxy (WhatsApp blocks datacenter IPs).
                  </div>
                </div>
              </motion.div>
            )}

            {/* GENERATING */}
            {phase === "generating" && (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Generating secure pairing code…</p>
              </motion.div>
            )}

            {/* STEP 2: PAIRING CODE */}
            {phase === "pairing-code" && pairingCode && (
              <motion.div key="pairing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                {/* Step indicator */}
                <div className="mb-5 flex items-center justify-center gap-2">
                  <StepDot done label="1. Phone" />
                  <StepLine />
                  <StepDot active label="2. Code" />
                  <StepLine />
                  <StepDot label="3. Link" />
                </div>

                <h3 className="text-base font-semibold">Step 2: Enter code in WhatsApp</h3>

                {/* Simulation notice */}
                <div className="mx-auto mt-2 flex max-w-xs items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] text-amber-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  Simulation — real-time coming soon
                </div>

                {/* Big pairing code */}
                <div className="relative mx-auto mt-4 w-full max-w-xs">
                  <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">Your pairing code</div>
                    <div className="mt-2 font-mono text-3xl font-bold tracking-[0.2em] text-foreground">
                      {formattedCode}
                    </div>
                    <button
                      onClick={copyCode}
                      className={cn(
                        "mt-3 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                        copied ? "bg-emerald-500/15 text-emerald-400" : "bg-secondary text-foreground hover:bg-secondary/70"
                      )}
                    >
                      {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy code</>}
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div className="mx-auto mt-5 max-w-xs rounded-xl border border-border bg-card/40 p-4 text-left">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    On your phone, open WhatsApp:
                  </div>
                  <ol className="space-y-1.5 text-xs text-foreground/80">
                    <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Settings → Linked Devices</li>
                    <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Tap "Link a Device"</li>
                    <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Tap "Link with phone number instead"</li>
                    <li className="flex gap-2"><span className="font-bold text-primary">4.</span> Enter the code above</li>
                  </ol>
                </div>

                {/* Confirm button — advances to step 3 */}
                <button
                  onClick={confirmEntered}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
                >
                  <Check className="h-4 w-4" />
                  I've entered the code
                </button>

                <button
                  onClick={refreshCode}
                  className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3" />
                  New code
                </button>
              </motion.div>
            )}

            {/* STEP 3: ENTERED — linking */}
            {phase === "entered" && (
              <motion.div key="entered" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8 text-center">
                <div className="mb-5 flex items-center justify-center gap-2">
                  <StepDot done label="1. Phone" />
                  <StepLine />
                  <StepDot done label="2. Code" />
                  <StepLine />
                  <StepDot active label="3. Link" />
                </div>
                <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                <h3 className="mt-4 text-base font-semibold">Linking your device…</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  WhatsApp is connecting to SPYRO. This takes a few seconds.
                </p>
                {/* Simulation notice */}
                <div className="mt-3 flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] text-amber-400">
                  <Sparkles className="h-2.5 w-2.5" />
                  Simulating connection
                </div>
              </motion.div>
            )}

            {/* SYNCING */}
            {phase === "syncing" && (
              <motion.div key="sync" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="grid h-12 w-12 place-items-center rounded-full border-2 border-primary/20 border-t-primary"
                />
                <p className="mt-4 text-sm font-medium">Connected!</p>
                <p className="mt-1 text-xs text-muted-foreground">Syncing your chats and contacts…</p>
              </motion.div>
            )}

            {/* CONNECTED */}
            {phase === "connected" && (
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8 text-center">
                <div className="mb-5 flex items-center justify-center gap-2">
                  <StepDot done label="1. Phone" />
                  <StepLine />
                  <StepDot done label="2. Code" />
                  <StepLine />
                  <StepDot done label="3. Link" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 240, damping: 14 }}
                  className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-elevated"
                >
                  <Check className="h-10 w-10" strokeWidth={3} />
                </motion.div>
                <h3 className="mt-5 text-lg font-semibold">WhatsApp connected</h3>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  Your WhatsApp is now linked. The AI agent will auto-reply from your number.
                </p>
                <div className="mt-3 flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] text-amber-400">
                  <Clock className="h-2.5 w-2.5" />
                  Simulation mode — real messages coming soon
                </div>
              </motion.div>
            )}

            {/* ERROR */}
            {phase === "error" && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                  <AlertCircle className="h-7 w-7" />
                </div>
                <h3 className="mt-3 text-base font-semibold">Connection failed</h3>
                <div className="mt-2 max-w-sm whitespace-pre-line text-left text-[11px] leading-relaxed text-muted-foreground">
                  {error || "Something went wrong."}
                </div>
                <button
                  onClick={() => setPhase("idle")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-secondary"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Step indicator helpers ────────────────────────────────────────────
function StepDot({ active, done, label }: { active?: boolean; done?: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn(
        "grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold transition-colors",
        done ? "bg-emerald-500 text-white" :
        active ? "bg-primary text-primary-foreground" :
        "bg-secondary text-muted-foreground"
      )}>
        {done ? <Check className="h-3 w-3" /> : label.charAt(0)}
      </div>
      <span className={cn("text-[9px]", active || done ? "text-foreground font-medium" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}

function StepLine() {
  return <div className="h-px w-6 bg-border" />;
}
