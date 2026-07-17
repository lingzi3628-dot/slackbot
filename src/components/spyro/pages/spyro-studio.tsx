"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket, Check, X, Plus, Minus, Maximize2, LayoutGrid,
  Columns, Square, Search, Download, Settings as SettingsIcon,
  Power, ChevronLeft, Sparkles, Bot, MessageCircle, Zap,
  Clock, Folder, Smartphone, Shield, ArrowRight,
} from "lucide-react";
import { useStudioStore } from "@/store/studio-store";
import { STUDIO_TYPES, getStudioType, type StudioApp } from "@/lib/studio-types";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { TerminalApp } from "./studio-apps/terminal-app";
import { CodeEditorApp } from "./studio-apps/code-editor-app";
import { AIWordApp } from "./studio-apps/ai-word-app";
import { AISpreadsheetApp } from "./studio-apps/ai-spreadsheet-app";
import { AIChatApp, RestClientApp, ResearchBrowserApp } from "./studio-apps/ai-chat-app";

// ── Main Studio Entry Point ───────────────────────────────────────────
export function SpyroStudio() {
  const hasSelectedStudio = useStudioStore((s) => s.hasSelectedStudio);
  const isInStudio = useStudioStore((s) => s.isInStudio);
  const [launching, setLaunching] = React.useState(false);

  // Not selected yet → show type selector
  if (!hasSelectedStudio) {
    return <StudioTypeSelector />;
  }

  // Launching → show cinematic transition
  if (launching) {
    return <StudioLaunchTransition onComplete={() => { setLaunching(false); useStudioStore.getState().enterStudio(); }} />;
  }

  // In Studio → show the environment
  if (isInStudio) {
    return <StudioEnvironment />;
  }

  // Not in Studio yet → show launch button
  return <StudioLaunchScreen onLaunch={() => setLaunching(true)} />;
}

// ── Studio Type Selector (first launch) ───────────────────────────────
function StudioTypeSelector() {
  const selectStudio = useStudioStore((s) => s.selectStudio);
  const setView = useUIStore((s) => s.setView);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirming(true);
    setTimeout(() => {
      selectStudio(selected);
      useStudioStore.getState().enterStudio();
    }, 800);
  };

  return (
    <div className="ambient-mesh min-h-full">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What are you working on today?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a Studio type. This changes your working environment — not your projects, chats, or data.
          </p>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {STUDIO_TYPES.map((studio, i) => (
            <motion.button
              key={studio.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(studio.id)}
              className={cn(
                "group surface p-4 text-left transition-all hover:spyro-glow",
                selected === studio.id && "ring-2 ring-primary"
              )}
            >
              <div className={cn(
                "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-soft transition-transform group-hover:scale-110",
                studio.color
              )}>
                <studio.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{studio.name}</h3>
              <p className="mt-0.5 line-clamp-2 text-[10px] text-muted-foreground">{studio.tagline}</p>
            </motion.button>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setView("home")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Home
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || confirming}
            className="inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-5 py-2.5 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02] disabled:opacity-40"
          >
            {confirming ? (
              <><Sparkles className="h-4 w-4 animate-spin" /> Setting up…</>
            ) : (
              <><Rocket className="h-4 w-4" /> Launch Studio</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cinematic Launch Transition ───────────────────────────────────────
function StudioLaunchTransition({ onComplete }: { onComplete: () => void }) {
  const steps = [
    { label: "Preparing AI Workspace…", icon: Sparkles },
    { label: "Loading Knowledge…", icon: Folder },
    { label: "Connecting Agents…", icon: Bot },
    { label: "Restoring Layout…", icon: LayoutGrid },
    { label: "Opening Studio…", icon: Rocket },
  ];
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => setCurrentStep((s) => s + 1), 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, 400);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
    >
      <div className="gradient-mesh absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center">
        {/* Pulsing logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="ember-aura relative grid h-24 w-24 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong"
        >
          <Rocket className="h-12 w-12 text-white" />
        </motion.div>

        {/* Steps */}
        <div className="mt-8 w-full max-w-xs space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all",
                currentStep > i ? "bg-emerald-500 text-white" :
                currentStep === i ? "bg-primary text-primary-foreground" :
                "bg-secondary text-muted-foreground"
              )}>
                {currentStep > i ? <Check className="h-3 w-3" /> :
                 currentStep === i ? <Sparkles className="h-3 w-3 animate-spin" /> :
                 <span className="text-[9px]">{i + 1}</span>}
              </div>
              <span className={cn("text-xs transition-colors", currentStep > i ? "text-foreground" : currentStep === i ? "text-foreground font-medium" : "text-muted-foreground")}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Studio Launch Screen (before entering) ────────────────────────────
function StudioLaunchScreen({ onLaunch }: { onLaunch: () => void }) {
  const studioType = useStudioStore((s) => s.studioType);
  const setView = useUIStore((s) => s.setView);

  return (
    <div className="ambient-mesh min-h-full">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className={cn(
            "ember-aura relative grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-elevated",
            studioType?.color || "from-violet-500 to-cyan-500"
          )}
        >
          <Rocket className="h-12 w-12" />
        </motion.div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          {studioType?.name || "SPYRO"} Studio
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {studioType?.description || "An intelligent AI computing environment for deep work."}
        </p>

        {/* What's inside */}
        {studioType && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {studioType.apps.slice(0, 6).map((app) => (
              <span key={app.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[10px]">
                <app.icon className="h-3 w-3" />
                {app.name}
              </span>
            ))}
            {studioType.apps.length > 6 && (
              <span className="text-[10px] text-muted-foreground">+{studioType.apps.length - 6} more</span>
            )}
          </div>
        )}

        <button
          onClick={onLaunch}
          className="mt-8 inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-6 py-3 text-sm font-medium text-white shadow-soft transition-transform hover:scale-[1.02]"
        >
          <Rocket className="h-5 w-5" />
          Launch Studio
        </button>

        <button
          onClick={() => setView("home")}
          className="mt-3 text-xs text-muted-foreground hover:text-foreground"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

// ── Studio Environment (the main workspace) ───────────────────────────
function StudioEnvironment() {
  const studioType = useStudioStore((s) => s.studioType);
  const installedAppIds = useStudioStore((s) => s.installedAppIds);
  const openWindows = useStudioStore((s) => s.openWindows);
  const openApp = useStudioStore((s) => s.openApp);
  const closeWindow = useStudioStore((s) => s.closeWindow);
  const minimizeWindow = useStudioStore((s) => s.minimizeWindow);
  const maximizeWindow = useStudioStore((s) => s.maximizeWindow);
  const exitStudio = useStudioStore((s) => s.exitStudio);
  const layout = useStudioStore((s) => s.layout);
  const setLayout = useStudioStore((s) => s.setLayout);
  const setView = useUIStore((s) => s.setView);
  const [showAppStore, setShowAppStore] = React.useState(false);

  // All apps = core apps + installed apps from the store
  const allApps = React.useMemo(() => {
    if (!studioType) return [];
    const core = studioType.apps;
    const installed = studioType.appStore.filter((a) => installedAppIds.includes(a.id));
    return [...core, ...installed];
  }, [studioType, installedAppIds]);

  const activeWindows = openWindows.filter((w) => !w.minimized);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ── Studio Top Bar ──────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/60 px-3 py-2 backdrop-blur-xl">
        {/* Exit */}
        <button
          onClick={() => { exitStudio(); setView("home"); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium hover:bg-secondary"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Exit Studio
        </button>

        {/* Studio name */}
        <div className="flex items-center gap-2">
          <div className={cn("grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br", studioType?.color || "from-violet-500 to-cyan-500")}>
            {studioType && <studioType.icon className="h-3.5 w-3.5 text-white" />}
          </div>
          <span className="text-xs font-semibold">{studioType?.name} Studio</span>
        </div>

        {/* Layout switcher */}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setLayout("tabs")} className={cn("grid h-7 w-7 place-items-center rounded-lg", layout === "tabs" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")} aria-label="Tabs">
            <Square className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setLayout("split")} className={cn("grid h-7 w-7 place-items-center rounded-lg", layout === "split" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")} aria-label="Split">
            <Columns className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setLayout("single")} className={cn("grid h-7 w-7 place-items-center rounded-lg", layout === "single" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")} aria-label="Single">
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px bg-border" />

          {/* App Store */}
          <button
            onClick={() => setShowAppStore(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-medium hover:bg-secondary"
          >
            <Download className="h-3.5 w-3.5" />
            App Store
          </button>
        </div>
      </div>

      {/* ── Studio Body ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* App Dock (left) */}
        <div className="w-16 shrink-0 overflow-y-auto border-r border-border bg-sidebar/40 p-2">
          <div className="space-y-1">
            {allApps.map((app) => (
              <button
                key={app.id}
                onClick={() => openApp(app.id, app.name)}
                className={cn(
                  "group grid w-full place-items-center rounded-xl p-2 transition-all",
                  openWindows.some((w) => w.appId === app.id) ? "bg-primary/10" : "hover:bg-secondary/50"
                )}
                title={app.name}
              >
                <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft transition-transform group-hover:scale-110", app.color)}>
                  <app.icon className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>

          {/* Divider + AI */}
          <div className="my-2 h-px bg-border" />
          <button
            onClick={() => openApp("ai-assistant", "AI Assistant")}
            className="group grid w-full place-items-center rounded-xl p-2 hover:bg-secondary/50"
            title="AI Assistant"
          >
            <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient text-white shadow-soft transition-transform group-hover:scale-110">
              <Sparkles className="h-4 w-4" />
            </div>
          </button>
        </div>

        {/* Workspace area */}
        <div className="min-w-0 flex-1 overflow-hidden">
          {activeWindows.length === 0 ? (
            <StudioWelcome studioName={studioType?.name || "SPYRO"} onOpenApp={(id, name) => openApp(id, name)} apps={allApps} />
          ) : layout === "split" ? (
            <SplitView windows={activeWindows} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} />
          ) : layout === "single" ? (
            <SingleView windows={activeWindows} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} />
          ) : (
            <TabsView windows={activeWindows} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} />
          )}
        </div>
      </div>

      {/* App Store modal */}
      <AnimatePresence>
        {showAppStore && studioType && (
          <StudioAppStore
            studioType={studioType}
            installedAppIds={installedAppIds}
            onInstall={(id) => useStudioStore.getState().installApp(id)}
            onUninstall={(id) => useStudioStore.getState().uninstallApp(id)}
            onClose={() => setShowAppStore(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Studio Welcome (no windows open) ──────────────────────────────────
function StudioWelcome({ studioName, onOpenApp, apps }: { studioName: string; onOpenApp: (id: string, name: string) => void; apps: StudioApp[] }) {
  return (
    <div className="ambient-mesh flex h-full flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="ember-aura relative grid h-16 w-16 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong"
      >
        <Sparkles className="h-8 w-8 text-white" />
      </motion.div>
      <h2 className="mt-4 text-xl font-bold">Welcome to {studioName} Studio</h2>
      <p className="mt-1 text-xs text-muted-foreground">Open an app from the dock to start working</p>

      {/* Quick launch grid */}
      <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {apps.slice(0, 8).map((app) => (
          <button
            key={app.id}
            onClick={() => onOpenApp(app.id, app.name)}
            className="group surface p-3 transition-all hover:spyro-glow"
          >
            <div className={cn("mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft transition-transform group-hover:scale-110", app.color)}>
              <app.icon className="h-5 w-5" />
            </div>
            <p className="mt-1.5 text-[10px] font-medium">{app.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Tabs View ─────────────────────────────────────────────────────────
function TabsView({ windows, onClose, onMinimize, onMaximize }: any) {
  const [activeId, setActiveId] = React.useState(windows[0]?.id);
  const active = windows.find((w: any) => w.id === activeId) || windows[0];

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-card/40 px-2 py-1">
        {windows.map((w: any) => (
          <button
            key={w.id}
            onClick={() => setActiveId(w.id)}
            className={cn(
              "group flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] transition-colors",
              activeId === w.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50"
            )}
          >
            <span>{w.appName}</span>
            <button onClick={(e) => { e.stopPropagation(); onClose(w.id); }} className="grid h-4 w-4 place-items-center rounded hover:bg-destructive/10 hover:text-destructive">
              <X className="h-2.5 w-2.5" />
            </button>
          </button>
        ))}
      </div>
      {/* Active window content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        {active && <AppContent appId={active.appId} appName={active.appName} />}
      </div>
    </div>
  );
}

// ── Split View ────────────────────────────────────────────────────────
function SplitView({ windows, onClose, onMinimize, onMaximize }: any) {
  return (
    <div className="grid h-full grid-cols-2 gap-1 p-1">
      {windows.slice(0, 2).map((w: any) => (
        <div key={w.id} className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-1.5">
            <span className="text-[11px] font-medium">{w.appName}</span>
            <button onClick={() => onClose(w.id)} className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <AppContent appId={w.appId} appName={w.appName} />
          </div>
        </div>
      ))}
      {windows.length < 2 && (
        <div className="grid place-items-center rounded-xl border border-dashed border-border">
          <p className="text-xs text-muted-foreground">Open another app to split view</p>
        </div>
      )}
    </div>
  );
}

// ── Single View ───────────────────────────────────────────────────────
function SingleView({ windows, onClose, onMinimize, onMaximize }: any) {
  const active = windows[windows.length - 1];
  if (!active) return null;
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] font-medium">{active.appName}</span>
        <button onClick={() => onClose(active.id)} className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <AppContent appId={active.appId} appName={active.appName} />
      </div>
    </div>
  );
}

// ── App Content (renders inside windows) ──────────────────────────────
function AppContent({ appId, appName }: { appId: string; appName: string }) {
  // Route to functional app components based on appId
  switch (appId) {
    case "terminal":
      return <TerminalApp />;
    case "code-editor":
      return <CodeEditorApp />;
    case "word":
    case "ai-word":
    case "pdf":
      return <AIWordApp />;
    case "spreadsheet":
    case "excel":
    case "ai-spreadsheet":
      return <AISpreadsheetApp />;
    case "rest-client":
    case "api-testing":
      return <RestClientApp />;
    case "browser":
    case "research-browser":
    case "academic-search":
    case "research":
      return <ResearchBrowserApp />;
    case "ai-assistant":
    case "ai-tutor":
    case "ai-coding":
    case "ai-research":
    case "ai-pair-programmer":
      return <AIChatApp appName={appName} />;
    default:
      // For all other apps, use the AI chat interface with the app name as context
      return <AIChatApp appName={appName} />;
  }
}

// ── Studio App Store ──────────────────────────────────────────────────
function StudioAppStore({ studioType, installedAppIds, onInstall, onUninstall, onClose }: {
  studioType: any;
  installedAppIds: string[];
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 95 }}
      className="flex items-start justify-center overflow-y-auto p-4 sm:items-center"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="glass-strong relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] shadow-elevated"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">App Store — {studioType.name}</h2>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-4">
          {studioType.appStore.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No additional apps available for this Studio type yet.
            </div>
          ) : (
            <div className="space-y-2">
              {studioType.appStore.map((app: any) => {
                const installed = installedAppIds.includes(app.id);
                return (
                  <div key={app.id} className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", app.color)}>
                      <app.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{app.name}</div>
                      <div className="text-[10px] text-muted-foreground">Recommended for {studioType.name}</div>
                    </div>
                    <button
                      onClick={() => installed ? onUninstall(app.id) : onInstall(app.id)}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors",
                        installed ? "border border-border bg-card text-muted-foreground hover:bg-secondary" : "spyro-bg-gradient text-white"
                      )}
                    >
                      {installed ? "Uninstall" : "Install"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Privacy notice */}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[10px] text-cyan-400">
            <Shield className="mt-0.5 h-3 w-3 shrink-0" />
            <div>All apps share the same SPYRO data — no duplicates. Your projects, chats, and knowledge stay synchronized.</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
