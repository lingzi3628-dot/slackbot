"use client";

import * as React from "react";
import Editor, { loader } from "@monaco-editor/react";
import {
  Sparkles, Play, Save, FileCode2, FolderOpen, Plus, Download,
  Terminal as TerminalIcon, Loader2, X, FileText, Folder, ChevronRight,
  ChevronDown, Search, GitBranch, RefreshCw, Files, PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
});

const TerminalApp = dynamic(() => import("./terminal-app").then((m) => m.TerminalApp), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center bg-[#0a0a0b] text-muted-foreground"><span className="text-xs">Loading terminal…</span></div>,
});

// ── Types ─────────────────────────────────────────────────────────────
interface FileNode {
  name: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: FileNode[];
}

// ── Default project structure ─────────────────────────────────────────
const DEFAULT_PROJECT: FileNode = {
  name: "project",
  type: "folder",
  children: [
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "index.js",
          type: "file",
          language: "javascript",
          content: `// SPYRO Studio — Full IDE\n// Multi-file project with terminal\n\nfunction main() {\n  console.log("Hello from SPYRO Studio!");\n  console.log("Edit files in the explorer →");\n  console.log("Run code with the Run button ↓");\n}\n\nmain();\n`,
        },
        {
          name: "utils.js",
          type: "file",
          language: "javascript",
          content: `// Utility functions\n\nexport function add(a, b) {\n  return a + b;\n}\n\nexport function multiply(a, b) {\n  return a * b;\n}\n`,
        },
      ],
    },
    {
      name: "README.md",
      type: "file",
      language: "markdown",
      content: "# SPYRO Studio Project\n\nA full IDE inside your browser.\n\n- File explorer with multiple files\n- Built-in terminal\n- AI assistant\n- Run JavaScript/TypeScript\n",
    },
    {
      name: "package.json",
      type: "file",
      language: "json",
      content: JSON.stringify({ name: "spyro-project", version: "1.0.0", main: "src/index.js" }, null, 2),
    },
  ],
};

const LANG_MAP: Record<string, string> = {
  js: "javascript", ts: "typescript", py: "python", json: "json",
  html: "html", css: "css", md: "markdown", sh: "bash", sql: "sql",
  txt: "plaintext", xml: "xml", yaml: "yaml", yml: "yaml",
};

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return LANG_MAP[ext] || "plaintext";
}

// ── Main IDE Component ────────────────────────────────────────────────
export function VSCodeApp() {
  const [project, setProject] = React.useState<FileNode>(DEFAULT_PROJECT);
  const [openTabs, setOpenTabs] = React.useState<Array<{ path: string; name: string; content: string; language: string }>>([]);
  const [activeTab, setActiveTab] = React.useState<string | null>(null);
  const [showExplorer, setShowExplorer] = React.useState(true);
  const [showTerminal, setShowTerminal] = React.useState(false);
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(["project", "project/src"]));
  const [output, setOutput] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const fileIdCounter = React.useRef(0);

  // Flatten project to get all file paths
  const flattenFiles = (node: FileNode, basePath = ""): Array<{ path: string; name: string; node: FileNode }> => {
    const path = basePath ? `${basePath}/${node.name}` : node.name;
    if (node.type === "file") return [{ path, name: node.name, node }];
    if (!node.children) return [];
    return node.children.flatMap((child) => flattenFiles(child, path));
  };

  const allFiles = React.useMemo(() => flattenFiles(project), [project]);

  // Open a file in a tab
  const openFile = (path: string, name: string, content: string, language: string) => {
    const existing = openTabs.find((t) => t.path === path);
    if (existing) { setActiveTab(path); return; }
    setOpenTabs((prev) => [...prev, { path, name, content, language }]);
    setActiveTab(path);
  };

  // Close a tab
  const closeTab = (path: string) => {
    setOpenTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTab === path) {
      const remaining = openTabs.filter((t) => t.path !== path);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
    }
  };

  // Update file content
  const updateContent = (path: string, content: string) => {
    setOpenTabs((prev) => prev.map((t) => t.path === path ? { ...t, content } : t));
    // Also update the project tree
    updateProjectFile(project, path, content, setProject);
  };

  const updateProjectFile = (node: FileNode, path: string, content: string, setter: React.Dispatch<React.SetStateAction<FileNode>>) => {
    setter((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      const parts = path.split("/");
      let current = clone;
      for (let i = 1; i < parts.length - 1; i++) {
        current = current.children?.find((c: FileNode) => c.name === parts[i]) || current;
      }
      const file = current.children?.find((c: FileNode) => c.name === parts[parts.length - 1]);
      if (file) file.content = content;
      return clone;
    });
  };

  // Run active file
  const runCode = async () => {
    const tab = openTabs.find((t) => t.path === activeTab);
    if (!tab) return;
    setOutput("Running...\n");

    if (tab.language === "javascript" || tab.language === "typescript") {
      try {
        const logs: string[] = [];
        const errors: string[] = [];
        let code = tab.content;
        if (tab.language === "typescript") {
          code = code.replace(/:\s*[A-Za-z<>[\]|&{},\s]+(?=\s*[=;)])/g, "")
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, "")
            .replace(/type\s+\w+\s*=\s*[^;]+;/g, "")
            .replace(/import\s+.*from\s+['"][^'"]+['"];?/g, "")
            .replace(/export\s+/g, "");
        }
        const fn = new Function("console", code);
        fn({
          log: (...a: any[]) => logs.push(a.map(x => typeof x === "object" ? JSON.stringify(x, null, 2) : String(x)).join(" ")),
          error: (...a: any[]) => errors.push("ERROR: " + a.join(" ")),
          warn: (...a: any[]) => logs.push("⚠ " + a.join(" ")),
          info: (...a: any[]) => logs.push("ℹ " + a.join(" ")),
        });
        setOutput([...logs, ...errors].join("\n") || "(no output)");
      } catch (e) {
        setOutput(`Error: ${e instanceof Error ? e.message : "Failed"}`);
      }
    } else if (tab.language === "python") {
      setOutput("Executing Python via AI...\n");
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: [
            { role: "system", content: "Execute this Python code and respond with ONLY the output (stdout). No explanations." },
            { role: "user", content: tab.content },
          ]}),
        });
        const text = await res.text();
        try { const d = JSON.parse(text); setOutput(d.choices?.[0]?.message?.content || text); }
        catch { setOutput(text); }
      } catch (e) { setOutput(`Error: ${e instanceof Error ? e.message : "Failed"}`); }
    } else if (tab.language === "html") {
      setOutput("HTML rendered — use Preview tab in the code editor app.");
    } else {
      setOutput(`${tab.language} execution not supported. Use the AI for help.`);
    }
  };

  // New file
  const newFile = () => {
    const name = prompt("File name (e.g. index.js):");
    if (!name) return;
    const lang = getLanguage(name);
    const newFileNode: FileNode = { name, type: "file", language: lang, content: "" };
    setProject((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      clone.children = [...(clone.children || []), newFileNode];
      return clone;
    });
    openFile(`project/${name}`, name, "", lang);
  };

  // Load from disk
  const loadFromDisk = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".js,.ts,.py,.json,.html,.css,.md,.sh,.sql,.txt,*/*";
    input.multiple = true;
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files) as File[];
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          const lang = getLanguage(file.name);
          openFile(`project/${file.name}`, file.name, content, lang);
        };
        reader.readAsText(file);
      });
    };
    input.click();
  };

  // Save to disk
  const saveToDisk = () => {
    const tab = openTabs.find((t) => t.path === activeTab);
    if (!tab) return;
    const blob = new Blob([tab.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tab.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Filtered files for search
  const filteredFiles = searchQuery
    ? allFiles.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allFiles;

  return (
    <div className="flex h-full flex-col bg-[#0a0a0b]">
      {/* ── Top Bar ────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-[#16171c] px-2 py-1.5">
        <button
          onClick={() => setShowExplorer((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
          title="Toggle explorer"
        >
          {showExplorer ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button onClick={newFile} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary" title="New file"><Plus className="h-4 w-4" /></button>
        <button onClick={loadFromDisk} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary" title="Open from disk"><FolderOpen className="h-4 w-4" /></button>
        <button onClick={saveToDisk} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary" title="Save to disk"><Save className="h-4 w-4" /></button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button onClick={runCode} className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/25">
          <Play className="h-3 w-3" /> Run
        </button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button
          onClick={() => setShowTerminal((v) => !v)}
          className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium", showTerminal ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary")}
        >
          <TerminalIcon className="h-3 w-3" /> Terminal
        </button>
        <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
          <GitBranch className="h-3 w-3" /> main
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400"><Sparkles className="h-2.5 w-2.5" /> AI</span>
        </div>
      </div>

      {/* ── Main Body ──────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* Explorer Sidebar */}
        {showExplorer && (
          <div className="flex w-56 shrink-0 flex-col border-r border-border bg-[#16171c]">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Explorer</span>
              <button onClick={newFile} className="grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-secondary"><Plus className="h-3 w-3" /></button>
            </div>
            {/* Search */}
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/40" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files…"
                  className="w-full rounded-md border border-border bg-[#0a0a0b] py-1 pl-7 pr-2 text-[11px] placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none"
                />
              </div>
            </div>
            {/* File tree */}
            <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-2">
              {searchQuery ? (
                // Flat search results
                filteredFiles.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => openFile(f.path, f.name, f.node.content || "", f.node.language || getLanguage(f.name))}
                    className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <FileText className="h-3 w-3 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))
              ) : (
                // Full tree
                <FileTree
                  node={project}
                  basePath=""
                  expandedFolders={expandedFolders}
                  onToggle={toggleFolder}
                  onOpenFile={openFile}
                  activePath={activeTab}
                  depth={0}
                />
              )}
            </div>
          </div>
        )}

        {/* Editor + Terminal area */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Tabs */}
          <div className="flex shrink-0 items-center overflow-x-auto border-b border-border bg-[#16171c]">
            {openTabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => setActiveTab(tab.path)}
                className={cn(
                  "group flex shrink-0 items-center gap-2 border-r border-border px-3 py-1.5 text-[11px] transition-colors",
                  activeTab === tab.path ? "bg-[#0a0a0b] text-foreground" : "text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <FileCode2 className="h-3 w-3" />
                {tab.name}
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.path); }}
                  className="grid h-4 w-4 place-items-center rounded opacity-50 hover:bg-destructive/10 hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="min-h-0 flex-1">
            {activeTab ? (
              <Editor
                height="100%"
                language={openTabs.find((t) => t.path === activeTab)?.language || "plaintext"}
                value={openTabs.find((t) => t.path === activeTab)?.content || ""}
                onChange={(v) => activeTab && updateContent(activeTab, v || "")}
                theme="vs-dark"
                loading={<div className="flex h-full items-center justify-center bg-[#0a0a0b]"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
                options={{
                  fontSize: 13,
                  fontFamily: "Geist Mono, 'Fira Code', monospace",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  padding: { top: 8, bottom: 8 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                  renderLineHighlight: "all",
                  fontLigatures: true,
                  wordWrap: "on",
                  tabSize: 2,
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary/60"><FileCode2 className="h-8 w-8 text-muted-foreground" /></div>
                <p className="mt-3 text-sm text-muted-foreground">Open a file from the explorer to start editing</p>
                <button onClick={newFile} className="mt-3 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary"><Plus className="mr-1 inline h-3 w-3" /> New File</button>
              </div>
            )}
          </div>

          {/* Output panel */}
          {output && (
            <div className="shrink-0 max-h-48 overflow-y-auto border-t border-border bg-[#0a0a0b] p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Output</span>
                <button onClick={() => setOutput(null)} className="grid h-4 w-4 place-items-center rounded text-muted-foreground hover:bg-secondary"><X className="h-3 w-3" /></button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-[12px] text-emerald-400">{output}</pre>
            </div>
          )}

          {/* Terminal panel */}
          {showTerminal && (
            <div className="h-56 shrink-0 border-t border-border">
              <TerminalApp />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── File Tree Component ───────────────────────────────────────────────
function FileTree({
  node, basePath, expandedFolders, onToggle, onOpenFile, activePath, depth,
}: {
  node: FileNode;
  basePath: string;
  expandedFolders: Set<string>;
  onToggle: (path: string) => void;
  onOpenFile: (path: string, name: string, content: string, language: string) => void;
  activePath: string | null;
  depth: number;
}) {
  const path = basePath ? `${basePath}/${node.name}` : node.name;
  const isExpanded = expandedFolders.has(path);

  if (node.type === "file") {
    return (
      <button
        onClick={() => onOpenFile(path, node.name, node.content || "", node.language || getLanguage(node.name))}
        className={cn(
          "flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[12px] transition-colors",
          activePath === path ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileText className="h-3 w-3 shrink-0" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => onToggle(path)}
        className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        {isExpanded ? <Folder className="h-3 w-3 shrink-0 text-blue-400" /> : <Folder className="h-3 w-3 shrink-0 text-blue-400" />}
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {isExpanded && node.children?.map((child) => (
        <FileTree
          key={child.name}
          node={child}
          basePath={path}
          expandedFolders={expandedFolders}
          onToggle={onToggle}
          onOpenFile={onOpenFile}
          activePath={activePath}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
