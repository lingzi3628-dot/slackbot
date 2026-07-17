"use client";

import * as React from "react";
import Editor from "@monaco-editor/react";
import { Sparkles, Play, Save, FileCode2, FolderOpen, Plus, Download, Terminal as TerminalIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { id: "javascript", label: "JavaScript", ext: ".js" },
  { id: "typescript", label: "TypeScript", ext: ".ts" },
  { id: "python", label: "Python", ext: ".py" },
  { id: "json", label: "JSON", ext: ".json" },
  { id: "html", label: "HTML", ext: ".html" },
  { id: "css", label: "CSS", ext: ".css" },
  { id: "markdown", label: "Markdown", ext: ".md" },
  { id: "bash", label: "Bash", ext: ".sh" },
  { id: "sql", label: "SQL", ext: ".sql" },
];

const DEFAULT_CODE: Record<string, string> = {
  javascript: `// SPYRO Studio — AI Code Editor\n// Write code and click Run to execute\n// Use AI to write, refactor, debug, or explain\n\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}\n\n// Print first 10 fibonacci numbers\nfor (let i = 0; i < 10; i++) {\n  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);\n}\n`,
  typescript: `// TypeScript with type checking\ninterface User {\n  id: number;\n  name: string;\n  email: string;\n}\n\nfunction greet(user: User): string {\n  return \`Hello, \${user.name}!\`;\n}\n\nconst user: User = {\n  id: 1,\n  name: "SPYRO User",\n  email: "user@spyro.ai",\n};\n\nconsole.log(greet(user));\n`,
  python: `# Python (executed via AI interpretation)\n# Use the Run button to execute via AI\n\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nfor i in range(10):\n    print(f"fib({i}) = {fibonacci(i)}")\n`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>SPYRO Studio</title>\n  <style>\n    body { font-family: sans-serif; padding: 40px; background: #0a0a0b; color: #f5f5f7; }\n    h1 { color: #8B5CF6; }\n  </style>\n</head>\n<body>\n  <h1>Hello from SPYRO Studio</h1>\n  <p>Edit this HTML and click Run to preview.</p>\n</body>\n</html>`,
};

export function CodeEditorApp() {
  const [code, setCode] = React.useState(DEFAULT_CODE.javascript);
  const [language, setLanguage] = React.useState("javascript");
  const [fileName, setFileName] = React.useState("untitled.js");
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiOutput, setAiOutput] = React.useState<string | null>(null);
  const [output, setOutput] = React.useState<string | null>(null);
  const [htmlPreview, setHtmlPreview] = React.useState<string | null>(null);
  const [aiHistory, setAiHistory] = React.useState<Array<{ role: string; content: string }>>([]);
  const [activeTab, setActiveTab] = React.useState<"editor" | "output" | "ai" | "preview">("editor");

  const switchLanguage = (lang: string) => {
    setLanguage(lang);
    const langConfig = LANGUAGES.find((l) => l.id === lang);
    if (langConfig) {
      setFileName(`untitled${langConfig.ext}`);
      if (DEFAULT_CODE[lang]) setCode(DEFAULT_CODE[lang]);
    }
  };

  const askAI = async (action?: string) => {
    const prompt = action || aiPrompt.trim();
    if (!prompt) return;
    setAiLoading(true);
    setAiOutput(null);
    setActiveTab("ai");
    const userMsg = { role: "user", content: prompt };
    setAiHistory((h) => [...h, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `You are an expert AI code assistant inside SPYRO Studio. The user is working on a ${language} file named ${fileName}.\n\nCurrent code:\n\`\`\`${language}\n${code}\n\`\`\`\n\nProvide helpful, specific, actionable advice. If writing code, respond with ONLY the code (no markdown fences, no explanations). If explaining, be concise.` },
            ...aiHistory.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: prompt },
          ],
        }),
      });
      const text = await res.text();
      let reply: string;
      try {
        const data = JSON.parse(text);
        reply = data.choices?.[0]?.message?.content || data.reply || text;
      } catch {
        reply = text;
      }
      // Strip markdown fences
      const cleaned = reply.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
      setAiOutput(cleaned);
      setAiHistory((h) => [...h, { role: "assistant", content: reply }]);
    } catch (e) {
      setAiOutput(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setAiLoading(false);
      setAiPrompt("");
    }
  };

  const applyAIResult = () => {
    if (aiOutput) {
      setCode(aiOutput);
      setAiOutput(null);
      setActiveTab("editor");
    }
  };

  const runCode = async () => {
    setActiveTab("output");
    setOutput("Running...\n");

    if (language === "javascript" || language === "typescript") {
      try {
        const logs: string[] = [];
        const errors: string[] = [];
        const consoleMock = {
          log: (...args: any[]) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
          error: (...args: any[]) => errors.push("ERROR: " + args.map(a => typeof a === "object" ? JSON.stringify(a) : String(a)).join(" ")),
          warn: (...args: any[]) => logs.push("⚠ " + args.map(a => String(a)).join(" ")),
          info: (...args: any[]) => logs.push("ℹ " + args.map(a => String(a)).join(" ")),
          table: (data: any) => logs.push(JSON.stringify(data, null, 2)),
          group: () => {}, groupEnd: () => {}, time: () => {}, timeEnd: () => {},
          dir: (obj: any) => logs.push(JSON.stringify(obj, null, 2)),
          count: (label: string) => logs.push(`${label}: counted`),
          assert: (cond: boolean, msg: string) => { if (!cond) errors.push("Assertion failed: " + msg); },
          trace: () => logs.push("Trace"),
        };

        // Strip TypeScript types for execution
        let jsCode = code;
        if (language === "typescript") {
          jsCode = code
            .replace(/:\s*[A-Za-z<>[\]|&{},\s]+(?=\s*[=;)])/g, "")
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
            .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
            .replace(/import\s+.*from\s+['"][^'"]+['"];?/g, "")
            .replace(/export\s+/g, "");
        }

        const fn = new Function("console", jsCode);
        fn(consoleMock);

        const result = [...logs, ...errors].join("\n") || "(no output)";
        setOutput(result);
      } catch (e) {
        setOutput(`Error: ${e instanceof Error ? e.message : "Failed to execute"}\n${e instanceof Error && e.stack ? e.stack.split("\n").slice(0, 3).join("\n") : ""}`);
      }
    } else if (language === "html") {
      setHtmlPreview(code);
      setActiveTab("preview");
      setOutput("HTML rendered in preview tab.");
    } else if (language === "python") {
      // Execute Python via AI
      setOutput("Executing Python via AI...\n");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: "You are a Python code executor. Execute the following Python code and respond with ONLY the output (what would be printed to stdout). No explanations, no markdown. If there's an error, show the error message." },
              { role: "user", content: code },
            ],
          }),
        });
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setOutput(data.choices?.[0]?.message?.content || data.reply || text);
        } catch {
          setOutput(text);
        }
      } catch (e) {
        setOutput(`Python execution error: ${e instanceof Error ? e.message : "Failed"}`);
      }
    } else if (language === "json") {
      try {
        const parsed = JSON.parse(code);
        setOutput(JSON.stringify(parsed, null, 2));
      } catch (e) {
        setOutput(`JSON Error: ${e instanceof Error ? e.message : "Invalid JSON"}`);
      }
    } else if (language === "sql") {
      setOutput("SQL execution is not available in the browser. Use 'ai <question>' to get help with SQL queries.");
    } else {
      setOutput(`${language} execution is not available in the browser. Use the AI tab to ask for help.`);
    }
  };

  const saveToDisk = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadFromDisk = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".js,.ts,.py,.json,.html,.css,.md,.sh,.sql,.txt,*/*";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        setCode(reader.result as string);
        setFileName(file.name);
        const ext = file.name.split(".").pop()?.toLowerCase();
        const langMap: Record<string, string> = { js: "javascript", ts: "typescript", py: "python", json: "json", html: "html", css: "css", md: "markdown", sh: "bash", sql: "sql" };
        if (ext && langMap[ext]) setLanguage(langMap[ext]);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const newFile = () => {
    setCode(DEFAULT_CODE[language] || "// New file\n");
    const ext = LANGUAGES.find((l) => l.id === language)?.ext || ".txt";
    setFileName(`untitled${ext}`);
    setOutput(null);
    setAiOutput(null);
    setAiHistory([]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border bg-card/40 px-3 py-2">
        <FileCode2 className="h-4 w-4 text-primary" />
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="w-32 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs font-medium hover:border-border focus:border-primary/30 focus:outline-none"
        />
        <select value={language} onChange={(e) => switchLanguage(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1 text-xs">
          {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <div className="mx-1 h-4 w-px bg-border" />
        <button onClick={runCode} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/25">
          <Play className="h-3 w-3" /> Run
        </button>
        <button onClick={newFile} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary" title="New file"><Plus className="h-3.5 w-3.5" /></button>
        <button onClick={loadFromDisk} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary" title="Open from disk"><FolderOpen className="h-3.5 w-3.5" /></button>
        <button onClick={saveToDisk} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-medium hover:bg-secondary"><Save className="h-3 w-3" /> Save</button>
        <button onClick={saveToDisk} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary" title="Download"><Download className="h-3.5 w-3.5" /></button>

        {/* Tabs */}
        <div className="ml-auto flex items-center gap-1">
          {(["editor", "output", "preview", "ai"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn("rounded-lg px-2.5 py-1 text-[11px] font-medium capitalize transition-colors", activeTab === tab ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}
            >
              {tab}
            </button>
          ))}
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400">
            <Sparkles className="h-2.5 w-2.5" /> AI
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Editor / Output / Preview */}
        <div className="min-w-0 flex-1">
          {activeTab === "editor" && (
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(v) => setCode(v || "")}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "Geist Mono, 'Fira Code', monospace",
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                renderLineHighlight: "all",
                fontLigatures: true,
                wordWrap: "on",
                tabSize: 2,
                automaticLayout: true,
              }}
            />
          )}
          {activeTab === "output" && (
            <div className="h-full overflow-auto bg-[#0a0a0b] p-4">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <TerminalIcon className="h-3 w-3" /> Console Output
              </div>
              <pre className="font-mono text-xs text-emerald-400 whitespace-pre-wrap">{output || "Click Run to execute code."}</pre>
            </div>
          )}
          {activeTab === "preview" && (
            <div className="h-full bg-white">
              {htmlPreview ? (
                <iframe srcDoc={htmlPreview} className="h-full w-full border-0" title="HTML Preview" sandbox="allow-scripts" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Switch to HTML language and click Run to preview.</div>
              )}
            </div>
          )}
          {activeTab === "ai" && (
            <div className="flex h-full flex-col bg-[#0a0a0b]">
              {/* AI chat history */}
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                {aiHistory.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="grid h-10 w-10 place-items-center rounded-xl spyro-bg-gradient text-white"><Sparkles className="h-5 w-5" /></div>
                    <p className="mt-2 text-xs text-muted-foreground">Ask AI to write, refactor, debug, or explain code.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiHistory.map((m, i) => (
                      <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-xs", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground")}>
                          <pre className="whitespace-pre-wrap font-mono text-[11px]">{m.content}</pre>
                        </div>
                      </div>
                    ))}
                    {aiLoading && <div className="flex justify-start"><div className="rounded-xl bg-secondary px-3 py-2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /></div></div>}
                    {aiOutput && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-xl bg-secondary p-3">
                          <pre className="whitespace-pre-wrap font-mono text-[11px]">{aiOutput}</pre>
                          <button onClick={applyAIResult} className="mt-2 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/25">Apply to editor →</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* AI input */}
              <div className="shrink-0 border-t border-border p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAI(); } }}
                    placeholder="Ask AI to write, refactor, debug, or explain…"
                    rows={1}
                    className="flex-1 resize-none rounded-lg border border-border bg-card p-2 text-xs placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
                  />
                  <button onClick={() => askAI()} disabled={!aiPrompt.trim() || aiLoading} className="shrink-0 rounded-lg spyro-bg-gradient px-3 py-2 text-[11px] font-medium text-white disabled:opacity-40">Send</button>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {["Refactor this code", "Find bugs", "Add comments", "Write tests", "Explain this code", "Optimize performance"].map((q) => (
                    <button key={q} onClick={() => askAI(q)} className="rounded-full border border-border bg-card px-2 py-0.5 text-[9px] text-muted-foreground hover:bg-secondary hover:text-foreground">{q}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
