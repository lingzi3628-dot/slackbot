"use client";

import * as React from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export function TerminalApp() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputBufferRef = React.useRef("");
  const historyRef = React.useRef<string[]>([]);
  const historyIdxRef = React.useRef(-1);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const term = new XTerm({
      theme: { background: "#0a0a0b", foreground: "#f5f5f7", cursor: "#8B5CF6", selectionBackground: "#8B5CF640" },
      fontFamily: "Geist Mono, monospace",
      fontSize: 13,
      cursorBlink: true,
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    term.writeln("\x1b[1;35m  SPYRO Studio Terminal v1.0.0\x1b[0m");
    term.writeln("\x1b[90m  Type 'help' for available commands\x1b[0m");
    term.writeln("");
    term.write("\x1b[35mspyro@studio\x1b[0m:\x1b[34m~\x1b[0m$ ");

    const handleCommand = async (input: string) => {
      const [cmd, ...args] = input.split(" ");
      switch (cmd.toLowerCase()) {
        case "help":
          term.writeln("\x1b[36mAvailable commands:\x1b[0m");
          term.writeln("  \x1b[33mhelp\x1b[0m     Show help     \x1b[33mclear\x1b[0m    Clear screen");
          term.writeln("  \x1b[33mecho\x1b[0m     Print text    \x1b[33mls\x1b[0m       List workspace");
          term.writeln("  \x1b[33mai\x1b[0m       Ask SPYRO AI  \x1b[33mspyro\x1b[0m    System info");
          term.writeln("  \x1b[33mdate\x1b[0m     Show date     \x1b[33mwhoami\x1b[0m  Current user");
          term.writeln("  \x1b[33mhistory\x1b[0m Command history");
          break;
        case "clear": term.clear(); break;
        case "echo": term.writeln(args.join(" ")); break;
        case "ls": term.writeln("\x1b[34mprojects/  chats/  knowledge/  files/  agents/  communication/\x1b[0m"); break;
        case "spyro":
          term.writeln("\x1b[1;35mSPYRO V1\x1b[0m — AI Operating System");
          term.writeln("  Version: 1.0.0  |  Model: SPYRO V1  |  Status: \x1b[32mOperational\x1b[0m");
          break;
        case "date": term.writeln(new Date().toString()); break;
        case "whoami": term.writeln("spyro-user@studio"); break;
        case "history": historyRef.current.forEach((h, i) => term.writeln(`  ${i + 1}  ${h}`)); break;
        case "ai":
          if (!args.length) { term.writeln("\x1b[33mUsage: ai <question>\x1b[0m"); break; }
          const q = args.join(" ");
          term.writeln(`\x1b[90mAsking SPYRO AI: "${q}"...\x1b[0m`);
          try {
            const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: q }] }) });
            const text = await res.text();
            try { const d = JSON.parse(text); (d.choices?.[0]?.message?.content || d.reply || text).split("\n").forEach((l: string) => term.writeln(l)); }
            catch { text.split("\n").forEach((l: string) => term.writeln(l)); }
          } catch (e) { term.writeln(`\x1b[31mError: ${e instanceof Error ? e.message : "Failed"}\x1b[0m`); }
          break;
        default: term.writeln(`\x1b[31mCommand not found: ${cmd}\x1b[0m. Type 'help'.`);
      }
    };

    term.onData(async (data: string) => {
      const code = data.charCodeAt(0);
      if (code === 13) {
        const input = inputBufferRef.current.trim();
        term.writeln("");
        if (input) {
          historyRef.current.push(input);
          historyIdxRef.current = historyRef.current.length;
          await handleCommand(input);
        }
        inputBufferRef.current = "";
        term.write("\x1b[35mspyro@studio\x1b[0m:\x1b[34m~\x1b[0m$ ");
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
        }
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
