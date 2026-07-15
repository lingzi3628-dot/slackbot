"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Upload,
  Download,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sun,
  Contrast,
  Palette,
  Sparkles,
  Image as ImageIcon,
  Wand2,
  Crop,
  Undo2,
  Eye,
  Sliders,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Edit operation definitions ─────────────────────────────────────────
interface EditOp {
  id: string;
  label: string;
  icon: typeof Sun;
  category: "adjust" | "filter" | "transform";
  hasSlider?: boolean;
  min?: number;
  max?: number;
  step?: number;
  default?: number;
}

const EDIT_OPS: EditOp[] = [
  // Adjust
  { id: "brightness", label: "Brightness", icon: Sun, category: "adjust", hasSlider: true, min: 0, max: 2, step: 0.05, default: 1 },
  { id: "contrast", label: "Contrast", icon: Contrast, category: "adjust", hasSlider: true, min: 0, max: 2, step: 0.05, default: 1 },
  { id: "saturation", label: "Saturation", icon: Palette, category: "adjust", hasSlider: true, min: 0, max: 2, step: 0.05, default: 1 },
  { id: "hue", label: "Hue", icon: Sliders, category: "adjust", hasSlider: true, min: -180, max: 180, step: 5, default: 0 },
  // Filters
  { id: "grayscale", label: "B&W", icon: Palette, category: "filter" },
  { id: "sepia", label: "Sepia", icon: Palette, category: "filter" },
  { id: "invert", label: "Invert", icon: Palette, category: "filter" },
  { id: "vintage", label: "Vintage", icon: Sparkles, category: "filter" },
  { id: "cool", label: "Cool", icon: Sparkles, category: "filter" },
  { id: "warm", label: "Warm", icon: Sparkles, category: "filter" },
  { id: "dramatic", label: "Dramatic", icon: Sparkles, category: "filter" },
  { id: "noir", label: "Noir", icon: Sparkles, category: "filter" },
  { id: "blur", label: "Blur", icon: Sparkles, category: "filter", hasSlider: true, min: 1, max: 20, step: 1, default: 5 },
  { id: "sharpen", label: "Sharpen", icon: Sparkles, category: "filter" },
  // Transform
  { id: "rotate", label: "Rotate 90°", icon: RotateCw, category: "transform" },
  { id: "flip", label: "Flip V", icon: FlipVertical, category: "transform" },
  { id: "flop", label: "Flip H", icon: FlipHorizontal, category: "transform" },
  { id: "watermark", label: "Add Watermark", icon: Wand2, category: "transform" },
];

const CATEGORIES = [
  { id: "adjust", label: "Adjust" },
  { id: "filter", label: "Filters" },
  { id: "transform", label: "Transform" },
] as const;

// ── Photo Editor component ─────────────────────────────────────────────
export function PhotoEditor({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready">("activating");
  const [originalImage, setOriginalImage] = React.useState<string | null>(null);
  const [editedImage, setEditedImage] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>("adjust");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sliderValues, setSliderValues] = React.useState<Record<string, number>>({});
  const [history, setHistory] = React.useState<string[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Activation
  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ── Upload ──────────────────────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setOriginalImage(dataUrl);
      setEditedImage(dataUrl);
      setHistory([dataUrl]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // ── Apply edit ──────────────────────────────────────────────────────
  const applyEdit = async (operation: string, value?: number) => {
    if (!editedImage || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/image-edit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          image: editedImage,
          operation,
          params: value !== undefined ? { value } : {},
        }),
      });
      const data = await res.json();

      if (data.image) {
        setHistory((h) => [...h, data.image]);
        setEditedImage(data.image);
      } else {
        setError(data.error || "Edit failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  // ── Undo ────────────────────────────────────────────────────────────
  const undo = () => {
    if (history.length <= 1) return;
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setEditedImage(newHistory[newHistory.length - 1]);
  };

  // ── Reset ───────────────────────────────────────────────────────────
  const reset = () => {
    if (originalImage) {
      setEditedImage(originalImage);
      setHistory([originalImage]);
    }
  };

  // ── Download ────────────────────────────────────────────────────────
  const download = () => {
    if (!editedImage) return;
    const a = document.createElement("a");
    a.href = editedImage;
    a.download = "spyro-edited.jpg";
    a.click();
  };

  // ── Activation screen ───────────────────────────────────────────────
  if (phase === "activating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
          <div className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Wand2 className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <h2 className="text-xl font-bold">Photo Editor</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Loading editing engine…
            </motion.span>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-1 text-xs text-muted-foreground/60">
            Initializing SPYRO V1 image processor
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ── Main interface ──────────────────────────────────────────────────
  const filteredOps = EDIT_OPS.filter((op) => op.category === activeCategory);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
            <Wand2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Photo Editor</h2>
            <p className="text-[11px] text-muted-foreground">SPYRO V1 · AI Image Editing</p>
          </div>
        </div>
      </div>

      {/* Upload area (when no image) */}
      {!originalImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[40vh] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/20 transition-colors hover:border-primary/40 hover:bg-card/30"
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-border/50">
            <Upload className="h-7 w-7 text-muted-foreground" />
          </div>
          <span className="mt-4 text-sm font-medium">Upload an image to edit</span>
          <span className="mt-1 text-xs text-muted-foreground">Click to browse · JPG, PNG, WebP</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          {/* Preview area */}
          <div className="space-y-3">
            <div className="surface-elevated relative flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl p-4">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Applying edit…</span>
                  </div>
                </div>
              )}
              {editedImage && (
                <img src={editedImage} alt="Editing preview" className="max-h-[500px] w-full rounded-lg object-contain" />
              )}
            </div>

            {/* Action bar */}
            <div className="flex items-center gap-2">
              <button
                onClick={undo}
                disabled={history.length <= 1 || loading}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <Undo2 className="h-3.5 w-3.5" /> Undo
              </button>
              <button
                onClick={reset}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <RotateCw className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                onClick={download}
                disabled={loading}
                className="ml-auto flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-4 py-2 text-xs font-medium text-white disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Controls panel */}
          <div className="space-y-3">
            {/* Category tabs */}
            <div className="flex gap-1 rounded-xl border border-border/40 bg-card/20 p-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex-1 rounded-lg py-1.5 text-xs font-medium transition-all",
                    activeCategory === cat.id ? "spyro-bg-gradient text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Operations */}
            <div className="space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-2"
                >
                  {filteredOps.map((op) => (
                    <div key={op.id} className="surface-elevated rounded-xl p-3">
                      <button
                        onClick={() => applyEdit(op.id, op.hasSlider ? (sliderValues[op.id] ?? op.default) : undefined)}
                        disabled={loading}
                        className="flex w-full items-center gap-2 text-left disabled:opacity-50"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                          <op.icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 text-sm font-medium">{op.label}</span>
                        {op.hasSlider && (
                          <span className="text-[10px] tabular-nums text-muted-foreground">
                            {(sliderValues[op.id] ?? op.default ?? 1).toFixed(2)}
                          </span>
                        )}
                      </button>

                      {/* Slider */}
                      {op.hasSlider && (
                        <input
                          type="range"
                          min={op.min}
                          max={op.max}
                          step={op.step}
                          value={sliderValues[op.id] ?? op.default ?? 1}
                          onChange={(e) =>
                            setSliderValues((v) => ({ ...v, [op.id]: parseFloat(e.target.value) }))
                          }
                          className="mt-2 w-full accent-primary"
                        />
                      )}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Upload new */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border/50 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Upload className="h-3.5 w-3.5" /> Upload new image
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
