"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import { Sparkles, Play, Save, FileCode2 } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = ["javascript", "typescript", "python", "json", "html", "css", "markdown", "bash", "sql"];

export function CodeEditorApp() {
  const [code, setCode] = React.useState<string>("// SPYRO Studio — AI Code Editor\n// Start coding or ask AI for help\n\nfunction spyro() {\n  console.log('Hello from SPYRO Studio!');\n  return 'Ready to build';\n}\n");
  const [language, setLanguage] = React.useState("javascript");
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiOutput, setAiOutput] = React.useState<string | null>(null);
  const [output, setOutput] = React.useState<string | null>(null);

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiOutput(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are an AI code assistant. The user is working in a ${language} file with this code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\nRequest: ${aiPrompt}\n\nRespond with only the code (no explanations, no markdown fences).`,
          }],
        }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        const reply = data.choices?.[0]?.message?.content || data.reply || text;
        // Strip markdown code fences if present
        const cleaned = reply.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
        setAiOutput(cleaned);
      } catch {
        setAiOutput(text);
      }
    } catch (e) {
      setAiOutput(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAIResult = () => {
    if (aiOutput) {
      setCode(aiOutput);
      setAiOutput(null);
    }
  };

  const runCode = () => {
    if (language === "javascript" || language === "typescript") {
      try {
        const logs: string[] = [];
        const consoleLog = (...args: any[]) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" "));
        
        const fn = new Function("console", code);
        fn({ log: consoleLog, error: consoleLog, warn: consoleLog });
        setOutput(logs.join("\n") || "(no output)");
      } catch (e) {
        setOutput(`Error: ${e instanceof Error ? e.message : "Failed"}`);
      }
    } else {
      setOutput(`Cannot run ${language} in the browser. Use the AI to generate and explain code.`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/40 px-3 py-2">
        <FileCode2 className="h-4 w-4 text-primary" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs focus:outline-none"
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <button onClick={runCode} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/25">
          <Play className="h-3 w-3" /> Run
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-secondary">
          <Save className="h-3 w-3" /> Save
        </button>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400">
          <Sparkles className="h-2.5 w-2.5" /> AI enabled
        </span>
      </div>

      {/* Editor + AI panel */}
      <div className="flex min-h-0 flex-1">
        {/* Monaco editor */}
        <div className="min-w-0 flex-1">
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(v) => setCode(v || "")}
            theme="vs-dark"
            options={{
              fontSize: 13,
              fontFamily: "Geist Mono, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12, bottom: 12 },
              smoothScrolling: true,
              cursorBlinking: "smooth",
              renderLineHighlight: "all",
              fontLigatures: true,
            }}
          />
        </div>

        {/* AI side panel */}
        <div className="flex w-72 shrink-0 flex-col border-l border-border bg-card/40">
          <div className="shrink-0 border-b border-border p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" /> AI Assistant
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask AI to write, refactor, debug, or explain code…"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
            />
            <button
              onClick={askAI}
              disabled={!aiPrompt.trim() || aiLoading}
              className="mt-2 w-full rounded-lg spyro-bg-gradient py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
            >
              {aiLoading ? "Generating…" : "Generate Code"}
            </button>
          </div>

          {/* AI output */}
          {aiOutput && (
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">AI Result</span>
                <button onClick={applyAIResult} className="rounded-lg bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25">
                  Apply to editor
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-background p-2 text-[11px] leading-relaxed"><code>{aiOutput}</code></pre>
            </div>
          )}

          {/* Run output */}
          {output && (
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-border p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Output</div>
              <pre className="whitespace-pre-wrap text-[11px] text-emerald-400">{output}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
