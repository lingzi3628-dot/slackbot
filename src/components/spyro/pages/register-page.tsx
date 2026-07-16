"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, ArrowRight, Sparkles, Zap, Flame, Eye, EyeOff,
  AlertCircle, Check, Loader2, ShieldCheck, MailCheck, KeyRound,
} from "lucide-react";
import { useLocalAuth } from "@/store/local-auth";
import { useUIStore } from "@/store/ui-store";
import { SpyroLogo } from "../spyro-logo";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { cn } from "@/lib/utils";

// ── Google icon (SVG) ──────────────────────────────────────────────────
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.3l6.4-6.4C35.5 4.3 30.1 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.1-2.7-.5-4z" fill="#4285F4"/>
      <path d="M6.3 14.7l7 5.1C15.1 15.2 19.2 13 24 13c3.3 0 6.3 1.2 8.6 3.3l6.4-6.4C35.5 4.3 30.1 2 24 2 16.3 2 9.7 6.6 6.3 14.7z" fill="#EA4335"/>
      <path d="M24 46c5.9 0 11.4-2.3 15.5-6.1l-7.2-5.9C30 35.9 27.2 37 24 37c-6 0-11-4-12.8-9.4l-7 5.4C7.5 41.3 14.9 46 24 46z" fill="#34A853"/>
      <path d="M44.5 20H24v8.5h11.8c-.6 1.9-1.6 3.5-3 4.5l7.2 5.9C42.7 36.2 46 30.7 46 24c0-1.3-.1-2.7-.5-4z" fill="#FBBC05"/>
    </svg>
  );
}

export function RegisterPage() {
  const { signIn } = useLocalAuth();
  const setView = useUIStore((s) => s.setView);

  // Form state
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"register" | "login">("register");
  const [showForgot, setShowForgot] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState("");
  const [forgotSent, setForgotSent] = React.useState(false);
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  // Verification state
  const [step, setStep] = React.useState<"form" | "verify">("form");
  const [verifyEmail, setVerifyEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeLoading, setCodeLoading] = React.useState(false);
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = React.useState(false);

  // ── Submit (register or login) ──────────────────────────────────────
  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (mode === "register" && !name.trim()) {
      setError("Name is required.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register"
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (mode === "register" && data.needsVerification) {
        setVerifyEmail(data.email);
        await sendCode(data.email);
        setStep("verify");
        setLoading(false);
        return;
      }

      if (data.id) {
        signIn(data.email, data.name);
        setView("dashboard");
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In ──────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      setError("Google Sign-In is not configured.");
      return;
    }

    setGoogleLoading(true);
    setError(null);

    try {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");

      // Set custom parameters for cleaner OAuth flow.
      googleProvider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;

      // Get the ID token to verify on the server.
      const idToken = await user.getIdToken();

      // Send to our API to create/find user in Neon + set session cookie.
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          uid: user.uid,
          photoUrl: user.photoURL,
          idToken,
        }),
      });
      const data = await res.json();

      if (data.id) {
        signIn(data.email, data.name);
        setView("dashboard");
      } else {
        setError(data.error || "Google sign-in failed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Send verification code ──────────────────────────────────────────
  const sendCode = async (targetEmail: string) => {
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      if (data.devCode) {
        setDevCode(data.devCode);
      } else {
        setDevCode(null);
      }
    } catch {
      /* ignore */
    }
  };

  const resendCode = async () => {
    setResendDisabled(true);
    await sendCode(verifyEmail);
    setTimeout(() => setResendDisabled(false), 30000);
  };

  const verifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      setCodeError("Enter the 6-digit code.");
      return;
    }

    setCodeLoading(true);
    setCodeError(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, code: code.trim() }),
      });
      const data = await res.json();

      if (data.verified) {
        signIn(data.email, data.name);
        setView("dashboard");
      } else {
        setCodeError(data.error || "Invalid code.");
      }
    } catch {
      setCodeError("Network error. Try again.");
    } finally {
      setCodeLoading(false);
    }
  };

  const continueAsGuest = () => {
    signIn("guest@spyro.ai", "Guest");
    setView("dashboard");
  };

  const sendForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotSent(true);
    } catch {
      setForgotSent(true);
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Verification step (redesigned) ──────────────────────────────────
  if (step === "verify") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30"
            style={{ background: "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 70%)" }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="surface-elevated rounded-3xl p-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="ember-aura relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl spyro-bg-gradient spyro-glow-strong"
            >
              <MailCheck className="h-8 w-8 text-white" />
            </motion.div>

            {/* Title */}
            <h2 className="text-center text-xl font-bold">Check your email</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              We sent a <span className="font-semibold text-foreground">6-digit verification code</span> to
            </p>
            <p className="text-center text-sm font-medium text-primary">{verifyEmail}</p>

            {/* Dev code (if Gmail not configured) */}
            {devCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center"
              >
                <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                  <KeyRound className="h-3 w-3" />
                  Your verification code
                </p>
                <p className="mt-2 text-4xl font-bold tracking-[0.4em] spyro-text-gradient">{devCode}</p>
              </motion.div>
            )}

            {/* Code input */}
            <div className="mt-6">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verifyCode()}
                placeholder="000000"
                className="w-full rounded-2xl border border-border/50 bg-muted/20 py-4 text-center text-3xl font-bold tracking-[0.5em] focus:border-primary/40 focus:outline-none"
                autoFocus
                inputMode="numeric"
              />
            </div>

            {codeError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {codeError}
              </div>
            )}

            {/* Verify button */}
            <button
              onClick={verifyCode}
              disabled={codeLoading || code.length !== 6}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl spyro-bg-gradient py-3 text-sm font-semibold text-white transition-all hover:spyro-glow disabled:opacity-50"
            >
              {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {codeLoading ? "Verifying…" : "Verify & Enter SPYRO"}
            </button>

            {/* Footer actions */}
            <div className="mt-4 flex items-center justify-between text-xs">
              <button
                onClick={() => { setStep("form"); setCode(""); setCodeError(null); setDevCode(null); }}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to form
              </button>
              <button
                onClick={resendCode}
                disabled={resendDisabled}
                className="text-primary hover:underline disabled:opacity-50"
              >
                {resendDisabled ? "Resend in 30s" : "Resend code"}
              </button>
            </div>

            {/* Info */}
            <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
              Code expires in 10 minutes. Check your spam folder if you don't see the email.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full opacity-30"
          style={{ background: "radial-gradient(ellipse at center, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
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
          <p className="mt-1 text-sm text-muted-foreground">The dragon-powered AI platform</p>
          <p className="mt-1 text-xs text-muted-foreground/60">🇰🇪 Built in Kenya by Lewis Kariuki & SPYRO Labs</p>
        </div>

        {/* Auth card */}
        <div className="surface-elevated rounded-3xl p-6">
          {/* Google Sign-In */}
          {isFirebaseConfigured && (
            <>
              <button
                onClick={signInWithGoogle}
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-white py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-50"
              >
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                {googleLoading ? "Connecting…" : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[11px] text-muted-foreground/60">or</span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
            </>
          )}

          {/* Mode tabs */}
          <div className="mb-4 flex gap-1 rounded-xl border border-border/40 bg-card/20 p-1">
            {[
              { id: "register" as const, label: "Create Account" },
              { id: "login" as const, label: "Sign In" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => { setMode(tab.id); setError(null); }}
                className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                  mode === tab.id ? "spyro-bg-gradient text-white" : "text-muted-foreground hover:text-foreground")}>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-3 overflow-hidden">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                    className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-3 text-sm focus:border-primary/40 focus:outline-none" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-3 text-sm focus:border-primary/40 focus:outline-none" />
          </div>

          <div className="relative mb-3">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Password (min 6 characters)"
              className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-10 text-sm focus:border-primary/40 focus:outline-none" />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {mode === "login" && (
            <div className="mb-3 text-right">
              <button onClick={() => setShowForgot(true)} className="text-xs text-muted-foreground hover:text-primary">Forgot password?</button>
            </div>
          )}

          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}
            </div>
          )}

          <button onClick={submit} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl spyro-bg-gradient py-2.5 text-sm font-semibold text-white transition-all hover:spyro-glow disabled:opacity-50">
            {loading ? <Flame className="h-4 w-4 animate-pulse" /> : <>{mode === "register" ? "Create Account" : "Sign In"}<ArrowRight className="h-4 w-4" /></>}
          </button>

          <div className="mt-4 border-t border-border/30 pt-4 text-center">
            <button onClick={continueAsGuest} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Continue as guest → <span className="text-muted-foreground/60">(limited features)</span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> God Mode</span>
          <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-primary" /> 7 AI Tools</span>
          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-primary" /> Free</span>
        </div>
      </motion.div>

      {/* Forgot password modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowForgot(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} className="surface-elevated w-full max-w-sm rounded-2xl p-6">
              {forgotSent ? (
                <div className="text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-green-500/15"><Check className="h-6 w-6 text-green-500" /></div>
                  <h3 className="text-lg font-bold">Check your email</h3>
                  <p className="mt-1 text-sm text-muted-foreground">If an account exists for {forgotEmail}, a reset link has been sent.</p>
                  <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }}
                    className="mt-4 rounded-lg spyro-bg-gradient px-4 py-2 text-sm font-medium text-white">Close</button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold">Reset Password</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
                  <div className="relative mt-3">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com"
                      className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-3 text-sm focus:border-primary/40 focus:outline-none" autoFocus />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setShowForgot(false)} className="flex-1 rounded-xl border border-border/50 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                    <button onClick={sendForgotPassword} disabled={forgotLoading || !forgotEmail.trim()}
                      className="flex-1 rounded-xl spyro-bg-gradient py-2 text-sm font-medium text-white disabled:opacity-50">{forgotLoading ? "Sending…" : "Send Link"}</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
