"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, Sparkles, Zap, Crown, Rocket, Building2, Loader2,
  Shield, Terminal, Bot, ImageIcon, Mail, Server,
} from "lucide-react";
import { PLANS, type PlanId, formatKES } from "@/lib/premium-plans";
import { useLocalAuth } from "@/store/local-auth";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const PLAN_ICONS: Record<PlanId, typeof Sparkles> = {
  free: Sparkles,
  pro: Zap,
  plus: Rocket,
  ultra: Crown,
  business: Building2,
  enterprise: Server,
};

export function PremiumPage() {
  const user = useLocalAuth((s) => s.user);
  const setView = useUIStore((s) => s.setView);
  const [currentPlan, setCurrentPlan] = React.useState<PlanId>("free");
  const [initiating, setInitiating] = React.useState<PlanId | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Fetch current plan
  React.useEffect(() => {
    fetch("/api/premium/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCurrentPlan(data.planId))
      .catch(() => {});
  }, []);

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === "free" || planId === currentPlan) return;
    setError(null);
    setInitiating(planId);
    try {
      const email = user?.email || "guest@spyro.ai";
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId, email }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        // Redirect to Paystack payment page
        window.location.href = data.authorizationUrl;
      } else {
        setError(data.error || "Failed to initiate payment");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setInitiating(null);
    }
  };

  return (
    <div className="ambient-mesh min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Upgrade to SPYRO Premium</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Unlock real terminal, AI agents, unlimited tokens, and more. Pay with M-Pesa, card, or bank transfer.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] text-emerald-400">
            <Shield className="h-3 w-3" />
            Secure payments via Paystack · M-Pesa · Cards · Bank Transfer
          </div>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-4 max-w-md rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-center text-xs text-destructive"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Plans grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.id];
            const isCurrent = plan.id === currentPlan;
            const isInitiating = initiating === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "relative flex flex-col rounded-3xl border p-5",
                  plan.highlight ? "border-primary spyro-glow" : "border-border bg-card/40",
                  isCurrent && "ring-2 ring-emerald-500/40"
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full spyro-bg-gradient px-3 py-0.5 text-[10px] font-bold text-white">
                    MOST POPULAR
                  </span>
                )}
                {isCurrent && (
                  <span className="absolute -top-3 right-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                    CURRENT
                  </span>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "grid h-10 w-10 place-items-center rounded-xl",
                    plan.highlight ? "spyro-bg-gradient" : "bg-secondary"
                  )}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{plan.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{plan.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.priceLabel}</span>
                  <span className="text-[11px] text-muted-foreground">{plan.period}</span>
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.id === "free" || isCurrent || isInitiating}
                  className={cn(
                    "mt-3 w-full rounded-xl py-2.5 text-xs font-semibold transition-all",
                    isCurrent ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" :
                    plan.id === "free" ? "border border-border bg-secondary text-muted-foreground" :
                    plan.highlight ? "spyro-bg-gradient text-white hover:scale-[1.02]" :
                    "border border-border bg-card hover:bg-secondary"
                  )}
                >
                  {isInitiating ? (
                    <span className="flex items-center justify-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Redirecting…</span>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : plan.id === "free" ? (
                    "Free Forever"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>

                {/* Feature list */}
                <ul className="mt-4 space-y-1.5">
                  {plan.featureList.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <h2 className="text-center text-xl font-bold">Feature Comparison</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="mx-auto w-full max-w-4xl border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-2 text-left font-semibold text-muted-foreground">Feature</th>
                  {PLANS.map((p) => (
                    <th key={p.id} className={cn("p-2 text-center font-semibold", p.highlight && "text-primary")}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "AI Tokens / month", key: "tokens", format: (v: number) => v === -1 ? "Unlimited" : v.toLocaleString() },
                  { label: "Real Terminal", key: "terminal", format: (v: boolean) => v ? "✓" : "—" },
                  { label: "AI Agents", key: "agents", format: (v: boolean) => v ? "✓" : "—" },
                  { label: "Custom Agents", key: "customAgents", format: (v: number) => v === -1 ? "Unlimited" : v },
                  { label: "Image Generations", key: "imageGen", format: (v: number) => v === -1 ? "Unlimited" : v },
                  { label: "Email Verifications", key: "emailVerif", format: (v: number) => v === -1 ? "Unlimited" : v },
                  { label: "SPYRO Studio", key: "studio", format: (v: boolean) => v ? "✓" : "—" },
                  { label: "WhatsApp Connection", key: "whatsapp", format: (v: boolean) => v ? "✓" : "—" },
                  { label: "Knowledge Docs", key: "knowledge", format: (v: number) => v === -1 ? "Unlimited" : v },
                  { label: "Storage", key: "storage", format: (v: string) => v },
                  { label: "Background Jobs", key: "backgroundJobs", format: (v: number) => v === -1 ? "Unlimited" : v },
                  { label: "API Access", key: "apiAccess", format: (v: boolean) => v ? "✓" : "—" },
                  { label: "Team Members", key: "teamMembers", format: (v: number) => v === -1 ? "Unlimited" : v === 0 ? "Solo" : v },
                  { label: "Public URLs", key: "publicUrls", format: (v: number) => v === -1 ? "Unlimited" : v },
                  { label: "Priority Support", key: "prioritySupport", format: (v: boolean) => v ? "✓" : "—" },
                ].map((row) => (
                  <tr key={row.key} className="border-b border-border/50">
                    <td className="p-2 text-left text-muted-foreground">{row.label}</td>
                    {PLANS.map((p) => {
                      const value = (p.features as any)[row.key];
                      return (
                        <td key={p.id} className={cn("p-2 text-center", p.highlight && "bg-primary/5")}>
                          {row.format(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Payment methods */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground">
          <span>Supported payment methods:</span>
          {["M-Pesa", "Visa", "Mastercard", "Bank Transfer", "Airtel Money"].map((m) => (
            <span key={m} className="rounded-full border border-border bg-card px-2.5 py-1 font-medium">{m}</span>
          ))}
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-10 max-w-2xl">
          <h2 className="text-center text-xl font-bold">Frequently Asked Questions</h2>
          <div className="mt-4 space-y-3">
            {[
              { q: "Can I pay with M-Pesa?", a: "Yes! Paystack supports M-Pesa, Airtel Money, Visa, Mastercard, and bank transfer. You'll see all options at checkout." },
              { q: "Can I cancel anytime?", a: "Yes. Cancel from Settings → Billing. Your plan stays active until the end of the billing period." },
              { q: "What are AI tokens?", a: "Tokens are units of AI usage. Each message you send and receive uses tokens. Free plan has 1,000/month, Pro has 50,000." },
              { q: "Do tokens roll over?", a: "No, tokens reset at the start of each billing cycle. Upgrade anytime for more." },
              { q: "Is there a free trial?", a: "The Free plan is free forever — no trial limit. Upgrade when you need more power." },
              { q: "What happens when I hit my limit?", a: "You'll see a friendly upgrade prompt. Your data is never deleted — upgrade and continue where you left off." },
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/40 p-4">
                <h3 className="text-sm font-semibold">{faq.q}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back */}
        <div className="mt-8 text-center">
          <button onClick={() => setView("home")} className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
