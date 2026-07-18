"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Lock, X, Zap, Check } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { PLANS, type PlanId } from "@/lib/premium-plans";

interface PremiumGateProps {
  /** The feature being gated */
  feature: "terminal" | "agents" | "studio" | "whatsapp" | "image" | "email" | "api" | "integrations";
  /** Children to render if allowed */
  children: React.ReactNode;
  /** Fallback to render if blocked (optional) */
  fallback?: React.ReactNode;
}

interface GateState {
  allowed: boolean;
  reason: string;
  planId: PlanId;
  planName: string;
}

// Cache the plan check
let planCache: { state: GateState | null; fetchedAt: number } = { state: null, fetchedAt: 0 };

export function usePremiumGate() {
  const [state, setState] = React.useState<GateState | null>(null);
  const [loading, setLoading] = React.useState(true);

  const check = React.useCallback(async (feature: string) => {
    // Check cache (10s)
    const now = Date.now();
    if (planCache.state && now - planCache.fetchedAt < 10000) {
      const res = await fetch("/api/premium/usage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: feature }),
      });
      const data = await res.json();
      setState(data);
      setLoading(false);
      return data;
    }
    try {
      const res = await fetch("/api/premium/usage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: feature }),
      });
      const data = await res.json();
      setState(data);
      planCache = { state: data, fetchedAt: now };
      setLoading(false);
      return data;
    } catch {
      // Default to free plan if backend unavailable
      const fallback: GateState = {
        allowed: false,
        reason: "This feature requires a premium plan.",
        planId: "free",
        planName: "Free",
      };
      setState(fallback);
      setLoading(false);
      return fallback;
    }
  }, []);

  return { state, loading, check };
}

export function PremiumGate({ feature, children, fallback }: PremiumGateProps) {
  const { state, loading, check } = usePremiumGate();
  const setView = useUIStore((s) => s.setView);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

  React.useEffect(() => {
    check(feature);
  }, [feature, check]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div>;
  }

  if (state?.allowed) {
    return <>{children}</>;
  }

  // Feature is locked — show lock overlay or fallback
  if (fallback) return <>{fallback}</>;

  return (
    <>
      <LockedFeatureOverlay
        feature={feature}
        reason={state?.reason || "This feature requires a premium plan."}
        onUpgrade={() => setShowUpgradeModal(true)}
      >
        {children}
      </LockedFeatureOverlay>

      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradeModal onClose={() => setShowUpgradeModal(false)} feature={feature} />
        )}
      </AnimatePresence>
    </>
  );
}

function LockedFeatureOverlay({
  feature,
  reason,
  onUpgrade,
  children,
}: {
  feature: string;
  reason: string;
  onUpgrade: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {/* Blurred/dimmed content behind */}
      <div className="pointer-events-none select-none opacity-30 blur-sm">
        {children}
      </div>

      {/* Lock overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/15"
        >
          <Lock className="h-8 w-8 text-amber-400" />
        </motion.div>

        <h3 className="mt-4 text-lg font-bold capitalize">{feature} is locked</h3>
        <p className="mt-1 max-w-xs text-center text-xs text-muted-foreground">{reason}</p>

        <button
          onClick={onUpgrade}
          className="mt-4 inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
        >
          <Crown className="h-4 w-4" />
          Upgrade to unlock
        </button>
      </motion.div>
    </div>
  );
}

function UpgradeModal({ onClose, feature }: { onClose: () => void; feature: string }) {
  const setView = useUIStore((s) => s.setView);

  const handleGoToPlans = () => {
    onClose();
    setView("premium");
  };

  // Find the minimum plan that unlocks this feature
  const minPlan = PLANS.find((p) => {
    switch (feature) {
      case "terminal": return p.features.terminal;
      case "agents": return p.features.agents;
      case "studio": return p.features.studio;
      case "whatsapp": return p.features.whatsapp;
      case "image": return p.features.imageGen > 3;
      case "email": return p.features.emailVerif > 3;
      case "api": return p.features.apiAccess;
      case "integrations": return p.features.apiAccess; // integrations requires same tier as API
      default: return false;
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 95 }}
      className="flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="glass-strong relative w-full max-w-md overflow-hidden rounded-[28px] shadow-elevated"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg spyro-bg-gradient">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold">Upgrade to unlock {feature}</h2>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {minPlan && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/60">Minimum plan</div>
                  <div className="text-lg font-bold">{minPlan.name}</div>
                  <div className="text-sm text-muted-foreground">{minPlan.priceLabel} / {minPlan.period}</div>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl spyro-bg-gradient">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>

              <ul className="mt-3 space-y-1">
                {minPlan.featureList.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Pay with M-Pesa, card, or bank transfer. Cancel anytime.
          </p>

          <button
            onClick={handleGoToPlans}
            className="mt-4 w-full rounded-xl spyro-bg-gradient py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:scale-[1.02]"
          >
            View all plans →
          </button>
          <button
            onClick={onClose}
            className="mt-2 w-full rounded-xl border border-border bg-card py-2 text-xs font-medium text-muted-foreground hover:bg-secondary"
          >
            Maybe later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Usage badge component ─────────────────────────────────────────────
export function UsageBadge({ feature, used, limit }: { feature: string; used: number; limit: number }) {
  if (limit === -1) return null; // unlimited
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  const isLow = remaining <= Math.max(1, limit * 0.1);
  const isDone = remaining === 0;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-medium",
      isDone ? "bg-destructive/10 text-destructive" :
      isLow ? "bg-amber-500/10 text-amber-400" :
      "bg-secondary text-muted-foreground"
    )}>
      {isDone ? <Lock className="h-2.5 w-2.5" /> : null}
      {isDone ? "Limit reached" : `${remaining}/${limit} ${feature} left`}
    </div>
  );
}
