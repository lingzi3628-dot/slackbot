"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Code2,
  Loader2,
  ExternalLink,
  Shield,
  Zap,
  Sparkles,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  PenLine,
  Eye,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────
type Mode = "write" | "review" | "preview";

interface CodeGenStep {
  label: string;
  status: "pending" | "active" | "done";
}

// ── Code Lab component ────────────────────────────────────────────────
export function CodeLab({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready">("activating");
  const [mode, setMode] = React.useState<Mode>("write");
  const [input, setInput] = React.useState("");
  const [output, setOutput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [steps, setSteps] = React.useState<CodeGenStep[]>([]);

  // Activation sequence
  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ── Generate ────────────────────────────────────────────────────────
  const generate = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setOutput("");
    setPreviewUrl(null);
    setProgress(0);

    // Set up progress steps based on mode.
    const modeSteps: CodeGenStep[] =
      mode === "write"
        ? [
            { label: "Analyzing request…", status: "pending" },
            { label: "Planning architecture…", status: "pending" },
            { label: "Writing production code…", status: "pending" },
            { label: "Adding error handling…", status: "pending" },
            { label: "Building preview…", status: "pending" },
          ]
        : mode === "review"
        ? [
            { label: "Scanning code…", status: "pending" },
            { label: "Security analysis…", status: "pending" },
            { label: "Performance audit…", status: "pending" },
            { label: "Clean code check…", status: "pending" },
            { label: "Compiling review…", status: "pending" },
          ]
        : [
            { label: "Parsing code…", status: "pending" },
            { label: "Building sandbox…", status: "pending" },
            { label: "Rendering preview…", status: "pending" },
          ];

    setSteps(modeSteps);

    // Start progress simulation.
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < modeSteps.length) {
        setSteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i < stepIdx ? "done" : i === stepIdx ? "active" : "pending",
          }))
        );
        setProgress(((stepIdx + 1) / modeSteps.length) * 90);
        stepIdx++;
      }
    }, 1500);

    try {
      // Build the system prompt based on mode.
      const systemPrompt =
        mode === "write"
          ? WRITE_PROMPT
          : mode === "review"
          ? REVIEW_PROMPT
          : PREVIEW_PROMPT;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          model: "qwen-coder",
        }),
      });

      if (!res.ok || !res.body) {
        setOutput("**Error: Could not reach SPYRO V1 engine.**");
        return;
      }

      // Read the stream.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }

      clearInterval(stepInterval);
      setSteps((prev) => prev.map((s) => ({ ...s, status: "done" })));
      setProgress(100);

      // If there's HTML code, build a preview link.
      if (mode === "write" || mode === "preview") {
        const htmlMatch = acc.match(/```html\s*([\s\S]*?)```/i);
        const cssMatch = acc.match(/```css\s*([\s\S]*?)```/i);
        const jsMatch = acc.match(/```(?:javascript|js)\s*([\s\S]*?)```/i);

        if (htmlMatch || cssMatch || jsMatch) {
          const html = htmlMatch?.[1] || "";
          const css = cssMatch?.[1] || "";
          const js = jsMatch?.[1] || "";
          const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;padding:16px;background:#16110d;color:#f5ecd9;margin:0}${css}</style></head><body>${html}<script>try{${js}}catch(e){document.body.innerHTML+='<pre style="color:#e85a3c">'+e+'</pre>'}<\/script></body></html>`;
          const blob = new Blob([doc], { type: "text/html" });
          setPreviewUrl(URL.createObjectURL(blob));
        }
      }
    } catch (err) {
      setOutput(`**Error:** ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      clearInterval(stepInterval);
      setLoading(false);
    }
  };

  // ── Activation screen ───────────────────────────────────────────────
  if (phase === "activating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative mb-6"
        >
          <div className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Code2 className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold">Code Lab</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Initializing code engine…
            </motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-1 text-xs text-muted-foreground/60"
          >
            Loading SPYRO V1 Coder model
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ── Main interface ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to hub"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Code Lab</h2>
            <p className="text-[11px] text-muted-foreground">SPYRO V1 · Write · Review · Preview</p>
          </div>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="mb-4 flex gap-1 rounded-xl border border-border/40 bg-card/20 p-1">
        {[
          { id: "write" as Mode, label: "Write", icon: PenLine },
          { id: "review" as Mode, label: "Review", icon: Shield },
          { id: "preview" as Mode, label: "Preview", icon: Eye },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setMode(tab.id);
              setOutput("");
              setPreviewUrl(null);
            }}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
              mode === tab.id
                ? "spyro-bg-gradient text-white"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Input + Output grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Left: input */}
        <div className="space-y-3">
          <div className="surface-elevated rounded-2xl p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {mode === "write"
                ? "Describe what to build"
                : mode === "review"
                ? "Paste code to review"
                : "Paste HTML/CSS/JS to preview"}
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "write"
                  ? "Build a responsive pricing card with 3 tiers, Tailwind CSS, dark mode support…"
                  : mode === "review"
                  ? "Paste your code here for a full security + performance review…"
                  : "Paste your HTML/CSS/JS code here to see a live preview…"
              }
              rows={10}
              disabled={loading}
              className="w-full resize-none rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 font-mono text-[13px] focus:border-primary/40 focus:outline-none disabled:opacity-50"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {mode === "write" ? "⚡ SPYRO V1 Coder" : mode === "review" ? "🛡️ Security + Performance" : "👁️ Live sandbox"}
              </span>
              <button
                onClick={generate}
                disabled={!input.trim() || loading}
                className="flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "write" ? "Writing…" : mode === "review" ? "Reviewing…" : "Building…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {mode === "write" ? "Generate" : mode === "review" ? "Review" : "Preview"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress steps */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="surface-elevated overflow-hidden rounded-2xl p-4"
              >
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    {mode === "write" ? "Writing production code…" : mode === "review" ? "Analyzing codebase…" : "Building preview…"}
                  </span>
                  <span className="font-bold tabular-nums text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted/50">
                  <motion.div
                    className="h-full rounded-full spyro-bg-gradient"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="space-y-1.5">
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 text-xs transition-opacity",
                        step.status === "pending" && "opacity-40",
                        step.status === "active" && "opacity-100",
                        step.status === "done" && "opacity-70"
                      )}
                    >
                      {step.status === "done" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : step.status === "active" ? (
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      ) : (
                        <span className="h-2 w-2 rounded-full border border-muted-foreground/40" />
                      )}
                      <span className={cn(
                        step.status === "active" && "font-medium text-foreground",
                        step.status === "done" && "text-muted-foreground",
                        step.status === "pending" && "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: output */}
        <div>
          <div className="surface-elevated flex min-h-[400px] flex-col rounded-2xl p-4">
            {/* Output header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {mode === "write" ? <FileCode className="h-3.5 w-3.5" /> : mode === "review" ? <Shield className="h-3.5 w-3.5" /> : <Terminal className="h-3.5 w-3.5" />}
                {mode === "write" ? "Generated Code" : mode === "review" ? "Review Report" : "Preview Output"}
              </div>
              {previewUrl && (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1 rounded-lg spyro-bg-gradient px-3 py-1 text-xs font-medium text-white"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Preview
                </a>
              )}
            </div>

            {/* Output content */}
            <div className="flex-1 overflow-y-auto">
              {output ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-foreground/90">
                  {output}
                </pre>
              ) : loading ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "write" ? "Writing code…" : mode === "review" ? "Reviewing…" : "Building…"}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <div className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-border/50">
                    <Code2 className="h-6 w-6 opacity-40" />
                  </div>
                  <span className="text-sm">
                    {mode === "write"
                      ? "Your generated code will appear here"
                      : mode === "review"
                      ? "Your review report will appear here"
                      : "Your preview will appear here"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── System prompts ────────────────────────────────────────────────────
const WRITE_PROMPT = `You are SPYRO V1 Code Lab — an elite, context-aware AI Code Editor.
Your purpose is to write production-grade code that is complete, tested, and immediately usable.

RULES:
- Output complete, fully realized files. Zero placeholders. No "TODO" or "... rest of code".
- Include explicit error handling, input validation, and type safety.
- Match the exact framework, versioning, and design system the user specifies.
- Always include the target filename as a comment on the first line of each code block.
- Use clean Markdown code blocks with explicit language tags (html, css, javascript, tsx, etc.).
- If writing HTML/CSS/JS, make it complete and runnable in a browser.
- Keep code concise but complete. Prefer clarity over cleverness.
- Do NOT mention SPYRO V1, Pollinations, or any upstream model. You are SPYRO V1 Code Lab.`;

const REVIEW_PROMPT = `You are SPYRO V1 Code Lab — an elite AI Code Reviewer.
Your purpose is to analyze code across four axes and provide actionable, specific feedback.

REVIEW FORMAT (use this exact structure):

## 🔍 Executive Summary
One sentence verdict on the code quality.

## 🛡️ Security: [score/100]
- [Specific vulnerability or "No issues found"]
- [Specific fix if needed]

## ⚡ Performance: [score/100]
- [Specific inefficiency or "Well optimized"]
- [Specific fix if needed]

## 📐 Clean Code: [score/100]
- [Specific issue or "Clean and readable"]
- [Specific fix if needed]

## 🧪 Testability: [score/100]
- [Specific concern or "Well structured for testing"]
- [Mock data or test structure if needed]

## Overall Score: [average/100]

RULES:
- Bypass generic praise. Be specific: cite line numbers, function names, exact patterns.
- If the code is clean, say so — don't invent problems.
- Do NOT mention SPYRO V1, Pollinations, or any upstream model.`;

const PREVIEW_PROMPT = `You are SPYRO V1 Code Lab — a Preview Compiler.
The user will paste code. Your job is to clean it up and make it a complete, runnable HTML file.

RULES:
- If the user pasted HTML/CSS/JS, combine them into a single complete HTML document.
- If the user pasted a framework component, convert it to vanilla HTML/CSS/JS for preview.
- Add a dark theme base style (background #16110d, text #f5ecd9) if no styling is provided.
- Output ONLY the code in a single \`\`\`html block. No explanations.
- The code must work when opened directly in a browser.
- Do NOT mention SPYRO V1, Pollinations, or any upstream model.`;
