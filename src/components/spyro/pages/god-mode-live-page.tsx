"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Zap, Loader2, Sparkles, Send, Bot, Users,
  Activity, Brain, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveAgent {
  id: number;
  name: string;
  role: string;
  icon: string;
  color: string;
  status: "idle" | "thinking" | "speaking" | "done";
  message: string;
}

const AGENT_NAMES = [
  { name: "Planner", role: "Strategy", icon: "🧠", color: "#ff7a1a" },
  { name: "Researcher", role: "Information", icon: "🔍", color: "#e8421b" },
  { name: "Coder", role: "Engineering", icon: "💻", color: "#ff9a3c" },
  { name: "Reviewer", role: "Quality", icon: "🛡️", color: "#ffd27a" },
  { name: "Writer", role: "Content", icon: "✍️", color: "#ff5a1f" },
  { name: "Analyst", role: "Data", icon: "📊", color: "#d8421b" },
  { name: "Designer", role: "UI/UX", icon: "🎨", color: "#ffae42" },
  { name: "Tester", role: "QA", icon: "🧪", color: "#ff6b35" },
  { name: "Architect", role: "Systems", icon: "🏗️", color: "#e8651a" },
  { name: "Optimizer", role: "Performance", icon: "⚡", color: "#ff8c42" },
  { name: "Security", role: "Audit", icon: "🔒", color: "#d8421b" },
  { name: "Translator", role: "Languages", icon: "🌐", color: "#ff7a1a" },
  { name: "Summarizer", role: "Condensing", icon: "📝", color: "#ff9a3c" },
  { name: "Fact-Checker", role: "Verification", icon: "✅", color: "#e8421b" },
  { name: "Innovator", role: "Ideas", icon: "💡", color: "#ffd27a" },
  { name: "Critic", role: "Feedback", icon: "🎭", color: "#ff5a1f" },
  { name: "Mentor", role: "Guidance", icon: "🧙", color: "#ffae42" },
  { name: "Explorer", role: "Discovery", icon: "🚀", color: "#d8421b" },
  { name: "Negotiator", role: "Diplomacy", icon: "🤝", color: "#ff8c42" },
  { name: "Synthesizer", role: "Final Answer", icon: "⚡", color: "#ff7a1a" },
];

export function GodModeLive({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready">("activating");
  const [input, setInput] = React.useState("");
  const [running, setRunning] = React.useState(false);
  const [agents, setAgents] = React.useState<LiveAgent[]>([]);
  const [conversation, setConversation] = React.useState<Array<{ agent: string; icon: string; message: string; color: string }>>([]);

  // Activation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setAgents(AGENT_NAMES.map((a, i) => ({ ...a, id: i, status: "idle", message: "" })));
      setPhase("ready");
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const run = async () => {
    const prompt = input.trim();
    if (!prompt || running) return;

    setRunning(true);
    setInput("");
    setConversation([]);

    // Simulate 20 agents working in sequence (groups of 4-5).
    const groups = [
      AGENT_NAMES.slice(0, 5),  // Planning group
      AGENT_NAMES.slice(5, 10), // Execution group
      AGENT_NAMES.slice(10, 15),// Review group
      AGENT_NAMES.slice(15, 20),// Synthesis group
    ];

    const messages = [
      "Analyzing the request and breaking it down into components...",
      "Researching relevant information and patterns...",
      "Drafting the initial approach...",
      "Writing the core solution...",
      "Reviewing for edge cases...",
      "Optimizing for performance...",
      "Checking security implications...",
      "Formatting the final output...",
      "Synthesizing all agent contributions...",
      "Final answer ready.",
    ];

    let agentIdx = 0;
    for (let g = 0; g < groups.length; g++) {
      for (const agent of groups[g]) {
        // Set agent to thinking
        setAgents((prev) => prev.map((a) => a.id === agentIdx ? { ...a, status: "thinking" } : a));

        await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));

        // Agent speaks
        const msg = messages[Math.min(agentIdx, messages.length - 1)];
        setAgents((prev) => prev.map((a) => a.id === agentIdx ? { ...a, status: "speaking", message: msg } : a));
        setConversation((prev) => [...prev, { agent: agent.name, icon: agent.icon, message: msg, color: agent.color }]);

        await new Promise((r) => setTimeout(r, 300));

        // Agent done
        setAgents((prev) => prev.map((a) => a.id === agentIdx ? { ...a, status: "done" } : a));
        agentIdx++;
      }
    }

    // Get the real final answer from SPYRO.
    setAgents((prev) => prev.map((a) => a.id === 19 ? { ...a, status: "thinking" } : a));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          model: "openai",
        }),
      });

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
        }

        setAgents((prev) => prev.map((a) => a.id === 19 ? { ...a, status: "speaking", message: "Final answer delivered." } : a));
        setConversation((prev) => [...prev, { agent: "Synthesizer", icon: "⚡", message: acc, color: "#ff7a1a" }]);
        setAgents((prev) => prev.map((a) => a.id === 19 ? { ...a, status: "done" } : a));
      }
    } catch { /* ignore */ }

    setRunning(false);
  };

  // ── Activation screen ───────────────────────────────────────────────
  if (phase === "activating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
          <div className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Zap className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <h2 className="text-xl font-bold">God Mode Live</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Spinning up 20 specialized agents...
            </motion.span>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-1 text-xs text-muted-foreground/60">
            Assembling the SPYRO V1 agent council
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // ── Main interface ──────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">God Mode Live</h2>
            <p className="text-[11px] text-muted-foreground">20 agents · real-time collaboration</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full border border-border/50 bg-card/40 px-3 py-1.5">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">{agents.filter(a => a.status === "done").length}/{agents.length} ready</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_400px]">
        {/* Agent grid (left) */}
        <div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {agents.map((agent) => (
              <motion.div
                key={agent.id}
                layout
                className={cn(
                  "relative flex flex-col items-center rounded-xl border p-3 text-center transition-all",
                  agent.status === "thinking" ? "border-primary bg-primary/5" :
                  agent.status === "speaking" ? "border-primary bg-primary/10 spyro-glow" :
                  agent.status === "done" ? "border-green-500/30 bg-green-500/5" :
                  "border-border/40"
                )}
              >
                <span className="text-2xl">{agent.icon}</span>
                <span className="mt-1 text-[10px] font-medium">{agent.name}</span>
                <span className="text-[8px] text-muted-foreground">{agent.role}</span>
                {agent.status === "thinking" && (
                  <Loader2 className="mt-1 h-3 w-3 animate-spin text-primary" />
                )}
                {agent.status === "speaking" && (
                  <motion.div
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    className="mt-1 flex gap-0.5"
                  >
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        className="h-1 w-1 rounded-full bg-primary"
                      />
                    ))}
                  </motion.div>
                )}
                {agent.status === "done" && (
                  <CheckCircle2 className="mt-1 h-3 w-3 text-green-500" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Input */}
          <div className="surface-elevated mt-4 rounded-2xl p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), run())}
              placeholder="What should the 20-agent council solve?"
              rows={2}
              disabled={running}
              className="w-full resize-none rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={run}
              disabled={running || !input.trim()}
              className="mt-2 flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {running ? "Council working..." : "Summon Council"}
            </button>
          </div>
        </div>

        {/* Live conversation feed (right) */}
        <div className="surface-elevated flex max-h-[600px] flex-col rounded-2xl">
          <div className="border-b border-border/40 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Feed</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {conversation.length === 0 && !running && (
                <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                  <div>
                    <Brain className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    <p className="text-xs">Agents will share their thoughts here</p>
                  </div>
                </div>
              )}
              {conversation.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2"
                >
                  <span className="text-lg">{msg.icon}</span>
                  <div className="flex-1">
                    <span className="text-xs font-bold" style={{ color: msg.color }}>{msg.agent}</span>
                    <p className="text-[12px] text-muted-foreground whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
