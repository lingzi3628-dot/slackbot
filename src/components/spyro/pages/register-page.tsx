"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle, Check,
  Loader2, ShieldCheck, KeyRound, MailCheck, Sparkles, Zap, Bot,
  MessageSquare, Code2, Globe, Mic,
} from "lucide-react";
import { useLocalAuth } from "@/store/local-auth";
import { useUIStore } from "@/store/ui-store";
import { SpyroLogo } from "../spyro-logo";
import { cn } from "@/lib/utils";

// ── Landing hero features ─────────────────────────────────────────────
const FEATURES = [
  { icon: MessageSquare, title: "AI Chat", desc: "Natural conversations with streaming responses" },
  { icon: Code2, title: "Code Lab", desc: "Write, review & preview code instantly" },
  { icon: Bot, title: "Agents", desc: "Build custom AI agents with API keys" },
  { icon: Mic, title: "Voice", desc: "Speak naturally — speech to text & back" },
  { icon: Zap, title: "God Mode", desc: "20 agents collaborating in real-time" },
  { icon: Globe, title: "Web Scout", desc: "Live web search with AI summaries" },
  { icon: Sparkles, title: "Image Studio", desc: "Generate & edit images with AI" },
  { icon: ShieldCheck, title: "Secure", desc: "Encrypted auth with Neon database" },
];

export function RegisterPage() {
  const { signIn } = useLocalAuth();
  const setView = useUIStore((s) => s.setView);
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

  // Verification state
  const [step, setStep] = React.useState<"form" | "verify">("form");
  const [verifyEmail, setVerifyEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [codeLoading, setCodeLoading] = React.useState(false);
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [resendDisabled, setResendDisabled] = React.useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) { setError("Email and password are required."); return; }
    if (mode === "register" && !name.trim()) { setError("Name is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(null);
    try {
      const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const body = mode === "register" ? { name: name.trim(), email: email.trim(), password } : { email: email.trim(), password };
      const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (mode === "register" && data.needsVerification) {
        setVerifyEmail(data.email); await sendCode(data.email); setStep("verify"); setLoading(false); return;
      }
      if (data.id) { signIn(data.email, data.name); setView("home"); }
      else { setError(data.error || "Something went wrong."); }
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const sendCode = async (targetEmail: string) => {
    try {
      const res = await fetch("/api/auth/send-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: targetEmail }) });
      const data = await res.json();
      if (data.devCode) setDevCode(data.devCode); else setDevCode(null);
    } catch { /* ignore */ }
  };

  const resendCode = async () => { setResendDisabled(true); await sendCode(verifyEmail); setTimeout(() => setResendDisabled(false), 30000); };

  const verifyCode = async () => {
    if (!code.trim() || code.length !== 6) { setCodeError("Enter the 6-digit code."); return; }
    setCodeLoading(true); setCodeError(null);
    try {
      const res = await fetch("/api/auth/verify-code", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: verifyEmail, code: code.trim() }) });
      const data = await res.json();
      if (data.verified) { signIn(data.email, data.name); setView("home"); }
      else { setCodeError(data.error || "Invalid code."); }
    } catch { setCodeError("Network error."); }
    finally { setCodeLoading(false); }
  };

  const continueAsGuest = () => { signIn("guest@spyro.ai", "Guest"); setView("home"); };

  const sendForgotPassword = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: forgotEmail.trim() }) });
      setForgotSent(true);
    } catch { setForgotSent(true); }
    finally { setForgotLoading(false); }
  };

  // ── Verification step ───────────────────────────────────────────────
  if (step === "verify") {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 gradient-mesh">
        <div className="floating-light animate-float" style={{ width: 300, height: 300, background: "#7C3AED", top: "10%", left: "10%" }} />
        <div className="floating-light animate-float" style={{ width: 250, height: 250, background: "#06B6D4", bottom: "10%", right: "10%", animationDelay: "2s" }} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
          <div className="glass-strong rounded-[28px] p-8 shadow-elevated">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="ember-aura relative mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl spyro-bg-gradient spyro-glow-strong">
              <MailCheck className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-center text-xl font-bold">Check your email</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">We sent a 6-digit code to</p>
            <p className="text-center text-sm font-medium text-primary">{verifyEmail}</p>
            {devCode && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground"><KeyRound className="h-3 w-3" />Your verification code</p>
                <p className="mt-2 text-4xl font-bold tracking-[0.4em] spyro-text-gradient">{devCode}</p>
              </motion.div>
            )}
            <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} onKeyDown={(e) => e.key === "Enter" && verifyCode()} placeholder="000000" className="mt-6 w-full rounded-[18px] border border-border bg-secondary/50 py-4 text-center text-3xl font-bold tracking-[0.5em] focus:border-primary/40 focus:outline-none" autoFocus inputMode="numeric" />
            {codeError && <div className="mt-3 flex items-center gap-2 rounded-[18px] border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{codeError}</div>}
            <button onClick={verifyCode} disabled={codeLoading || code.length !== 6} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] spyro-bg-gradient py-3 text-sm font-semibold text-white transition-all hover:spyro-glow disabled:opacity-50">
              {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {codeLoading ? "Verifying…" : "Verify & Enter SPYRO"}
            </button>
            <div className="mt-4 flex items-center justify-between text-xs">
              <button onClick={() => { setStep("form"); setCode(""); setCodeError(null); setDevCode(null); }} className="text-muted-foreground hover:text-foreground">← Back</button>
              <button onClick={resendCode} disabled={resendDisabled} className="text-primary hover:underline disabled:opacity-50">{resendDisabled ? "Resend in 30s" : "Resend code"}</button>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted-foreground/50">Code expires in 10 minutes.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Landing / Auth ──────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-background gradient-mesh">
      {/* Floating lights */}
      <div className="floating-light animate-float" style={{ width: 400, height: 400, background: "#7C3AED", top: "-5%", left: "-5%" }} />
      <div className="floating-light animate-float" style={{ width: 300, height: 300, background: "#06B6D4", bottom: "5%", right: "5%", animationDelay: "3s" }} />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8">
        {/* Nav */}
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
              <SpyroLogo className="h-5 w-5 [&_svg]:h-full [&_svg]:w-full" />
            </div>
            <span className="text-lg font-bold tracking-tight">SPYRO</span>
          </div>
          <button onClick={() => setMode(mode === "register" ? "login" : "register")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {mode === "register" ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </nav>

        {/* Hero + Auth */}
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="grid w-full grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Hero */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="flex flex-col justify-center">
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                One AI.
                <br />
                <span className="spyro-text-gradient">Unlimited Work.</span>
              </h1>
              <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
                Your intelligent operating system for work, coding, research, automation, and creativity.
              </p>

              {/* Feature bento grid */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FEATURES.map((f, i) => (
                  <motion.div
                    key={f.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="group rounded-2xl border border-border bg-card/40 p-3 transition-all hover:border-primary/20 hover:bg-card/60"
                  >
                    <f.icon className="h-5 w-5 text-primary/70 transition-colors group-hover:text-primary" />
                    <div className="mt-2 text-xs font-medium">{f.title}</div>
                    <div className="text-[10px] text-muted-foreground/60">{f.desc}</div>
                  </motion.div>
                ))}
              </div>

              <p className="mt-6 text-xs text-muted-foreground/50">🇰🇪 Built in Kenya by Lewis Kariuki & SPYRO Labs</p>
            </motion.div>

            {/* Right: Auth card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="flex items-center justify-center">
              <div className="glass w-full max-w-sm rounded-[28px] p-8 shadow-elevated">
                <h2 className="text-xl font-bold">{mode === "register" ? "Create your account" : "Welcome back"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{mode === "register" ? "Start building with SPYRO in seconds." : "Sign in to your workspace."}</p>

                <div className="mt-6 space-y-3">
                  <AnimatePresence mode="wait">
                    {mode === "register" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full rounded-[18px] border border-border bg-secondary/50 py-2.5 pl-10 pr-3 text-sm focus:border-primary/30 focus:outline-none" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="you@example.com" className="w-full rounded-[18px] border border-border bg-secondary/50 py-2.5 pl-10 pr-3 text-sm focus:border-primary/30 focus:outline-none" />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Password (min 6 chars)" className="w-full rounded-[18px] border border-border bg-secondary/50 py-2.5 pl-10 pr-10 text-sm focus:border-primary/30 focus:outline-none" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" type="button">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {mode === "login" && (
                    <div className="text-right">
                      <button onClick={() => setShowForgot(true)} className="text-xs text-muted-foreground hover:text-primary">Forgot password?</button>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 rounded-[18px] border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive"><AlertCircle className="h-3.5 w-3.5 shrink-0" />{error}</div>
                  )}

                  <button onClick={submit} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-[18px] spyro-bg-gradient py-3 text-sm font-semibold text-white transition-all hover:spyro-glow disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{mode === "register" ? "Create Account" : "Sign In"}<ArrowRight className="h-4 w-4" /></>}
                  </button>

                  <div className="pt-2 text-center">
                    <button onClick={continueAsGuest} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                      Continue as guest → <span className="text-muted-foreground/50">(limited features)</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Forgot password modal */}
      <AnimatePresence>
        {showForgot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowForgot(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="glass-strong w-full max-w-sm rounded-[28px] p-6">
              {forgotSent ? (
                <div className="text-center">
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-green-500/15"><Check className="h-6 w-6 text-green-500" /></div>
                  <h3 className="text-lg font-bold">Check your email</h3>
                  <p className="mt-1 text-sm text-muted-foreground">If an account exists for {forgotEmail}, a reset link has been sent.</p>
                  <button onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail(""); }} className="mt-4 rounded-[18px] spyro-bg-gradient px-4 py-2 text-sm font-medium text-white">Close</button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold">Reset Password</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
                  <div className="relative mt-3">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-[18px] border border-border bg-secondary/50 py-2.5 pl-10 pr-3 text-sm focus:border-primary/30 focus:outline-none" autoFocus />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setShowForgot(false)} className="flex-1 rounded-[18px] border border-border py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                    <button onClick={sendForgotPassword} disabled={forgotLoading || !forgotEmail.trim()} className="flex-1 rounded-[18px] spyro-bg-gradient py-2 text-sm font-medium text-white disabled:opacity-50">{forgotLoading ? "Sending…" : "Send Link"}</button>
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
