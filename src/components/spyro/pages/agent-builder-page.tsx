"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Plus, Trash2, Save, Copy, Check, Loader2, Sparkles, Send,
  Key, MessageSquare, Sliders, Palette, Eye, EyeOff, Zap, Terminal,
  RefreshCw, Settings2, Lock, Crown,
} from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  description: string;
  trainingText: string;
  systemPrompt: string;
  temperature: number;
  model: string;
  tokenBudget: number;
  tokensUsed: number;
  active: boolean;
  apiKey: string;
  avatarColor: string;
  createdAt: number;
}

const COLORS = ["#ff7a1a", "#e8421b", "#ff9a3c", "#ffd27a", "#ff5a1f", "#d8421b", "#ffae42", "#ff6b35"];

function genApiKey() {
  return `sk-spyro-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: "agent-doctor",
    name: "Dr. Spyro",
    description: "A medical assistant that answers health questions",
    trainingText: "You are a helpful medical assistant. You provide general health information, explain symptoms, and suggest when to see a doctor. Always recommend consulting a real doctor for serious concerns. Be warm, professional, and reassuring.",
    systemPrompt: "You are a helpful medical assistant. You provide general health information, explain symptoms, and suggest when to see a doctor. Always recommend consulting a real doctor for serious concerns. Be warm, professional, and reassuring.",
    temperature: 30,
    model: "openai",
    tokenBudget: 400000,
    tokensUsed: 0,
    active: true,
    apiKey: genApiKey(),
    avatarColor: "#ff7a1a",
    createdAt: Date.now(),
  },
  {
    id: "agent-support",
    name: "Support Bot",
    description: "Customer support agent for your business",
    trainingText: "You are a friendly customer support agent. Help users with their questions, troubleshoot issues, and guide them step by step. Be patient, clear, and empathetic. Use bullet points for steps.",
    systemPrompt: "You are a friendly customer support agent. Help users with their questions, troubleshoot issues, and guide them step by step. Be patient, clear, and empathetic. Use bullet points for steps.",
    temperature: 20,
    model: "openai",
    tokenBudget: 400000,
    tokensUsed: 0,
    active: true,
    apiKey: genApiKey(),
    avatarColor: "#e8421b",
    createdAt: Date.now(),
  },
  {
    id: "agent-tutor",
    name: "Study Buddy",
    description: "An AI tutor that explains any topic simply",
    trainingText: "You are an AI tutor. Explain concepts in simple terms using analogies. Break complex topics into steps. Ask if the student understands before moving on. Be encouraging and patient.",
    systemPrompt: "You are an AI tutor. Explain concepts in simple terms using analogies. Break complex topics into steps. Ask if the student understands before moving on. Be encouraging and patient.",
    temperature: 50,
    model: "openai",
    tokenBudget: 400000,
    tokensUsed: 0,
    active: false,
    apiKey: genApiKey(),
    avatarColor: "#ff9a3c",
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
  const [copiedKey, setCopiedKey] = React.useState(false);
  const [showKey, setShowKey] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"train" | "test" | "integrate">("train");

  React.useEffect(() => {
    const stored = localStorage.getItem("spyro-agents-v2");
    if (stored) {
      try { setAgents(JSON.parse(stored)); } catch { setAgents(DEFAULT_AGENTS); }
    } else {
      setAgents(DEFAULT_AGENTS);
    }
  }, []);

  const saveAgents = (updated: Agent[]) => {
    setAgents(updated);
    localStorage.setItem("spyro-agents-v2", JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const updateAgent = (id: string, patch: Partial<Agent>) => {
    const updated = agents.map((a) => (a.id === id ? { ...a, ...patch } : a));
    saveAgents(updated);
    setSelected((s) => (s && s.id === id ? { ...s, ...patch } : s));
  };

  const createAgent = () => {
    if (!newName.trim()) return;
    const agent: Agent = {
      id: `agent-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "Custom AI assistant",
      trainingText: "",
      systemPrompt: "",
      temperature: 50,
      model: "openai",
      tokenBudget: 400000,
      tokensUsed: 0,
      active: true,
      apiKey: genApiKey(),
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      createdAt: Date.now(),
    };
    saveAgents([...agents, agent]);
    setSelected(agent);
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    setActiveTab("train");
  };

  const deleteAgent = (id: string) => {
    saveAgents(agents.filter((a) => a.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const generatePrompt = () => {
    if (!selected || !selected.trainingText.trim()) return;
    // Use the training text to generate a system prompt via SPYRO V1.
    updateAgent(selected.id, { systemPrompt: selected.trainingText });
  };

  const testAgent = async () => {
    if (!selected || !testInput.trim() || testing) return;
    setTesting(true);
    setTestOutput("");

    try {
      const prompt = selected.systemPrompt || selected.trainingText || "You are a helpful SPYRO V1 assistant.";
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": selected.apiKey },
        body: JSON.stringify({
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: testInput.trim() },
          ],
          model: selected.model,
          temperature: selected.temperature / 100,
        }),
      });

      if (!res.ok || !res.body) {
        setTestOutput("Error: Could not reach the engine.");
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

      const tokensUsed = Math.ceil((testInput.length + acc.length) / 4);
      updateAgent(selected.id, { tokensUsed: selected.tokensUsed + tokensUsed });
    } catch {
      setTestOutput("Network error.");
    } finally {
      setTesting(false);
    }
  };

  const copyApiKey = () => {
    if (!selected) return;
    navigator.clipboard.writeText(selected.apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 1500);
  };

  const regenerateKey = () => {
    if (!selected) return;
    updateAgent(selected.id, { apiKey: genApiKey() });
  };

  const totalBudget = agents.reduce((s, a) => s + a.tokenBudget, 0);
  const totalUsed = agents.reduce((s, a) => s + a.tokensUsed, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Bot className="h-6 w-6 text-primary" />
          Agent Builder
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create AI assistants. Train them with your instructions. Connect via API.
        </p>
      </div>

      {/* Token overview */}
      <div className="surface-elevated mb-6 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Token Budget</div>
            <div className="mt-1 text-2xl font-bold">
              {totalUsed.toLocaleString()} <span className="text-muted-foreground text-base">/ {totalBudget.toLocaleString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Agents</div>
            <div className="text-lg font-bold text-primary">{agents.length}</div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/50">
          <div className="h-full rounded-full spyro-bg-gradient" style={{ width: `${Math.min((totalUsed / totalBudget) * 100, 100)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Agent list */}
        <div className="space-y-2">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => { setSelected(agent); setActiveTab("train"); }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all",
                selected?.id === agent.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/30"
              )}
            >
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
                style={{ background: agent.avatarColor }}
              >
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{agent.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">{agent.description}</div>
              </div>
              <span className={cn("h-2 w-2 shrink-0 rounded-full", agent.active ? "bg-green-500" : "bg-muted-foreground/40")} />
            </button>
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-4 w-4" /> Create Agent
          </button>
        </div>

        {/* Agent detail */}
        {selected ? (
          <div className="space-y-4">
            {/* Agent header */}
            <div className="surface-elevated rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-lg font-bold text-white"
                  style={{ background: selected.avatarColor }}
                >
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">{selected.name}</h2>
                  <p className="text-xs text-muted-foreground">{selected.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateAgent(selected.id, { active: !selected.active })}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                      selected.active ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {selected.active ? "● Active" : "○ Inactive"}
                  </button>
                  <button
                    onClick={() => deleteAgent(selected.id)}
                    className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-border/40 bg-card/20 p-1">
              {[
                { id: "train" as const, label: "Train", icon: Sliders, locked: false },
                { id: "test" as const, label: "Test", icon: MessageSquare, locked: false },
                { id: "integrate" as const, label: "Integrate", icon: Key, locked: true },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !tab.locked && setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-all",
                    tab.locked ? "text-muted-foreground/40 cursor-not-allowed" :
                    activeTab === tab.id ? "spyro-bg-gradient text-white" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.locked && <Lock className="h-3 w-3" />}
                </button>
              ))}
            </div>

            {/* Train tab */}
            {activeTab === "train" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="surface-elevated space-y-4 rounded-2xl p-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Agent Name
                  </label>
                  <input
                    value={selected.name}
                    onChange={(e) => updateAgent(selected.id, { name: e.target.value })}
                    className="w-full rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Description
                  </label>
                  <input
                    value={selected.description}
                    onChange={(e) => updateAgent(selected.id, { description: e.target.value })}
                    placeholder="What does this agent do?"
                    className="w-full rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Training Instructions
                  </label>
                  <p className="mb-2 text-[11px] text-muted-foreground">
                    Describe how your agent should behave. What's its personality? What should it do? What should it avoid?
                  </p>
                  <textarea
                    value={selected.trainingText}
                    onChange={(e) => updateAgent(selected.id, { trainingText: e.target.value })}
                    placeholder="e.g. You are a friendly doctor. Answer health questions, explain symptoms in simple terms, and always recommend seeing a real doctor for serious issues. Be warm and reassuring."
                    rows={5}
                    className="w-full resize-none rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-[13px] focus:border-primary/40 focus:outline-none"
                  />
                  <button
                    onClick={generatePrompt}
                    disabled={!selected.trainingText.trim()}
                    className="mt-2 flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Apply Training
                  </button>
                </div>

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4 border-t border-border/30 pt-4">
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
                    <div className="flex justify-between text-[10px] text-muted-foreground/60">
                      <span>Precise</span><span>Balanced</span><span>Creative</span>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Engine</div>
                    <select
                      value={selected.model}
                      onChange={(e) => updateAgent(selected.id, { model: e.target.value })}
                      className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm"
                    >
                      <option value="openai">SPYRO V1</option>
                      <option value="openai-fast">SPYRO V1 Turbo</option>
                    </select>
                  </div>
                </div>

                {/* Avatar color */}
                <div>
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Avatar Color</div>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateAgent(selected.id, { avatarColor: color })}
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all",
                          selected.avatarColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                        )}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { saveAgents(agents); }}
                  className="flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-4 py-2 text-sm font-medium text-white"
                >
                  {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Agent</>}
                </button>
              </motion.div>
            )}

            {/* Test tab */}
            {activeTab === "test" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="surface-elevated rounded-2xl p-5">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Test {selected.name}
                  </span>
                </div>
                <div className="mb-3 max-h-64 overflow-y-auto rounded-lg bg-black/20 p-3">
                  {testOutput ? (
                    <p className="whitespace-pre-wrap text-[13px] text-foreground/90">{testOutput}</p>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground">Send a message to test your agent...</p>
                  )}
                </div>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), testAgent())}
                  placeholder={`Message ${selected.name}...`}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                />
                <button
                  onClick={testAgent}
                  disabled={testing || !testInput.trim()}
                  className="mt-2 flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {testing ? `${selected.name} is thinking...` : "Send"}
                </button>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  Tokens used: {selected.tokensUsed.toLocaleString()} / {selected.tokenBudget.toLocaleString()}
                </div>
              </motion.div>
            )}

            {/* Integrate tab — LOCKED for free users */}
            {activeTab === "integrate" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="surface-elevated space-y-4 rounded-2xl p-5">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/15">
                    <Lock className="h-7 w-7 text-amber-400" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold">Integration & API Keys locked</h3>
                  <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
                    Free plan can create and test agents, but connecting them to WhatsApp, Telegram, or generating API keys requires Pro or higher.
                  </p>
                  <button
                    onClick={() => useUIStore.getState().setView("premium")}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl spyro-bg-gradient px-4 py-2 text-xs font-medium text-white"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Upgrade to Pro — KSh 499/mo
                  </button>
                </div>
              </motion.div>
            )}

            {/* Original Integrate tab content — only shown for premium users (not accessible for free) */}
            {false && activeTab === "integrate" && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="surface-elevated space-y-4 rounded-2xl p-5">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">API Key</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this key to call your agent from any app. Include it in the <code className="rounded bg-muted px-1">x-api-key</code> header.
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/20 px-3 py-2">
                  <Terminal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <code className="flex-1 truncate text-[11px] text-muted-foreground">
                    {showKey ? selected?.apiKey : "••••••••••••••••••••••••"}
                  </code>
                  <button onClick={() => setShowKey(!showKey)} className="text-muted-foreground hover:text-foreground">
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={copyApiKey} className="text-muted-foreground hover:text-foreground">
                    {copiedKey ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={regenerateKey} className="text-muted-foreground hover:text-foreground">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Code example */}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Usage Example</div>
                  <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 text-[11px] text-foreground/80">
{`fetch("https://slackbot-seven.vercel.app/api/chat", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-api-key": "${selected?.apiKey ?? ""}"
  },
  body: JSON.stringify({
    messages: [{ role: "user", content: "Hello!" }]
  })
}).then(r => r.text()).then(console.log)`}
                  </pre>
                </div>

                {/* Integration ideas */}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Connect To</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {[
                      { name: "Telegram", icon: "✈️" },
                      { name: "Discord", icon: "🎮" },
                      { name: "WhatsApp", icon: "💬" },
                      { name: "Slack", icon: "💼" },
                      { name: "Web Widget", icon: "🌐" },
                      { name: "REST API", icon: "🔗" },
                    ].map((int) => (
                      <div key={int.name} className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/20 px-3 py-2 text-xs">
                        <span>{int.icon}</span>
                        <span className="text-muted-foreground">{int.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
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
              <p className="mt-1 text-sm text-muted-foreground">Each agent gets 400,000 tokens and its own API key.</p>
              <div className="mt-4 space-y-3">
                <input
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="Agent name (e.g. Dr. Spyro)"
                  className="w-full rounded-xl border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:border-primary/40 focus:outline-none"
                  autoFocus
                />
                <input
                  value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What does it do? (e.g. A medical assistant)"
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
