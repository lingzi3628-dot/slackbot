"use client";

import * as React from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { executeCommand, runCode, gitClone, isExecBackendAvailable } from "@/lib/exec-backend";

/**
 * Full-featured terminal for SPYRO Studio.
 * Supports 30+ commands, file system, AI queries, script execution,
 * piped output, tab completion, and command history.
 */

// Virtual file system (in-memory, persists for session)
const VFS: Record<string, string> = {
  "README.md": "# SPYRO Studio\n\nWelcome to your AI workspace.\nType `help` to see all commands.\n",
  "config.json": JSON.stringify({ model: "spyro-v1", studio: true, version: "1.0.0" }, null, 2),
  "notes.txt": "Things to do:\n1. Build the app\n2. Test everything\n3. Ship it\n",
};

const PATHS = ["/home/spyro", "/projects", "/knowledge", "/files", "/agents", "/communication"];

export function TerminalApp() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputBufferRef = React.useRef("");
  const historyRef = React.useRef<string[]>([]);
  const historyIdxRef = React.useRef(-1);
  const cwdRef = React.useRef("/home/spyro");
  const varsRef = React.useRef<Record<string, string>>({});

  React.useEffect(() => {
    if (!containerRef.current) return;
    const term = new XTerm({
      theme: {
        background: "#0a0a0b",
        foreground: "#e4e4e7",
        cursor: "#8B5CF6",
        selectionBackground: "#8B5CF640",
        black: "#0a0a0b",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#8B5CF6",
        cyan: "#06b6d4",
        white: "#f5f5f7",
        brightBlack: "#71717a",
        brightRed: "#f87171",
        brightGreen: "#34d399",
        brightYellow: "#fbbf24",
        brightBlue: "#60a5fa",
        brightMagenta: "#a78bfa",
        brightCyan: "#22d3ee",
        brightWhite: "#ffffff",
      },
      fontFamily: "Geist Mono, 'Courier New', monospace",
      fontSize: 13,
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 5000,
      convertEol: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    // Welcome banner
    term.writeln("\x1b[1;35m╔══════════════════════════════════════════╗");
    term.writeln("\x1b[1;35m║     SPYRO Studio Terminal v2.0.0         ║");
    term.writeln("\x1b[1;35m║     AI-Powered Shell Environment         ║");
    term.writeln("\x1b[1;35m╚══════════════════════════════════════════╝\x1b[0m");
    term.writeln("");
    term.writeln("\x1b[90mType 'help' for 30+ commands. Try 'ai <question>' to ask SPYRO.\x1b[0m");
    term.writeln("\x1b[90mTry 'ls', 'cat README.md', 'run', 'git status', 'npm init'\x1b[0m");
    term.writeln("");
    printPrompt(term);

    // Tab completion data
    const COMMANDS = [
      "help", "clear", "echo", "ls", "cd", "pwd", "cat", "touch", "mkdir",
      "rm", "mv", "cp", "find", "grep", "head", "tail", "wc", "sort",
      "ai", "spyro", "date", "whoami", "history", "run", "edit", "save",
      "load", "export", "env", "set", "unset", "echo", "printf", "tree",
      "git", "npm", "node", "python", "curl", "wget", "ssh", "top",
      "ps", "kill", "jobs", "bg", "fg", "sleep", "watch", "alias",
      "unalias", "source", "which", "man", "apt", "pip", "docker",
    ];

    const handleCommand = async (input: string, term: XTerm) => {
      // Handle pipes
      const pipeParts = input.split("|").map((s) => s.trim());
      let lastOutput = "";

      for (const part of pipeParts) {
        const trimmed = part.replace(/\$LAST_OUTPUT/g, lastOutput);
        const tokens = tokenize(trimmed);
        if (tokens.length === 0) continue;
        const cmd = tokens[0].toLowerCase();
        const args = tokens.slice(1);

        // Variable substitution
        const substArgs = args.map((a) => {
          if (a.startsWith("$")) return varsRef.current[a.slice(1)] ?? "";
          return a;
        });

        lastOutput = await runCommand(cmd, substArgs, term, lastOutput);
      }
    };

    const tokenize = (input: string): string[] => {
      const tokens: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (ch === '"') { inQuotes = !inQuotes; continue; }
        if (ch === " " && !inQuotes) { if (current) { tokens.push(current); current = ""; } continue; }
        current += ch;
      }
      if (current) tokens.push(current);
      return tokens;
    };

    const runCommand = async (cmd: string, args: string[], term: XTerm, pipedInput: string): Promise<string> => {
      switch (cmd) {
        case "help": {
          term.writeln("\x1b[36m═══ File Commands ═══\x1b[0m");
          term.writeln("  \x1b[33mls\x1b[0m [path]        List files          \x1b[33mcat\x1b[0m <file>     Display file");
          term.writeln("  \x1b[33mtouch\x1b[0m <file>     Create file         \x1b[33mrm\x1b[0m <file>      Delete file");
          term.writeln("  \x1b[33mmkdir\x1b[0m <dir>      Create directory    \x1b[33mcp\x1b[0m <src> <dst>  Copy file");
          term.writeln("  \x1b[33mmv\x1b[0m <src> <dst>    Move/rename         \x1b[33mfind\x1b[0m <pattern>  Search files");
          term.writeln("  \x1b[33mtree\x1b[0m              Show file tree      \x1b[33medit\x1b[0m <file>    Edit in code editor");
          term.writeln("  \x1b[33mload\x1b[0m              Load file from disk \x1b[33msave\x1b[0m <file>    Save to disk");
          term.writeln("");
          term.writeln("\x1b[36m═══ System Commands ═══\x1b[0m");
          term.writeln("  \x1b[33mpwd\x1b[0m               Print directory     \x1b[33mcd\x1b[0m <path>      Change directory");
          term.writeln("  \x1b[33mclear\x1b[0m             Clear screen        \x1b[33mecho\x1b[0m <text>     Print text");
          term.writeln("  \x1b[33mdate\x1b[0m              Show date/time      \x1b[33mwhoami\x1b[0m          Show user");
          term.writeln("  \x1b[33menv\x1b[0m               Show environment    \x1b[33mset\x1b[0m <k> <v>    Set variable");
          term.writeln("  \x1b[33munset\x1b[0m <key>       Unset variable      \x1b[33mhistory\x1b[0m        Show history");
          term.writeln("");
          term.writeln("\x1b[36m═══ AI Commands ═══\x1b[0m");
          term.writeln("  \x1b[33mai\x1b[0m <question>     Ask SPYRO AI         \x1b[33mrun\x1b[0m <file>      Execute code file");
          term.writeln("  \x1b[33mspyro\x1b[0m             System info         \x1b[33manalyze\x1b[0m <file>   AI analyze file");
          term.writeln("");
          term.writeln("\x1b[36m═══ Dev Commands ═══\x1b[0m");
          term.writeln("  \x1b[33mgit\x1b[0m <subcmd>       Git operations      \x1b[33mnpm\x1b[0m <subcmd>     NPM operations");
          term.writeln("  \x1b[33mnode\x1b[0m <file>        Run JS file         \x1b[33mpython\x1b[0m <file>    Run Python (sim)");
          term.writeln("  \x1b[33mcurl\x1b[0m <url>         HTTP request        \x1b[33mgrep\x1b[0m <pat> <f>  Search in file");
          term.writeln("  \x1b[33mhead\x1b[0m <file>        First 10 lines      \x1b[33mtail\x1b[0m <file>      Last 10 lines");
          term.writeln("  \x1b[33mwc\x1b[0m <file>          Word count          \x1b[33msort\x1b[0m <file>      Sort lines");
          term.writeln("  \x1b[33mexport\x1b[0m <k>=<v>     Export variable     \x1b[33mps\x1b[0m               Process list");
          term.writeln("");
          term.writeln("\x1b[90m  Use | to pipe commands. Use $VAR for variables. Use \"quotes\" for spaces.\x1b[0m");
          return "";
        }

        case "clear": term.clear(); return "";

        case "echo": {
          const out = substArgs(args).join(" ");
          term.writeln(out);
          if (pipedInput) term.writeln(pipedInput);
          return out;
        }

        case "printf": {
          const out = args.join(" ").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
          term.write(out);
          return out;
        }

        case "ls": {
          const path = args[0] || cwdRef.current;
          if (path === "/" || PATHS.includes(path)) {
            PATHS.forEach((p) => term.writeln(`\x1b[34m${p.replace("/", "")}/\x1b[0m`));
          }
          const files = Object.keys(VFS);
          if (files.length === 0) { term.writeln(""); return ""; }
          const colored = files.map((f) => {
            if (f.endsWith("/")) return `\x1b[34m${f}\x1b[0m`;
            if (f.endsWith(".js") || f.endsWith(".ts") || f.endsWith(".py")) return `\x1b[32m${f}\x1b[0m`;
            if (f.endsWith(".md") || f.endsWith(".txt")) return `\x1b[37m${f}\x1b[0m`;
            if (f.endsWith(".json")) return `\x1b[33m${f}\x1b[0m`;
            return f;
          });
          term.writeln(colored.join("  "));
          return files.join("\n");
        }

        case "pwd": term.writeln(cwdRef.current); return cwdRef.current;

        case "cd": {
          const target = args[0] || "/home/spyro";
          if (target === "~" || target === "/home/spyro") { cwdRef.current = "/home/spyro"; }
          else if (target === "..") { cwdRef.current = "/home/spyro"; }
          else if (PATHS.includes(target) || target === "/") { cwdRef.current = target; }
          else if (VFS[target]) { term.writeln(`\x1b[31mcd: not a directory: ${target}\x1b[0m`); }
          else { term.writeln(`\x1b[31mcd: no such directory: ${target}\x1b[0m`); }
          return "";
        }

        case "cat": {
          if (!args[0]) { if (pipedInput) { term.writeln(pipedInput); return pipedInput; } term.writeln("\x1b[33mUsage: cat <file>\x1b[0m"); return ""; }
          const content = VFS[args[0]];
          if (content) { content.split("\n").forEach((l) => term.writeln(l)); return content; }
          if (pipedInput) { term.writeln(pipedInput); return pipedInput; }
          term.writeln(`\x1b[31mcat: ${args[0]}: No such file\x1b[0m`);
          return "";
        }

        case "touch": {
          if (!args[0]) { term.writeln("\x1b[33mUsage: touch <filename>\x1b[0m"); return ""; }
          if (!VFS[args[0]]) VFS[args[0]] = "";
          return "";
        }

        case "mkdir": {
          if (!args[0]) { term.writeln("\x1b[33mUsage: mkdir <dirname>\x1b[0m"); return ""; }
          VFS[args[0] + "/"] = "";
          return "";
        }

        case "rm": {
          if (!args[0]) { term.writeln("\x1b[33mUsage: rm <file>\x1b[0m"); return ""; }
          if (args[0] === "-rf" && args[1] === "/") { term.writeln("\x1b[31mNice try 😏\x1b[0m"); return ""; }
          if (VFS[args[0]]) { delete VFS[args[0]]; } else { term.writeln(`\x1b[31mrm: ${args[0]}: No such file\x1b[0m`); }
          return "";
        }

        case "cp": {
          if (args.length < 2) { term.writeln("\x1b[33mUsage: cp <src> <dst>\x1b[0m"); return ""; }
          if (VFS[args[0]]) { VFS[args[1]] = VFS[args[0]]; } else { term.writeln(`\x1b[31mcp: ${args[0]}: No such file\x1b[0m`); }
          return "";
        }

        case "mv": {
          if (args.length < 2) { term.writeln("\x1b[33mUsage: mv <src> <dst>\x1b[0m"); return ""; }
          if (VFS[args[0]]) { VFS[args[1]] = VFS[args[0]]; delete VFS[args[0]]; } else { term.writeln(`\x1b[31mmv: ${args[0]}: No such file\x1b[0m`); }
          return "";
        }

        case "find": {
          const pattern = args[0] || "*";
          const results = Object.keys(VFS).filter((f) => pattern === "*" || f.includes(pattern));
          if (results.length) { results.forEach((f) => term.writeln(`./${f}`)); }
          else { term.writeln("\x1b[90m(no results)\x1b[0m"); }
          return results.join("\n");
        }

        case "grep": {
          const pattern = args[0];
          const file = args[1];
          if (!pattern) { if (pipedInput) { const lines = pipedInput.split("\n").filter((l) => l.includes(pattern)); lines.forEach((l) => term.writeln(`\x1b[33m${l}\x1b[0m`)); return lines.join("\n"); } return ""; }
          if (file && VFS[file]) {
            const lines = VFS[file].split("\n").filter((l) => l.includes(pattern));
            lines.forEach((l) => term.writeln(l.replace(pattern, `\x1b[33m${pattern}\x1b[0m`)));
            return lines.join("\n");
          }
          if (pipedInput) {
            const lines = pipedInput.split("\n").filter((l) => l.includes(pattern));
            lines.forEach((l) => term.writeln(l.replace(pattern, `\x1b[33m${pattern}\x1b[0m`)));
            return lines.join("\n");
          }
          return "";
        }

        case "head": {
          const file = args[0];
          if (file && VFS[file]) { VFS[file].split("\n").slice(0, 10).forEach((l) => term.writeln(l)); return VFS[file].split("\n").slice(0, 10).join("\n"); }
          if (pipedInput) { pipedInput.split("\n").slice(0, 10).forEach((l) => term.writeln(l)); return pipedInput.split("\n").slice(0, 10).join("\n"); }
          return "";
        }

        case "tail": {
          const file = args[0];
          if (file && VFS[file]) { VFS[file].split("\n").slice(-10).forEach((l) => term.writeln(l)); return VFS[file].split("\n").slice(-10).join("\n"); }
          if (pipedInput) { pipedInput.split("\n").slice(-10).forEach((l) => term.writeln(l)); return pipedInput.split("\n").slice(-10).join("\n"); }
          return "";
        }

        case "wc": {
          const file = args[0];
          const content = file && VFS[file] ? VFS[file] : pipedInput;
          if (content) {
            const lines = content.split("\n").length;
            const words = content.split(/\s+/).length;
            const chars = content.length;
            term.writeln(`  ${lines}  ${words}  ${chars} ${file || ""}`);
            return `${lines} ${words} ${chars}`;
          }
          return "";
        }

        case "sort": {
          const file = args[0];
          const content = file && VFS[file] ? VFS[file] : pipedInput;
          if (content) { const sorted = content.split("\n").sort(); sorted.forEach((l) => term.writeln(l)); return sorted.join("\n"); }
          return "";
        }

        case "tree": {
          term.writeln("\x1b[34m.\x1b[0m");
          PATHS.forEach((p) => term.writeln(`├── \x1b[34m${p.replace("/", "")}/\x1b[0m`));
          Object.keys(VFS).forEach((f, i) => {
            const isLast = i === Object.keys(VFS).length - 1;
            term.writeln(`${isLast ? "└──" : "├──"} ${f}`);
          });
          return "";
        }

        case "date": { const d = new Date().toString(); term.writeln(d); return d; }
        case "whoami": { term.writeln("spyro-user"); return "spyro-user"; }

        case "env": { Object.entries(varsRef.current).forEach(([k, v]) => term.writeln(`${k}=${v}`)); return ""; }

        case "set": {
          if (args.length < 2) { term.writeln("\x1b[33mUsage: set <key> <value>\x1b[0m"); return ""; }
          varsRef.current[args[0]] = args.slice(1).join(" ");
          return "";
        }

        case "unset": { if (args[0]) delete varsRef.current[args[0]]; return ""; }
        case "export": {
          const [k, v] = args.join(" ").split("=");
          if (k && v !== undefined) varsRef.current[k] = v;
          return "";
        }

        case "history": { historyRef.current.forEach((h, i) => term.writeln(`  ${String(i + 1).padStart(3)}  ${h}`)); return ""; }

        case "spyro": {
          term.writeln("\x1b[1;35mSPYRO V1\x1b[0m — AI Operating System");
          term.writeln("  Version:    2.0.0");
          term.writeln("  Model:      SPYRO V1 Engine");
          term.writeln("  Studio:     \x1b[32mActive\x1b[0m");
          term.writeln("  Shell:      spyro-sh 2.0");
          term.writeln("  Files:      " + Object.keys(VFS).length + " in VFS");
          term.writeln("  Variables:  " + Object.keys(varsRef.current).length + " set");
          term.writeln("  History:    " + historyRef.current.length + " commands");
          term.writeln("  Status:     \x1b[32mAll systems operational\x1b[0m");
          return "";
        }

        case "ps": {
          term.writeln("  PID  USER        CPU%  MEM%  COMMAND");
          term.writeln("    1  spyro       0.1   2.4  /sbin/spyro-init");
          term.writeln("   42  spyro       1.2   8.1  node studio-server");
          term.writeln("   58  spyro       0.3   4.2  ai-engine --model=spyro-v1");
          term.writeln("  104  spyro       0.0   1.1  terminal");
          return "";
        }

        case "top": {
          term.writeln("\x1b[1mSPYRO Studio — System Monitor\x1b[0m");
          term.writeln("Tasks: 4 total, 1 running, 3 sleeping");
          term.writeln("%Cpu  : 12.4 us,  3.2 sy, 84.4 id");
          term.writeln("MiB Mem: 8192 total, 4096 free, 2048 used, 2048 buff");
          term.writeln("");
          term.writeln("  PID  USER    %CPU  %MEM  COMMAND");
          term.writeln("   42  spyro    1.2   8.1  node studio-server");
          term.writeln("   58  spyro    0.3   4.2  ai-engine");
          term.writeln("    1  spyro    0.1   2.4  spyro-init");
          return "";
        }

        case "git": {
          const sub = args[0] || "";
          if (sub === "clone") {
            const url = args[1];
            if (!url) { term.writeln("\x1b[33mUsage: git clone <url>\x1b[0m"); return ""; }
            const repoName = url.split("/").pop()?.replace(".git", "") || "repo";
            term.writeln(`\x1b[90mCloning '${url}' into '${repoName}' on VPS...\x1b[0m`);
            // REAL git clone on the VPS
            const result = await gitClone(url);
            if (result.output) result.output.split("\n").forEach((l: string) => term.writeln(`\x1b[90m${l}\x1b[0m`));
            if (result.success) {
              term.writeln(`\x1b[32m✓ Cloned ${repoName} successfully\x1b[0m`);
              // List the cloned files
              const lsResult = await executeCommand(`ls -la ${repoName}/`);
              if (lsResult.output) {
                term.writeln("");
                term.writeln("\x1b[36mCloned files:\x1b[0m");
                lsResult.output.split("\n").forEach((l: string) => term.writeln(l));
              }
            } else {
              term.writeln(`\x1b[31m✗ Clone failed: ${result.output}\x1b[0m`);
            }
            return "";
          } else if (sub === "status") {
            term.writeln("\x1b[32mOn branch main\x1b[0m");
            term.writeln("Your branch is up to date with 'origin/main'.");
            term.writeln("");
            const files = Object.keys(VFS);
            if (files.length) { term.writeln("Changes not staged for commit:"); files.forEach((f) => term.writeln(`  \x1b[31mmodified:   ${f}\x1b[0m`)); }
            else { term.writeln("nothing to commit, working tree clean"); }
          } else if (sub === "log") {
            term.writeln("\x1b[33mcommit a1b2c3d4\x1b[0m (HEAD -> main, origin/main)");
            term.writeln("Author: SPYRO User <user@spyro.ai>");
            term.writeln("Date:   " + new Date().toString());
            term.writeln(""); term.writeln("    Initial SPYRO Studio commit");
          } else if (sub === "init") { term.writeln("Initialized empty Git repository in /home/spyro/.git/"); }
          else if (sub === "add") { term.writeln(`Added: ${args.slice(1).join(" ") || "all files"}`); }
          else if (sub === "commit") { term.writeln(`\x1b[32m[main ${Math.random().toString(36).slice(2, 8)}] Committed: ${args.slice(1).join(" ") || "update"}\x1b[0m`); }
          else if (sub === "push") { term.writeln("Pushing to origin/main... \x1b[32mDone!\x1b[0m"); }
          else if (sub === "pull") { term.writeln("Pulling from origin/main... \x1b[32mUp to date.\x1b[0m"); }
          else if (sub === "branch") { term.writeln("* \x1b[32mmain\x1b[0m"); }
          else if (sub === "remote") { term.writeln("origin  https://github.com/spyro-user/project.git (fetch)\norigin  https://github.com/spyro-user/project.git (push)"); }
          else if (sub === "diff") { term.writeln("\x1b[90m(no changes to display)\x1b[0m"); }
          else if (sub === "checkout") { term.writeln(`Switched to branch '${args[1] || "main"}'`); }
          else if (sub === "merge") { term.writeln(`\x1b[32mMerge made by the 'ort' strategy.\x1b[0m`); }
          else if (sub === "stash") { term.writeln("Saved working directory and index state"); }
          else if (sub === "fetch") { term.writeln("From origin/main\n * branch            main       -> FETCH_HEAD"); }
          else { term.writeln(`\x1b[33mgit: '${sub}' — try: clone, status, log, init, add, commit, push, pull, branch, remote, diff, checkout, merge, stash, fetch\x1b[0m`); }
          return "";
        }

        case "npm": {
          const sub = args[0] || "";
          if (sub === "init") { term.writeln("This utility creates a package.json file.\nPress ^C at any time to quit.\nAbout to write to package.json:\n" + JSON.stringify({ name: "spyro-project", version: "1.0.0", main: "index.js" }, null, 2)); VFS["package.json"] = JSON.stringify({ name: "spyro-project", version: "1.0.0" }, null, 2); }
          else if (sub === "install" || sub === "i") { term.writeln(`\x1b[32madded ${args[1] || "1"} package in 0.3s\x1b[0m`); }
          else if (sub === "run") { term.writeln(`\x1b[33m> ${args[1] || "start"}\x1b[0m`); term.writeln("> spyro-project@1.0.0 start"); term.writeln("> node index.js"); }
          else if (sub === "list" || sub === "ls") { term.writeln("spyro-project@1.0.0\n├── @spyro/ai@2.0.0\n├── @spyro/studio@2.0.0\n└── @spyro/terminal@2.0.0"); }
          else { term.writeln(`\x1b[33mnpm: '${sub}' — try: init, install, run, list\x1b[0m`); }
          return "";
        }

        case "node": {
          const file = args[0];
          if (file && VFS[file]) {
            term.writeln(`\x1b[90mRunning ${file}...\x1b[0m`);
            try {
              const logs: string[] = [];
              const fn = new Function("console", "require", VFS[file]);
              fn({ log: (...a: any[]) => logs.push(a.map(x => typeof x === "object" ? JSON.stringify(x, null, 2) : String(x)).join(" ")), error: (...a: any[]) => logs.push("\x1b[31m" + a.join(" ") + "\x1b[0m"), warn: (...a: any[]) => logs.push("\x1b[33m" + a.join(" ") + "\x1b[0m") }, (m: string) => ({ default: {} }));
              logs.forEach((l) => term.writeln(l));
              return logs.join("\n");
            } catch (e) { term.writeln(`\x1b[31m${e instanceof Error ? e.message : "Error"}\x1b[0m`); return ""; }
          }
          if (!file) { term.writeln(`\x1b[1;32mWelcome to Node.js v20.0.0.\x1b[0m\nType ".help" for more information.`); }
          return "";
        }

        case "python": case "python3": {
          const file = args[0];
          if (file && VFS[file]) {
            term.writeln(`\x1b[90mRunning ${file} (simulated)...\x1b[0m`);
            term.writeln("\x1b[33mNote: Python execution is simulated. Use 'ai' to ask AI to interpret Python code.\x1b[0m");
            return "";
          }
          term.writeln(`\x1b[1;32mPython 3.11.0 (simulated)\x1b[0m\nType "help" for more information.`);
          return "";
        }

        case "curl": {
          const url = args.find((a) => a.startsWith("http"));
          if (!url) { term.writeln("\x1b[33mUsage: curl <url>\x1b[0m"); return ""; }
          term.writeln(`\x1b[90mFetching ${url}...\x1b[0m`);
          try {
            const res = await fetch(url);
            const text = await res.text();
            term.writeln(`\x1b[32mHTTP ${res.status} ${res.statusText}\x1b[0m`);
            term.writeln(`Content-Type: ${res.headers.get("content-type") || "unknown"}`);
            term.writeln(`Content-Length: ${text.length}`);
            term.writeln("");
            text.split("\n").slice(0, 30).forEach((l) => term.writeln(l));
            if (text.split("\n").length > 30) term.writeln(`\x1b[90m... (${text.split("\n").length - 30} more lines)\x1b[0m`);
            return text;
          } catch (e) { term.writeln(`\x1b[31mcurl: ${e instanceof Error ? e.message : "Failed"}\x1b[0m`); return ""; }
        }

        case "run": {
          const file = args[0];
          if (file && VFS[file]) {
            if (file.endsWith(".js") || file.endsWith(".ts")) {
              term.writeln(`\x1b[90mExecuting ${file}...\x1b[0m`);
              try {
                const logs: string[] = [];
                const fn = new Function("console", VFS[file]);
                fn({ log: (...a: any[]) => logs.push(a.map(x => typeof x === "object" ? JSON.stringify(x, null, 2) : String(x)).join(" ")), error: (...a: any[]) => logs.push("\x1b[31m" + a.join(" ") + "\x1b[0m"), warn: (...a: any[]) => logs.push("\x1b[33m" + a.join(" ") + "\x1b[0m") });
                if (logs.length === 0) term.writeln("\x1b[90m(no output)\x1b[0m");
                logs.forEach((l) => term.writeln(l));
                return logs.join("\n");
              } catch (e) { term.writeln(`\x1b[31mError: ${e instanceof Error ? e.message : "Failed"}\x1b[0m`); }
            } else { term.writeln(`\x1b[33mCannot run ${file}. Only .js and .ts files can be executed.\x1b[0m`); }
          } else { term.writeln(`\x1b[31mrun: ${file || "no file"}: No such file\x1b[0m`); }
          return "";
        }

        case "edit": {
          const file = args[0];
          if (file && VFS[file]) { term.writeln(`\x1b[32mOpening ${file} in code editor...\x1b[0m`); }
          else if (file) { VFS[file] = "// New file\n"; term.writeln(`\x1b[32mCreated ${file}\x1b[0m`); }
          else { term.writeln("\x1b[33mUsage: edit <filename>\x1b[0m"); }
          return "";
        }

        case "save": {
          const file = args[0];
          if (file && VFS[file]) {
            try {
              const blob = new Blob([VFS[file]], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = file; a.click(); URL.revokeObjectURL(url);
              term.writeln(`\x1b[32mSaved ${file} to disk.\x1b[0m`);
            } catch { term.writeln(`\x1b[31mSave failed.\x1b[0m`); }
          } else { term.writeln("\x1b[33mUsage: save <filename>\x1b[0m"); }
          return "";
        }

        case "load": {
          try {
            const input = document.createElement("input");
            input.type = "file"; input.accept = "*/*";
            input.onchange = (e: any) => {
              const file = e.target.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                VFS[file.name] = reader.result as string;
                term.writeln(`\x1b[32mLoaded ${file.name} (${file.size} bytes)\x1b[0m`);
                printPrompt(term);
              };
              reader.readAsText(file);
            };
            input.click();
            term.writeln("\x1b[90mOpening file picker...\x1b[0m");
          } catch { term.writeln("\x1b[31mLoad failed.\x1b[0m`"); }
          return "";
        }

        case "analyze": {
          const file = args[0];
          if (file && VFS[file]) {
            term.writeln(`\x1b[90mAI analyzing ${file}...\x1b[0m`);
            try {
              const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: `Analyze this code/file and provide insights:\n\nFile: ${file}\nContent:\n\`\`\`\n${VFS[file]}\n\`\`\`\n\nProvide: 1) Summary 2) Issues/bugs 3) Suggestions 4) Security concerns` }] }) });
              const text = await res.text();
              try { const d = JSON.parse(text); const reply = d.choices?.[0]?.message?.content || d.reply || text; reply.split("\n").forEach((l: string) => term.writeln(l)); }
              catch { text.split("\n").forEach((l: string) => term.writeln(l)); }
            } catch (e) { term.writeln(`\x1b[31mAI error: ${e instanceof Error ? e.message : "Failed"}\x1b[0m`); }
          } else { term.writeln("\x1b[33mUsage: analyze <filename>\x1b[0m"); }
          return "";
        }

        case "ai": {
          if (!args.length) { term.writeln("\x1b[33mUsage: ai <your question>\x1b[0m"); term.writeln("\x1b[90mExample: ai how do I optimize this function?\x1b[0m"); return ""; }
          const question = args.join(" ");
          term.writeln(`\x1b[90m🤖 SPYRO AI: "${question}"\x1b[0m`);
          term.writeln("");
          try {
            const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: question }] }) });
            const text = await res.text();
            try { const d = JSON.parse(text); const reply = d.choices?.[0]?.message?.content || d.reply || text; reply.split("\n").forEach((l: string) => term.writeln(l)); return reply; }
            catch { text.split("\n").forEach((l: string) => term.writeln(l)); return text; }
          } catch (e) { term.writeln(`\x1b[31mAI error: ${e instanceof Error ? e.message : "Failed"}\x1b[0m`); return ""; }
        }

        case "which": { term.writeln(args[0] ? `/usr/bin/${args[0]}` : ""); return ""; }
        case "man": { term.writeln(`\x1b[1m${args[0] || "command"}(1)\x1b[0m\n\nNAME\n    ${args[0] || "command"} - SPYRO Studio command\n\nSYNOPSIS\n    ${args[0] || "command"} [options]\n\nDESCRIPTION\n    See 'help' for available commands.`); return ""; }
        case "sleep": { await new Promise((r) => setTimeout(r, parseInt(args[0]) || 1000)); return ""; }
        case "watch": { term.writeln(`\x1b[90mEvery 1s: ${args.join(" ")}\x1b[0m`); return ""; }
        case "alias": { if (args.length) { term.writeln(`alias ${args.join(" ")}`); } return ""; }
        case "unalias": return "";
        case "source": return "";
        case "ssh": { term.writeln(`\x1b[33mSSH is not available in the browser terminal.\x1b[0m`); return ""; }
        case "wget": { term.writeln(`\x1b[33mUse 'curl <url>' instead.\x1b[0m`); return ""; }
        case "docker": { term.writeln(`\x1b[33mDocker is not available in browser. Use 'ai docker <question>' for help.\x1b[0m`); return ""; }
        case "pip": { term.writeln(`\x1b[33mPip is not available. Use 'ai python <question>' for Python help.\x1b[0m`); return ""; }
        case "apt": { term.writeln(`\x1b[33mApt is not available in browser.\x1b[0m`); return ""; }
        case "kill": { term.writeln(`\x1b[31mkill: (${args[0] || "0"}) - No such process\x1b[0m`); return ""; }
        case "jobs": { term.writeln("\x1b[90m(no jobs)\x1b[0m"); return ""; }
        case "bg": case "fg": return "";

        default:
          if (cmd.includes("=")) { const [k, v] = cmd.split("="); varsRef.current[k] = v; return ""; }

          // ── REAL EXECUTION: send to the VPS backend ──────────────
          // Try the real exec backend first for ANY command not handled above
          term.writeln(`\x1b[90mExecuting on VPS...\x1b[0m`);
          try {
            const result = await executeCommand(input);
            if (result.output) {
              result.output.split("\n").forEach((l: string) => term.writeln(l));
            }
            if (result.error && result.exitCode !== 0 && !result.output) {
              term.writeln(`\x1b[31m${result.output || "Command failed"}\x1b[0m`);
            }
            return result.output;
          } catch (e) {
            // If the VPS backend is down, fall back to AI
            term.writeln(`\x1b[90mVPS backend unavailable, trying AI...\x1b[0m`);
            try {
              const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  messages: [{
                    role: "user",
                    content: `You are a terminal assistant inside SPYRO Studio. The user typed: "${input}"\n\nIf this is a real shell command, simulate its output (be realistic — show what the output would look like). If it's a question or request, answer it concisely. Keep responses short — this is a terminal, not a chat window. Use plain text only (no markdown).`,
                  }],
                }),
              });
              const text = await res.text();
              let reply: string;
              try {
                const data = JSON.parse(text);
                reply = data.choices?.[0]?.message?.content || data.reply || text;
              } catch { reply = text; }
              reply.split("\n").forEach((l: string) => term.writeln(l));
              return reply;
            } catch {
              term.writeln(`\x1b[31m${cmd}: command not found. Type 'help'.\x1b[0m`);
              return "";
            }
          }
      }
    };

    // Helper to substitute variables
    const substArgs = (args: string[]) => args.map((a) => {
      if (a.startsWith("$")) return varsRef.current[a.slice(1)] ?? "";
      return a;
    });

    // Prompt
    function printPrompt(term: XTerm) {
      term.write(`\x1b[35mspyro@studio\x1b[0m:\x1b[34m${cwdRef.current}\x1b[0m$ `);
    }

    // Input handler
    term.onData(async (data: string) => {
      const code = data.charCodeAt(0);
      if (code === 13) {
        const input = inputBufferRef.current.trim();
        term.writeln("");
        if (input) {
          historyRef.current.push(input);
          historyIdxRef.current = historyRef.current.length;
          await handleCommand(input, term);
        }
        inputBufferRef.current = "";
        printPrompt(term);
      } else if (code === 127) {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (data === "\x1b[A") {
        if (historyIdxRef.current > 0) {
          historyIdxRef.current--;
          const cmd = historyRef.current[historyIdxRef.current];
          while (inputBufferRef.current.length > 0) { term.write("\b \b"); inputBufferRef.current = inputBufferRef.current.slice(0, -1); }
          inputBufferRef.current = cmd;
          term.write(cmd);
        }
      } else if (data === "\x1b[B") {
        if (historyIdxRef.current < historyRef.current.length - 1) {
          historyIdxRef.current++;
          const cmd = historyRef.current[historyIdxRef.current];
          while (inputBufferRef.current.length > 0) { term.write("\b \b"); inputBufferRef.current = inputBufferRef.current.slice(0, -1); }
          inputBufferRef.current = cmd;
          term.write(cmd);
        } else {
          while (inputBufferRef.current.length > 0) { term.write("\b \b"); inputBufferRef.current = inputBufferRef.current.slice(0, -1); }
          historyIdxRef.current = historyRef.current.length;
        }
      } else if (data === "\t") {
        // Tab completion
        const parts = inputBufferRef.current.split(" ");
        const last = parts[parts.length - 1].toLowerCase();
        const matches = COMMANDS.filter((c) => c.startsWith(last));
        if (matches.length === 1) {
          const completion = matches[0] + " ";
          const toAdd = completion.slice(last.length);
          inputBufferRef.current += toAdd;
          term.write(toAdd);
        } else if (matches.length > 1) {
          term.writeln("");
          term.writeln(matches.join("  "));
          printPrompt(term);
          term.write(inputBufferRef.current);
        }
      } else if (code === 3) {
        // Ctrl+C
        term.writeln("^C");
        inputBufferRef.current = "";
        printPrompt(term);
      } else if (code >= 32) {
        inputBufferRef.current += data;
        term.write(data);
      }
    });

    const ro = new ResizeObserver(() => { try { fit.fit(); } catch {} });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); term.dispose(); };
  }, []);

  return <div ref={containerRef} className="h-full w-full bg-[#0a0a0b]" />;
}
