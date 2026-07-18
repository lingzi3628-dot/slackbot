"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Shield, Lock, ArrowRight, Loader2, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08080A] px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[40vh] w-[60vw] -translate-x-1/2 rounded-full opacity-20"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.3) 0%, transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rose-600 to-violet-700 shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">SPYRO Operations</h1>
          <p className="mt-1 text-xs text-muted-foreground">Authorized personnel only</p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-xl">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="admin@spyro.ai"
                className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••••"
                className="w-full rounded-xl border border-border bg-secondary/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-center text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-rose-600 to-violet-700 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lock className="h-4 w-4" /> Secure Login <ArrowRight className="h-4 w-4" /></>}
          </button>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40">
            <Shield className="h-3 w-3" />
            Protected · All actions are logged
          </div>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground/30">
          SPYRO Operations Console · Internal use only
        </p>
      </motion.div>
    </div>
  );
}
