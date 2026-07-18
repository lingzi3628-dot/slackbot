"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ArrowRight, ArrowLeft, Sparkles, X, Zap,
  Bot, LayoutGrid, BookOpen, Zap as ZapIcon,
} from "lucide-react";
import { useWorkspaceStore, WORKSPACE_TEMPLATES } from "@/store/workspace-store";
import type { WorkspaceTemplate } from "@/lib/workspace-templates";
import { cn } from "@/lib/utils";

interface WorkspaceOnboardingProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function WorkspaceOnboarding({ onComplete, onSkip }: WorkspaceOnboardingProps) {
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const [step, setStep] = React.useState<"select" | "preview" | "provisioning">("select");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [provisionStep, setProvisionStep] = React.useState(0);

  const selected = WORKSPACE_TEMPLATES.find((t) => t.id === selectedId);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setStep("preview");
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    setStep("provisioning");
    setProvisionStep(0);

    // Simulate provisioning steps
    const steps = ["Navigation", "Dashboard", "AI Agents", "Knowledge", "Apps", "Automations"];
    steps.forEach((_, i) => {
      setTimeout(() => setProvisionStep(i + 1), i * 400);
    });

    // Complete after all steps
    setTimeout(() => {
      selectWorkspace(selectedId);
      onComplete?.();
    }, steps.length * 400 + 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 100 }}
      className="flex items-start justify-center overflow-y-auto bg-background p-4 sm:items-center"
    >
      <div className="absolute inset-0 gradient-mesh" />

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="glass-strong relative flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] shadow-elevated"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg spyro-bg-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold">Choose your workspace</h2>
          </div>
          {onSkip && step === "select" && (
            <button
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip for now
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: SELECT — grid of templates */}
            {step === "select" && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  Select a workspace tailored to your profession. SPYRO adapts its dashboard, agents, and apps to match.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {WORKSPACE_TEMPLATES.map((template, i) => (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => handleSelect(template.id)}
                      className={cn(
                        "group surface p-4 text-left transition-all hover:spyro-glow",
                        selectedId === template.id && "ring-2 ring-primary"
                      )}
                    >
                      <div className={cn(
                        "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft transition-transform group-hover:scale-110",
                        template.color
                      )}>
                        <template.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mt-3 text-sm font-semibold">{template.name}</h3>
                      <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{template.tagline}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 2: PREVIEW — what gets provisioned */}
            {step === "preview" && selected && (
              <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-elevated",
                    selected.color
                  )}>
                    <selected.icon className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">{selected.name} Workspace</h3>
                    <p className="text-sm text-muted-foreground">{selected.description}</p>
                  </div>
                </div>

                {/* What gets provisioned */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {/* Agents */}
                  <ProvisionPreview
                    icon={Bot}
                    title="AI Agents"
                    color="text-violet-400"
                    items={selected.agents.map((a) => `${a.name} — ${a.role}`)}
                  />
                  {/* Apps */}
                  <ProvisionPreview
                    icon={LayoutGrid}
                    title="Suggested Apps"
                    color="text-cyan-400"
                    items={selected.apps.map((a) => a.name)}
                  />
                  {/* Knowledge */}
                  <ProvisionPreview
                    icon={BookOpen}
                    title="Knowledge Collections"
                    color="text-emerald-400"
                    items={selected.knowledgeCollections.length > 0 ? selected.knowledgeCollections : ["General"]}
                  />
                  {/* Automations */}
                  <ProvisionPreview
                    icon={ZapIcon}
                    title="Automation Templates"
                    color="text-amber-400"
                    items={selected.automationTemplates.length > 0 ? selected.automationTemplates : ["Manual workflows"]}
                  />
                </div>

                {/* Dashboard widgets */}
                <div className="mt-4 rounded-xl border border-border bg-card/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                    Dashboard widgets
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.widgets.map((w) => (
                      <span key={w.id} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                        <w.icon className="h-2.5 w-2.5" />
                        {w.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => setStep("select")}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
                  >
                    <Zap className="h-4 w-4" />
                    Create {selected.name} workspace
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PROVISIONING */}
            {step === "provisioning" && selected && (
              <motion.div key="provisioning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-8">
                <div className={cn(
                  "grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-elevated",
                  selected.color
                )}>
                  <selected.icon className="h-10 w-10" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">Setting up your {selected.name} workspace</h3>
                <p className="mt-1 text-xs text-muted-foreground">Provisioning agents, apps, and knowledge…</p>

                <div className="mt-6 w-full max-w-xs space-y-2">
                  {["Navigation", "Dashboard", "AI Agents", "Knowledge Collections", "Suggested Apps", "Automation Templates"].map((item, i) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors",
                        provisionStep > i ? "bg-emerald-500 text-white" : provisionStep === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                      )}>
                        {provisionStep > i ? <Check className="h-3 w-3" /> : provisionStep === i ? <Spinner /> : <span className="text-[9px]">{i + 1}</span>}
                      </div>
                      <span className={cn("text-xs", provisionStep > i ? "text-foreground" : "text-muted-foreground")}>{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Provision preview card ────────────────────────────────────────────
function ProvisionPreview({ icon: Icon, title, color, items }: { icon: typeof Bot; title: string; color: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-xs font-semibold">{title}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{items.length}</span>
      </div>
      <ul className="space-y-1">
        {items.slice(0, 4).map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-current" />
            <span className="line-clamp-1">{item}</span>
          </li>
        ))}
        {items.length > 4 && <li className="text-[10px] text-muted-foreground/60">+{items.length - 4} more</li>}
      </ul>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
