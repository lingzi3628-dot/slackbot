"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, UserPlus, LogOut, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { SpyroLogo } from "../spyro-logo";

export function AuthPage() {
  const { user, signIn, signUp, signOut, configured } = useAuthStore();
  const setView = useUIStore((s) => s.setView);
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  if (!configured) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
        <SpyroLogo className="h-16 w-16 [&_svg]:h-full [&_svg]:w-full" />
        <h1 className="mt-4 text-xl font-bold">Cloud sync not configured</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Supabase environment variables aren't set. The app works fully
          offline with localStorage. To enable cloud sync + multi-device,
          set <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-muted px-1 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> on Vercel.
        </p>
        <button
          onClick={() => setView("chat")}
          className="mt-6 rounded-lg spyro-bg-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Continue offline →
        </button>
      </div>
    );
  }

  if (user) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
        <div className="ember-aura relative grid h-16 w-16 place-items-center rounded-2xl spyro-bg-gradient">
          <SpyroLogo className="h-10 w-10 [&_svg]:h-full [&_svg]:w-full" />
        </div>
        <h1 className="mt-4 text-xl font-bold">Signed in</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          Your conversations sync to the cloud automatically.
        </p>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setView("chat")}
            className="rounded-lg spyro-bg-gradient px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to chat →
          </button>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const result =
      mode === "signin"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setView("chat");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full flex-col items-center"
      >
        <div className="ember-aura relative grid h-16 w-16 place-items-center rounded-2xl spyro-bg-gradient spyro-glow">
          <SpyroLogo className="h-10 w-10 [&_svg]:h-full [&_svg]:w-full" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to sync your conversations to the cloud."
            : "Create an account for multi-device cloud sync."}
        </p>

        <div className="mt-6 w-full space-y-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm focus:border-primary/60 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Password (min 6 chars)"
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-sm focus:border-primary/60 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            onClick={submit}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg spyro-bg-gradient py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </div>

        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </motion.div>
    </div>
  );
}
