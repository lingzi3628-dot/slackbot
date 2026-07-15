"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Zap,
  Loader2,
  Sparkles,
  Brain,
  Search,
  Code2,
  Wand2,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────
interface AgentStep {
  agent: string;
  icon: string;
  model: string;
  status: "pending" | "active" | "done";
  output?: string;
}

// ── Documentation content ─────────────────────────────────────────────
const DOC_SECTIONS = [
  {
    title: "What is God Mode?",
    icon: BookOpen,
    content: `God Mode is SPYRO V1's multi-agent collaboration system. When you send a prompt, it's processed by a TEAM of 4 specialized agents — each with a unique role — rather than a single model response.

The agents work sequentially: each one's output feeds into the next, building up context and complexity. The final Synthesizer combines everything into one polished answer.

Think of it as a dragon council: each dragon brings its expertise, and the lead dragon delivers the verdict.`,
  },
  {
    title: "The 4 Agents",
    icon: Brain,
    content: `🧠 PLANNER — Breaks your request into 3-5 clear steps. Doesn't solve the problem, just plans the approach.

🔍 RESEARCHER — Gathers information using web search if needed. Summarizes findings as bullet points. Focuses on facts.

💻 CODER — Writes production-grade code if the task needs it. If no code is needed, says so.

⚡ SYNTHESIZER — Receives the plan, research, and code. Produces the FINAL answer you see. Combines everything into a coherent Markdown response.`,
  },
  {
    title: "How It Works",
    icon: Zap,
    content: `1. You send a prompt (e.g. "Build a responsive pricing page")
2. PLANNER creates a step-by-step plan
3. RESEARCHER gathers any needed info (web search, facts)
4. CODER writes the actual code (if needed)
5. SYNTHESIZER combines all 3 outputs into your final answer

Each step streams live to the UI — you see each agent working (⏳ → ✅) with collapsible output.

Total time: ~30-60 seconds depending on complexity. The result is higher quality than a single-model response because each agent specializes.`,
  },
  {
    title: "When to Use God Mode",
    icon: Sparkles,
    content: `✅ USE God Mode for:
- Complex multi-step tasks ("Build a full landing page")
- Research-heavy questions ("Compare React vs Vue for enterprise")
- Code + explanation requests ("Write a REST API and explain each part")
- Anything that benefits from planning before execution

❌ DON'T use God Mode for:
- Simple questions ("What's 2+2?")
- Quick chats ("Tell me a joke")
- Single-step tasks ("Format this JSON")

God Mode takes longer (4 model calls) but produces deeper, more thorough results.`,
  },
  {
    title: "Tools Available",
    icon: Code2,
    content: `God Mode agents have access to these tools:

🌐 Web Search — The Researcher can search the live web for current information. Triggers on "latest", "recent", "news", "price", "weather", etc.

🧮 Calculator — The Researcher can evaluate math expressions. Triggers on "calculate", "compute", or pure math.

More tools coming: code execution sandbox, file operations, API calls.`,
  },
];

// ── God Mode tool component ───────────────────────────────────────────
export function GodModeTool({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready">("activating");
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [steps, setSteps] = React.useState<AgentStep[]>([]);
  const [finalAnswer, setFinalAnswer] = React.useState("");
  const [showDocs, setShowDocs] = React.useState(false);
  const [expandedStep, setExpandedStep] = React.useState<string | null>(null);

  // Activation
  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 2500);
    return () => clearTimeout(timer);
  }, []);

  // ── Run God Mode ────────────────────────────────────────────────────
  const run = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setFinalAnswer("");
    setSteps([]);
    setExpandedStep(null);

    try {
      const res = await fetch("/api/god-mode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      if (!res.ok || !res.body) {
        setFinalAnswer("**Error: Could not reach God Mode engine.**");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const stepMap = new Map<string, AgentStep>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "step") {
              stepMap.set(data.step.agent, data.step);
              setSteps(Array.from(stepMap.values()));
            } else if (data.type === "done") {
              const lastStep = Array.from(stepMap.values()).pop();
              setFinalAnswer(lastStep?.output || "God Mode completed.");
            } else if (data.type === "error") {
              setFinalAnswer(`**Error:** ${data.error}`);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      setFinalAnswer(`**Error:** ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
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
            <Zap className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-xl font-bold">God Mode</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Assembling agent council…
            </motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-1 text-xs text-muted-foreground/60"
          >
            Spinning up 4 specialized SPYRO agents
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ── Main interface ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
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
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">God Mode</h2>
            <p className="text-[11px] text-muted-foreground">Multi-agent collaboration · 4 agents</p>
          </div>
        </div>
        {/* Docs toggle */}
        <button
          onClick={() => setShowDocs(!showDocs)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
            showDocs ? "border-primary/40 bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          Docs
        </button>
      </div>

      {/* Documentation panel (collapsible) */}
      <AnimatePresence>
        {showDocs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="surface-elevated space-y-3 rounded-2xl p-5">
              {DOC_SECTIONS.map((section, i) => (
                <div key={i} className="border-b border-border/30 pb-3 last:border-0 last:pb-0">
                  <div className="mb-1.5 flex items-center gap-2">
                    <section.icon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">{section.title}</h3>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted-foreground">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="surface-elevated mb-4 rounded-2xl p-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          What should the agent council solve?
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Build a responsive pricing page with 3 tiers, dark mode, and a FAQ section…"
          rows={3}
          disabled={loading}
          className="w-full resize-none rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-50"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            ⚡ 4 agents · ~30-60s
          </span>
          <button
            onClick={run}
            disabled={!input.trim() || loading}
            className="flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Council working…
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Summon Council
              </>
            )}
          </button>
        </div>
      </div>

      {/* Agent progress */}
      {steps.length > 0 && (
        <div className="surface-elevated mb-4 rounded-2xl p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Agent Council
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i}>
                <button
                  onClick={() => step.output && setExpandedStep(expandedStep === step.agent ? null : step.agent)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/30"
                >
                  <span className="text-lg">{step.icon}</span>
                  <span className="flex-1 text-sm font-medium">{step.agent}</span>
                  {step.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : step.status === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="h-3 w-3 rounded-full border border-muted-foreground/40" />
                  )}
                  {step.output && step.status === "done" && (
                    expandedStep === step.agent ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedStep === step.agent && step.output && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-8"
                    >
                      <pre className="whitespace-pre-wrap break-words pb-2 font-mono text-[12px] leading-relaxed text-muted-foreground">
                        {step.output.slice(0, 500)}{step.output.length > 500 ? "…" : ""}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final answer */}
      {finalAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-elevated rounded-2xl p-5"
        >
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Final Answer
            </span>
          </div>
          <pre className="whitespace-pre-wrap break-words font-sans text-[14px] leading-relaxed text-foreground">
            {finalAnswer}
          </pre>
        </motion.div>
      )}
    </div>
  );
}
