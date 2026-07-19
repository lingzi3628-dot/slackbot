"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, X, Sparkles, ScanSearch } from "lucide-react";
import { useProfileStore, TUTORIAL_STEPS } from "@/store/profile-store";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

export function TutorialOverlay() {
  const { tutorialStep, setTutorialStep, completeTutorial } = useProfileStore();
  const setView = useUIStore((s) => s.setView);

  if (tutorialStep < 0 || tutorialStep >= TUTORIAL_STEPS.length) return null;

  const step = TUTORIAL_STEPS[tutorialStep];
  const isLast = tutorialStep === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeTutorial();
    } else {
      // Navigate to the highlighted view
      if (step.highlight) {
        setView(step.highlight as any);
      }
      setTutorialStep(tutorialStep + 1);
    }
  };

  const handlePrev = () => {
    if (tutorialStep > 0) {
      const prevStep = TUTORIAL_STEPS[tutorialStep - 1];
      if (prevStep.highlight) {
        setView(prevStep.highlight as any);
      }
      setTutorialStep(tutorialStep - 1);
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      >
        {/* Backdrop with spotlight effect */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Spotlight pulse */}
        {step.highlight && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5 }}
            className="pointer-events-none absolute left-4 top-20 h-12 w-12 rounded-full border-2 border-primary"
            style={{ boxShadow: "0 0 40px 10px rgba(139,92,246,0.4)" }}
          >
            <Sparkles className="absolute -right-1 -top-1 h-4 w-4 text-primary" />
          </motion.div>
        )}

        {/* Tutorial card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="glass-strong relative w-full max-w-md overflow-hidden rounded-[24px] shadow-elevated"
        >
          {/* Header with step counter */}
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg spyro-bg-gradient">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Tour · {tutorialStep + 1}/{TUTORIAL_STEPS.length}
              </span>
            </div>
            <button onClick={handleSkip} className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Skip tutorial">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-secondary">
            <motion.div
              className="h-full spyro-bg-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${((tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Content */}
          <div className="px-5 py-5">
            <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>

            {/* Step indicators */}
            <div className="mt-4 flex items-center justify-center gap-1">
              {TUTORIAL_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const target = TUTORIAL_STEPS[i];
                    if (target.highlight) setView(target.highlight as any);
                    setTutorialStep(i);
                  }}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === tutorialStep ? "w-6 bg-primary" : i < tutorialStep ? "w-1.5 bg-primary/50" : "w-1.5 bg-secondary"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-5 py-3">
            <button
              onClick={handlePrev}
              disabled={tutorialStep === 0}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                tutorialStep === 0 ? "text-muted-foreground/30" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground">
              Skip tour
            </button>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-4 py-2 text-xs font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
            >
              {step.action}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
