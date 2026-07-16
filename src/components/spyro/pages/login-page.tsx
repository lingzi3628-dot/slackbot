"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles, Zap, Flame } from "lucide-react";
import { useLocalAuth } from "@/store/local-auth";
import { useUIStore } from "@/store/ui-store";
import { SpyroLogo } from "../spyro-logo";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { signIn, isAuthed, user } = useLocalAuth();
  const setView = useUIStore((s) => s.setView);
  const [mode, setMode] = React.useState<"signin" | "signup">("signup");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // If already authed, redirect to home.
  React.useEffect(() => {
    if (isAuthed && user) {
      setView("home");
    }
  }, [isAuthed, user, setView]);

  const submit = async () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      setError("Name is required.");
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate a brief auth delay for UX.
    await new Promise((r) => setTimeout(r, 600));

    signIn(email.trim(), name.trim());
    setLoading(false);
    setView("home");
  };

  const skipLogin = () => {
    // Guest mode — sign in as a guest.
    signIn("guest@spyro.ai", "Guest Dragon");
    setView("home");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background embers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-1/4 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 70%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo + branding */}
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong"
          >
            <SpyroLogo className="h-12 w-12 [&_svg]:h-full [&_svg]:w-full" />
          </motion.div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">
            <span className="spyro-text-gradient">SPYRO</span> V1
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The dragon-powered AI platform
          </p>
        </div>

        {/* Auth card */}
        <div className="surface-elevated rounded-2xl p-6">
          {/* Mode tabs */}
          <div className="mb-5 flex gap-1 rounded-xl border border-border/40 bg-card/20 p-1">
            {[
              { id: "signup" as const, label: "Sign Up" },
              { id: "signin" as const, label: "Sign In" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setMode(tab.id); setError(null); }}
                className={cn(
                  "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === tab.id ? "spyro-bg-gradient text-white" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Name field (signup only) */}
          <AnimatePresence mode="wait">
            {mode === "signup" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <div className="relative">
                  <Sparkles className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-3 text-sm focus:border-primary/40 focus:outline-none"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-3 text-sm focus:border-primary/40 focus:outline-none"
            />
          </div>

          {/* Password (decorative — local auth doesn't check it) */}
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-3 text-sm focus:border-primary/40 focus:outline-none"
            />
          </div>

          {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl spyro-bg-gradient py-2.5 text-sm font-semibold text-white transition-all hover:spyro-glow disabled:opacity-50"
          >
            {loading ? (
              <Flame className="h-4 w-4 animate-pulse" />
            ) : (
              <>
                {mode === "signup" ? "Create account" : "Sign in"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Guest mode */}
          <div className="mt-4 text-center">
            <button
              onClick={skipLogin}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Continue as guest →
            </button>
          </div>
        </div>

        {/* Feature badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" /> God Mode
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3 text-primary" /> 5 AI Tools
          </span>
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> Free Forever
          </span>
        </div>
      </motion.div>
    </div>
  );
}
