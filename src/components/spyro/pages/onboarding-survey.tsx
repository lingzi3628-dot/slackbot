"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, Sparkles, X } from "lucide-react";
import { useProfileStore, SURVEY_STEPS } from "@/store/profile-store";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface OnboardingSurveyProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingSurvey({ onComplete, onSkip }: OnboardingSurveyProps) {
  const { setProfile, completeSurvey } = useProfileStore();
  const [stepIdx, setStepIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({});

  const step = SURVEY_STEPS[stepIdx];
  const isLast = stepIdx === SURVEY_STEPS.length - 1;
  const currentAnswer = answers[step.id];
  const canProceed = step.type === "multi" ? (currentAnswer as string[])?.length > 0 : !!currentAnswer;

  const toggleMulti = (value: string) => {
    const current = (answers[step.id] as string[]) || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setAnswers((prev) => ({ ...prev, [step.id]: next }));
  };

  const handleNext = () => {
    if (isLast) {
      // Save all answers to the profile store
      Object.entries(answers).forEach(([key, value]) => {
        setProfile({ [key]: value } as any);
      });
      completeSurvey();
      onComplete?.();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (stepIdx > 0) setStepIdx((i) => i - 1);
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
        className="glass-strong relative flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[28px] shadow-elevated"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg spyro-bg-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold">Quick setup</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {SURVEY_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === stepIdx ? "w-6 bg-primary" : i < stepIdx ? "w-1.5 bg-primary/60" : "w-1.5 bg-secondary"
                  )}
                />
              ))}
            </div>
            {onSkip && (
              <button onClick={onSkip} className="text-xs text-muted-foreground hover:text-foreground">
                Skip
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-xl font-bold tracking-tight">{step.question}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{step.subtitle}</p>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {step.options.map((opt) => {
                  const isSelected = step.type === "multi"
                    ? ((answers[step.id] as string[]) || []).includes(opt.value)
                    : answers[step.id] === opt.value;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        if (step.type === "multi") {
                          toggleMulti(opt.value);
                        } else {
                          setAnswers((prev) => ({ ...prev, [step.id]: opt.value }));
                        }
                      }}
                      className={cn(
                        "group flex items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-border bg-card/40 hover:bg-secondary/40"
                      )}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{opt.value}</div>
                        {opt.desc && <div className="text-[11px] text-muted-foreground">{opt.desc}</div>}
                      </div>
                      {isSelected && (
                        <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={handleBack}
            disabled={stepIdx === 0}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-colors",
              stepIdx === 0 ? "text-muted-foreground/30" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-40"
          >
            {isLast ? "Finish" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
