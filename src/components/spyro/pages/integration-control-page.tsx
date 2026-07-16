"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Mic,
  Volume2,
  Zap,
  Image as ImageIcon,
  Bell,
  Sparkles,
  Save,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplySettings {
  autoWebSearch: boolean;
  autoCodePreview: boolean;
  autoSpeak: boolean;
  godModeDefault: boolean;
  showProgressSteps: boolean;
  maxLength: number;
  temperature: number;
  model: string;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  autoScroll: boolean;
  compactMode: boolean;
}

const DEFAULT_SETTINGS: ReplySettings = {
  autoWebSearch: false,
  autoCodePreview: true,
  autoSpeak: false,
  godModeDefault: false,
  showProgressSteps: true,
  maxLength: 4000,
  temperature: 70,
  model: "openai",
  hapticsEnabled: true,
  notificationsEnabled: false,
  autoScroll: true,
  compactMode: false,
};

function Toggle({
  enabled,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: typeof Globe;
}) {
  return (
    <div className="surface-elevated flex items-center gap-3 rounded-xl p-4">
      <span className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
        enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[11px] text-muted-foreground">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          enabled ? "spyro-bg-gradient" : "bg-muted"
        )}
        aria-label={label}
      >
        <span className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          enabled ? "translate-x-5" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

export function IntegrationControl() {
  const [settings, setSettings] = React.useState<ReplySettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = React.useState(false);

  // Load from localStorage.
  React.useEffect(() => {
    const stored = localStorage.getItem("spyro-reply-settings");
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch { /* ignore */ }
    }
  }, []);

  const update = (key: keyof ReplySettings, value: unknown) => {
    setSettings((s) => ({ ...s, [key]: value }));
  };

  const save = () => {
    localStorage.setItem("spyro-reply-settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight">Integration Control</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control how SPYRO V1 replies and behaves.
        </p>
      </motion.div>

      {/* Reply Behavior */}
      <div className="mb-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Reply Behavior
        </h2>
        <div className="space-y-2">
          <Toggle
            enabled={settings.autoWebSearch}
            onChange={(v) => update("autoWebSearch", v)}
            label="Auto Web Search"
            description="Search the web automatically for current-events questions"
            icon={Globe}
          />
          <Toggle
            enabled={settings.autoCodePreview}
            onChange={(v) => update("autoCodePreview", v)}
            label="Auto Code Preview"
            description="Show progress bar + preview link when code is generated"
            icon={Sparkles}
          />
          <Toggle
            enabled={settings.autoSpeak}
            onChange={(v) => update("autoSpeak", v)}
            label="Auto Speak Replies"
            description="Automatically read SPYRO's replies aloud"
            icon={Volume2}
          />
          <Toggle
            enabled={settings.godModeDefault}
            onChange={(v) => update("godModeDefault", v)}
            label="God Mode Default"
            description="Use multi-agent collaboration by default for all messages"
            icon={Zap}
          />
          <Toggle
            enabled={settings.showProgressSteps}
            onChange={(v) => update("showProgressSteps", v)}
            label="Show Progress Steps"
            description="Show step-by-step progress when SPYRO is working"
            icon={Sparkles}
          />
        </div>
      </div>

      {/* Model Settings */}
      <div className="mb-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Model Settings
        </h2>
        <div className="surface-elevated space-y-4 rounded-xl p-4">
          {/* Model selector */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">Model</span>
              <span className="text-xs text-muted-foreground">{settings.model === "openai" ? "SPYRO V1" : "SPYRO V1 Turbo"}</span>
            </div>
            <div className="flex gap-2">
              {[
                { id: "openai", label: "SPYRO V1" },
                { id: "openai-fast", label: "SPYRO V1 Turbo" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => update("model", m.id)}
                  className={cn(
                    "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                    settings.model === m.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Temperature */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">Creativity (Temperature)</span>
              <span className="text-xs tabular-nums text-primary">{settings.temperature}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.temperature}
              onChange={(e) => update("temperature", parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/60">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max length */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">Max Reply Length</span>
              <span className="text-xs tabular-nums text-primary">{settings.maxLength} chars</span>
            </div>
            <input
              type="range"
              min={500}
              max={8000}
              step={500}
              value={settings.maxLength}
              onChange={(e) => update("maxLength", parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>
      </div>

      {/* App Preferences */}
      <div className="mb-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          App Preferences
        </h2>
        <div className="space-y-2">
          <Toggle
            enabled={settings.hapticsEnabled}
            onChange={(v) => update("hapticsEnabled", v)}
            label="Haptic Feedback"
            description="Vibration on send, stop, regenerate (mobile)"
            icon={Zap}
          />
          <Toggle
            enabled={settings.notificationsEnabled}
            onChange={(v) => update("notificationsEnabled", v)}
            label="Push Notifications"
            description="Get notified when background replies finish"
            icon={Bell}
          />
          <Toggle
            enabled={settings.autoScroll}
            onChange={(v) => update("autoScroll", v)}
            label="Auto-scroll to Latest"
            description="Automatically scroll to new messages"
            icon={Sparkles}
          />
          <Toggle
            enabled={settings.compactMode}
            onChange={(v) => update("compactMode", v)}
            label="Compact Mode"
            description="Smaller message bubbles, more per screen"
            icon={Sparkles}
          />
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={save}
        className="flex w-full items-center justify-center gap-2 rounded-xl spyro-bg-gradient py-3 text-sm font-semibold text-white transition-all hover:spyro-glow"
      >
        {saved ? (
          <><Check className="h-4 w-4" /> Saved!</>
        ) : (
          <><Save className="h-4 w-4" /> Save Settings</>
        )}
      </button>
    </div>
  );
}
