"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Upload,
  Download,
  Wand2,
  Scissors,
  Check,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BackgroundRemover({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready">("activating");
  const [originalImage, setOriginalImage] = React.useState<string | null>(null);
  const [resultImage, setResultImage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detectedBg, setDetectedBg] = React.useState<string | null>(null);
  const [tolerance, setTolerance] = React.useState(15);
  const [feather, setFeather] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setOriginalImage(reader.result as string);
      setResultImage(null);
      setError(null);
      setDetectedBg(null);
    };
    reader.readAsDataURL(file);
  };

  const removeBg = async () => {
    if (!originalImage || loading) return;
    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: originalImage, tolerance, feather }),
      });
      const data = await res.json();

      if (data.image) {
        setResultImage(data.image);
        setDetectedBg(data.detectedBg);
      } else {
        setError(data.error || "Background removal failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = "spyro-nobg.png";
    a.click();
  };

  // ── Activation ──────────────────────────────────────────────────────
  if (phase === "activating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
          <div className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Scissors className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <h2 className="text-xl font-bold">Background Remover</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Loading AI cutout engine…
            </motion.span>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-1 text-xs text-muted-foreground/60">
            Initializing SPYRO V1 background detection
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Background Remover</h2>
            <p className="text-[11px] text-muted-foreground">SPYRO V1 · AI Cutout Engine</p>
          </div>
        </div>
      </div>

      {/* Upload or edit */}
      {!originalImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-[40vh] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-card/20 transition-colors hover:border-primary/40 hover:bg-card/30"
        >
          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-dashed border-border/50">
            <Upload className="h-7 w-7 text-muted-foreground" />
          </div>
          <span className="mt-4 text-sm font-medium">Upload an image</span>
          <span className="mt-1 text-xs text-muted-foreground">Best results with plain backgrounds · JPG, PNG</span>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Before / After comparison */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Original */}
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Original</div>
              <div className="surface-elevated flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl p-3">
                <img src={originalImage} alt="Original" className="max-h-[300px] w-full rounded-lg object-contain" />
              </div>
            </div>

            {/* Result */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Result (transparent)</span>
                {resultImage && (
                  <button onClick={download} className="flex items-center gap-1 text-xs text-primary hover:underline">
                    <Download className="h-3 w-3" /> Download PNG
                  </button>
                )}
              </div>
              <div
                className="surface-elevated relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-2xl p-3"
                style={{
                  backgroundImage: `linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)`,
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 0 10px, 10px -10px, 10px 0px",
                }}
              >
                {loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Removing background…</span>
                  </div>
                ) : resultImage ? (
                  <img src={resultImage} alt="Background removed" className="max-h-[300px] w-full rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                    <Wand2 className="h-8 w-8 opacity-40" />
                    <span className="text-xs">Click "Remove Background" to see the result</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="surface-elevated rounded-2xl p-4">
            <div className="mb-3 flex items-center gap-4">
              {/* Tolerance slider */}
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Tolerance</span>
                  <span className="tabular-nums text-primary">{tolerance}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
                <p className="mt-0.5 text-[10px] text-muted-foreground/60">Higher = removes more similar colors</p>
              </div>

              {/* Feather toggle */}
              <button
                onClick={() => setFeather(!feather)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  feather ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground"
                )}
              >
                {feather ? <Check className="h-3 w-3" /> : null}
                Feather edges
              </button>
            </div>

            {/* Detected bg color */}
            {detectedBg && (
              <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Detected background:</span>
                <span
                  className="inline-block h-4 w-4 rounded border border-border/50"
                  style={{ background: detectedBg }}
                />
                <span className="font-mono">{detectedBg}</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={removeBg}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl spyro-bg-gradient py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
                {loading ? "Removing…" : "Remove Background"}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-xl border border-border/50 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Upload className="h-4 w-4" /> New
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl border border-border/30 bg-card/20 p-3">
            <div className="text-[11px] font-semibold text-muted-foreground">💡 Tips for best results</div>
            <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground/80">
              <li>• Works best with plain/solid color backgrounds (white, green screen, etc.)</li>
              <li>• Increase tolerance if too much background remains</li>
              <li>• Decrease tolerance if the subject is being cut out</li>
              <li>• Result is a transparent PNG — use Download to save</li>
            </ul>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}
