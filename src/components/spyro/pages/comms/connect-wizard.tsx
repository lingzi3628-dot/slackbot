"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, RefreshCw, Check, Loader2, X, Smartphone,
  ShieldCheck, Zap, Phone, ArrowRight, Copy,
} from "lucide-react";
import { useCommsStore } from "@/store/comms-store";
import { cn } from "@/lib/utils";

interface ConnectWizardProps {
  onConnected?: () => void;
  onCancel?: () => void;
}

type Phase =
  | "idle"           // Initial screen — ask for phone number
  | "generating"     // Requesting pairing code / QR
  | "pairing-code"   // Show pairing code (pairing-server flow)
  | "qr"             // Show QR (Baileys/Evolution flow)
  | "scanning"       // Waiting for scan/pairing
  | "syncing"        // Connected, syncing
  | "connected"      // Done
  | "error";         // Failed

export function ConnectWizard({ onConnected, onCancel }: ConnectWizardProps) {
  const setChannelId = useCommsStore((s) => s.setChannelId);
  const setConnection = useCommsStore((s) => s.setConnection);

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [qrCode, setQrCode] = React.useState<string | null>(null);
  const [pairingCode, setPairingCode] = React.useState<string | null>(null);
  const [pairingLink, setPairingLink] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<string>("demo");
  const [phone, setPhone] = React.useState("");
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const stopRef = React.useRef(false);

  const stopPolling = React.useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const fetchStatus = React.useCallback(async (id: string) => {
    if (stopRef.current) return;
    try {
      const res = await fetch(`/api/comms/status?channelId=${id}&channelType=whatsapp`, { cache: "no-store" });
      const data = await res.json();
      setConnection(data);
      if (data.status === "connected") {
        stopPolling();
        setPhase("syncing");
        try {
          await fetch("/api/comms/sync", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ channelId: id, channelType: "whatsapp" }),
          });
        } catch { /* ignore */ }
        setPhase("connected");
        setTimeout(() => onConnected?.(), 1200);
      } else if (data.status === "connecting") {
        if (data.qrCode && data.qrCode !== qrCode) setQrCode(data.qrCode);
        setPhase(prev => prev === "qr" || prev === "pairing-code" || prev === "scanning" ? "scanning" : prev);
      } else if (data.status === "error") {
        stopPolling();
        setError(data.errorMessage || "Connection failed");
        setPhase("error");
      }
    } catch { /* transient */ }
  }, [qrCode, setConnection, stopPolling, onConnected]);

  const start = React.useCallback(async () => {
    stopRef.current = false;
    setError(null);
    setQrCode(null);
    setPairingCode(null);
    setPairingLink(null);
    setPhase("generating");

    try {
      // For the pairing-server flow, channelId = phone number.
      // For QR flows, channelId can be random.
      const channelId = phone.trim() || `spyro_${Date.now().toString(36)}`;

      const res = await fetch("/api/comms/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelType: "whatsapp", channelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start");

      setChannelId(data.channelId);
      setMode(data.mode || "demo");

      if (data.pairingCode) {
        // Pairing code flow (pairing-server)
        setPairingCode(data.pairingCode);
        setPairingLink(data.pairingLink || null);
        setPhase("pairing-code");
      } else if (data.qrCode) {
        // QR flow (Baileys / Evolution)
        setQrCode(data.qrCode);
        setPhase("qr");
      } else {
        throw new Error("No QR or pairing code returned");
      }

      // Poll for connection status
      pollRef.current = setInterval(() => fetchStatus(data.channelId), 1500);
      fetchStatus(data.channelId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(
        msg.includes("Timed out") || msg.includes("405") || msg.includes("Connection Failure")
          ? "WhatsApp rejected the connection. If using the local Baileys service, your IP may be blocked. Use the VPS pairing server instead."
          : msg
      );
      setPhase("error");
    }
  }, [phone, fetchStatus, setChannelId]);

  const refreshQr = React.useCallback(async () => {
    // For pairing-server, just re-request
    setPhase("generating");
    try {
      const channelId = phone.trim() || useCommsStore.getState().channelId || "";
      const res = await fetch("/api/comms/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channelType: "whatsapp", channelId }),
      });
      const data = await res.json();
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        setPairingLink(data.pairingLink || null);
        setPhase("pairing-code");
      } else if (data.qrCode) {
        setQrCode(data.qrCode);
        setPhase("qr");
      }
    } catch {
      setPhase("error");
    }
  }, [phone]);

  React.useEffect(() => () => {
    stopRef.current = true;
    stopPolling();
  }, [stopPolling]);

  const copyCode = () => {
    if (pairingCode) navigator.clipboard?.writeText(pairingCode);
  };

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
            {mode !== "demo" && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                Live
              </span>
            )}
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
            {/* IDLE — phone number input */}
            {phase === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 }}
                  className="ember-aura relative mx-auto mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-elevated"
                >
                  <MessageCircle className="h-9 w-9" />
                </motion.div>
                <h3 className="text-lg font-semibold">Connect your WhatsApp</h3>
                <p className="mx-auto mt-2 max-w-xs text-xs text-muted-foreground">
                  Enter your WhatsApp phone number with country code. We&apos;ll generate a pairing code — enter it in WhatsApp to link your device.
                </p>

                <div className="mx-auto mt-5 max-w-xs">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 712 884 220"
                      className="w-full rounded-xl border border-border bg-secondary/30 py-2.5 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                    />
                  </div>
                </div>

                <ul className="mx-auto mt-5 flex max-w-xs flex-col gap-2 text-left text-xs text-muted-foreground">
                  <li className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />End-to-end encrypted. We never store message content.</li>
                  <li className="flex items-start gap-2"><Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />AI agents auto-reply from your connected number.</li>
                </ul>

                <button
                  onClick={start}
                  disabled={!phone.trim()}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-40"
                >
                  <MessageCircle className="h-4 w-4" />
                  Get pairing code
                </button>
              </motion.div>
            )}

            {/* GENERATING */}
            {phase === "generating" && (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Generating secure pairing code…</p>
              </motion.div>
            )}

            {/* PAIRING CODE — the main flow for the VPS pairing-server */}
            {phase === "pairing-code" && pairingCode && (
              <motion.div key="pairing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <h3 className="text-base font-semibold">Enter this code in WhatsApp</h3>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  Open WhatsApp → Settings → Linked Devices → Link a Device → Enter pairing code
                </p>

                {/* Big pairing code display */}
                <div className="relative mx-auto mt-5 w-full max-w-xs">
                  <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6">
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">Your pairing code</div>
                    <div className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-foreground">
                      {pairingCode}
                    </div>
                    <button
                      onClick={copyCode}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-secondary/70"
                    >
                      <Copy className="h-3 w-3" />
                      Copy code
                    </button>
                  </div>
                </div>

                {/* Pairing link button */}
                {pairingLink && (
                  <a
                    href={pairingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Open WhatsApp
                  </a>
                )}

                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  Waiting for pairing…
                </div>

                <button
                  onClick={refreshQr}
                  className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3" />
                  Generate new code
                </button>
              </motion.div>
            )}

            {/* QR — for Baileys/Evolution flows */}
            {(phase === "qr" || phase === "scanning") && qrCode && (
              <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                <h3 className="text-base font-semibold">Scan with your WhatsApp</h3>
                <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                  Open WhatsApp → Settings → Linked Devices → Link a Device
                </p>

                <div className="relative mx-auto mt-5 grid h-64 w-64 place-items-center rounded-3xl bg-white p-4 shadow-elevated ring-4 ring-primary/10">
                  <img src={qrCode} alt="WhatsApp pairing QR code" className="h-full w-full rounded-2xl object-contain" />
                  {phase === "scanning" && (
                    <motion.div
                      initial={{ y: 0 }}
                      animate={{ y: [0, 240, 0] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
                      className="absolute inset-x-4 h-0.5 bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]"
                    />
                  )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  {phase === "scanning" ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />Waiting for scan…</>
                  ) : (
                    <><Smartphone className="h-3.5 w-3.5" />Point your phone here</>
                  )}
                </div>

                <button
                  onClick={refreshQr}
                  className="mx-auto mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3" />
                  Refresh code
                </button>
              </motion.div>
            )}

            {/* SYNCING */}
            {phase === "syncing" && (
              <motion.div key="sync" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
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
              <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6 text-center">
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
              </motion.div>
            )}

            {/* ERROR */}
            {phase === "error" && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-6 text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                  <X className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-semibold">Connection failed</h3>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">{error || "Something went wrong."}</p>
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
