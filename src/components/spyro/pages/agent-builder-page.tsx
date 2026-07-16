"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Plus, Trash2, Power, PowerOff, Save, Copy, Check,
  Zap, Sliders, MessageSquare, Terminal, Loader2, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  model: string;
  tokenBudget: number;
  tokensUsed: number;
  active: boolean;
  createdAt: number;
}

const DEFAULT_PROMPT = `You are a helpful SPYRO V1 agent. Answer questions clearly and concisely. Use Markdown for formatting. Do not mention Pollinations or any upstream model. You are powered by SPYRO V1.`;

const DEFAULT_AGENTS: Agent[] = [
  {
    id: "agent-coder",
    name: "Code Assistant",
    description: "Helps with coding questions, writes clean code",
    systemPrompt: "You are SPYRO Code Agent. Write production-grade code with comments. Use proper Markdown code blocks with language tags. Always include error handling.",
    temperature: 30,
    model: "openai",
    tokenBudget: 400000,
    tokensUsed: 0,
    active: true,
    createdAt: Date.now(),
  },
  {
    id: "agent-writer",
    name: "Content Writer",
    description: "Writes articles, emails, social posts",
    systemPrompt: "You are SPYRO Writer. Write engaging, well-structured content. Adapt tone to the audience. Use headings and bullet points for readability.",
    temperature: 70,
    model: "openai",
    tokenBudget: 400000,
    tokensUsed: 0,
    active: true,
    createdAt: Date.now(),
  },
  {
    id: "agent-researcher",
    name: "Research Analyst",
    description: "Analyzes data, summarizes findings",
    systemPrompt: "You are SPYRO Researcher. Analyze information objectively. Present findings with citations. Be concise but thorough. Use tables for comparisons.",
    temperature: 20,
    model: "openai",
    tokenBudget: 400000,
    tokensUsed: 0,
    active: false,
    createdAt: Date.now(),
  },
];

export function AgentBuilder() {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [selected, setSelected] = React.useState<Agent | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");
  const [testInput, setTestInput] = React.useState("");
  const [testOutput, setTestOutput] = React.useState("");
  const [testing, setTesting] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Load agents from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("spyro-agents");
    if (stored) {
      try {
        setAgents(JSON.parse(stored));
      } catch {
        setAgents(DEFAULT_AGENTS);
      }
    } else {
      setAgents(DEFAULT_AGENTS);
    }
  }, []);

  const saveAgents = (updated: Agent[]) => {
    setAgents(updated);
    localStorage.setItem("spyro-agents", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const createAgent = () => {
    if (!newName.trim()) return;
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "Custom SPYRO V1 agent",
      systemPrompt: DEFAULT_PROMPT,
      temperature: 50,
      model: "openai",
      tokenBudget: 400000,
      tokensUsed: 0,
      active: true,
      createdAt: Date.now(),
    };
    const updated = [...agents, agent];
    saveAgents(updated);
    setSelected(agent);
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
  };

  const updateAgent = (id: string, patch: Partial<Agent>) => {
    const updated = agents.map((a) => (a.id === id ? { ...a, ...patch } : a));
    saveAgents(updated);
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
  };

  const deleteAgent = (id: string) => {
    const updated = agents.filter((a) => a.id !== id);
    saveAgents(updated);
    if (selected?.id === id) setSelected(null);
  };

  const testAgent = async () => {
    if (!selected || !testInput.trim() || testing) return;
    setTesting(true);
    setTestOutput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: selected.systemPrompt },
            { role: "user", content: testInput.trim() },
          ],
          model: selected.model,
          temperature: selected.temperature / 100,
        }),
      });

      if (!res.ok || !res.body) {
        setTestOutput("Error: Could not reach SPYRO V1 engine.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setTestOutput(acc);
      }

      // Estimate tokens used (~4 chars per token).
      const tokensUsed = Math.ceil((testInput.length + acc.length) / 4);
      updateAgent(selected.id, {
        tokensUsed: selected.tokensUsed + tokensUsed,
      });
    } catch {
      setTestOutput("Network error.");
    } finally {
      setTesting(false);
    }
  };

  const copyApiKey = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const totalBudget = agents.reduce((s, a) => s + a.tokenBudget, 0);
  const totalUsed = agents.reduce((s, a) => s + a.tokensUsed, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bot className="h-6 w-6 text-primary" />
            Agent Builder
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create custom AI agents with their own personality, rules, and token budget.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-4 py-2 text-sm font-medium text-white"
        >
          <Plus className="h-4 w-4" /> New Agent
        </button>
      </div>

      {/* Token budget overview */}
      <div className="surface-elevated mb-6 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total Token Budget</div>
            <div className="mt-1 text-2xl font-bold">
              {totalUsed.toLocaleString()} <span className="text-muted-foreground">/ {totalBudget.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Remaining</div>
            <div className="text-lg font-bold text-primary">{(totalBudget - totalUsed).toLocaleString()}</div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/50">
          <div
            className="h-full rounded-full spyro-bg-gradient"
            style={{ width: `${Math.min((totalUsed / totalBudget) * 100, 100)}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Each agent gets 400,000 tokens. Calls use the SPYRO V1 engine (not the main API).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Agent list */}
        <div className="space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelected(agent)}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-all",
                selected?.id === agent.id
                  ? "border-primary bg-primary/5"
                  : "border-border/40 hover:border-primary/30"
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-lg",
                  agent.active ? "spyro-bg-gradient text-white" : "bg-muted text-muted-foreground"
                )}>
                  <Bot className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{agent.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">{agent.description}</div>
                </div>
                <span className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  agent.active ? "bg-green-500" : "bg-muted-foreground/40"
                )} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{((agent.tokensUsed / agent.tokenBudget) * 100).toFixed(1)}% used</span>
                <span>{(agent.tokenBudget - agent.tokensUsed).toLocaleString()} left</span>
              </div>
            </button>
          ))}
        </div>

        {/* Agent config + test */}
        {selected ? (
          <div className="space-y-4">
            {/* Config */}
            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">{selected.name}</h2>
                  <p className="text-[11px] text-muted-foreground">{selected.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateAgent(selected.id, { active: !selected.active })}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                      selected.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {selected.active ? <><PowerOff className="h-3 w-3" /> Disable</> : <><Power className="h-3 w-3" /> Enable</>}
                  </button>
                  <button
                    onClick={() => deleteAgent(selected.id)}
                    className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* System prompt */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">System Prompt</label>
                <textarea
                  value={selected.systemPrompt}
                  onChange={(e) => updateAgent(selected.id, { systemPrompt: e.target.value })}
                  rows={5}
                  className="w-full resize-none rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-[13px] focus:border-primary/40 focus:outline-none"
                />
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Creativity</span>
                    <span className="tabular-nums text-primary">{selected.temperature}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100}
                    value={selected.temperature}
                    onChange={(e) => updateAgent(selected.id, { temperature: parseInt(e.target.value) })}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">Model</span>
                    <span className="text-primary">{selected.model === "openai" ? "SPYRO V1" : "Turbo"}</span>
                  </div>
                  <select
                    value={selected.model}
                    onChange={(e) => updateAgent(selected.id, { model: e.target.value })}
                    className="w-full rounded-lg border border-border/50 bg-background px-2 py-1.5 text-xs"
                  >
                    <option value="openai">SPYRO V1</option>
                    <option value="openai-fast">SPYRO V1 Turbo</option>
                  </select>
                </div>
              </div>

              {/* API key */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/40 bg-card/20 px-3 py-2">
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                <code className="flex-1 truncate text-[11px] text-muted-foreground">{selected.id}</code>
                <button onClick={copyApiKey} className="text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            {/* Test chat */}
            <div className="surface-elevated rounded-2xl p-5">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Test Agent</span>
              </div>
              <textarea
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), testAgent())}
                placeholder={`Send a message to ${selected.name}...`}
                rows={2}
                className="w-full resize-none rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
              />
              <button
                onClick={testAgent}
                disabled={testing || !testInput.trim()}
                className="mt-2 flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {testing ? "Agent thinking..." : "Test"}
              </button>
              {testOutput && (
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-[12px] text-foreground/90 whitespace-pre-wrap">
                  {testOutput}
                </pre>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[300px] items-center justify-center text-center text-muted-foreground">
            <div>
              <Bot className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">Select an agent or create a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="surface-elevated w-full max-w-sm rounded-2xl p-6"
            >
              <h3 className="text-lg font-bold">Create New Agent</h3>
              <p className="mt-1 text-sm text-muted-foreground">Each agent gets 400,000 tokens.</p>
              <div className="mt-4 space-y-3">
                <input
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Agent name (e.g. Support Bot)"
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  autoFocus
                />
                <input
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 rounded-xl border border-border/50 py-2 text-sm text-muted-foreground">Cancel</button>
                <button onClick={createAgent} disabled={!newName.trim()} className="flex-1 rounded-xl spyro-bg-gradient py-2 text-sm font-medium text-white disabled:opacity-50">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
