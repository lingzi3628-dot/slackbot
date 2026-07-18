"use client";

import * as React from "react";
import { Bold, Italic, Underline, List, Sparkles, Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIWordApp() {
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [title, setTitle] = React.useState("Untitled Document");

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  const askAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const currentContent = editorRef.current?.innerHTML || "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are an AI writing assistant. The user is working on a document titled "${title}" with this content:\n\n${currentContent.replace(/<[^>]+>/g, " ")}\n\nRequest: ${aiPrompt}\n\nRespond with the full updated document text (plain text, no markdown).`,
          }],
        }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        const reply = data.choices?.[0]?.message?.content || data.reply || text;
        if (editorRef.current) {
          // Convert plain text to HTML (preserve line breaks)
          editorRef.current.innerHTML = reply.split("\n").map(l => l.trim() ? `<p>${l}</p>` : "<p><br></p>").join("");
        }
      } catch {
        if (editorRef.current) editorRef.current.innerText = text;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
      setAiPrompt("");
    }
  };

  const exportDoc = () => {
    const content = editorRef.current?.innerHTML || "";
    const fullHtml = `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${title}</h1>${content}</body></html>`;
    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-border bg-card/40 px-3 py-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-medium hover:border-border focus:border-primary/30 focus:outline-none"
        />
        <div className="mx-1 h-4 w-px bg-border" />
        <button onClick={() => exec("bold")} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary" title="Bold"><Bold className="h-3.5 w-3.5" /></button>
        <button onClick={() => exec("italic")} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary" title="Italic"><Italic className="h-3.5 w-3.5" /></button>
        <button onClick={() => exec("underline")} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary" title="Underline"><Underline className="h-3.5 w-3.5" /></button>
        <button onClick={() => exec("insertUnorderedList")} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-secondary" title="Bullet list"><List className="h-3.5 w-3.5" /></button>
        <div className="mx-1 h-4 w-px bg-border" />
        <button onClick={exportDoc} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium hover:bg-secondary">
          <Download className="h-3 w-3" /> Export
        </button>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400">
          <Sparkles className="h-2.5 w-2.5" /> AI enabled
        </span>
      </div>

      {/* Editor + AI panel */}
      <div className="flex min-h-0 flex-1">
        {/* Document */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-background p-8">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="mx-auto min-h-[60vh] max-w-2xl rounded-xl border border-border bg-card p-8 text-sm leading-relaxed shadow-soft outline-none focus:border-primary/30"
            style={{ fontFamily: "Georgia, serif" }}
          >
            <p>Start writing your document…</p>
          </div>
        </div>

        {/* AI panel */}
        <div className="w-72 shrink-0 border-l border-border bg-card/40 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" /> AI Writer
          </div>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask AI to rewrite, summarize, translate, expand, or generate content…"
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-background p-2 text-xs placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"
          />
          <button
            onClick={askAI}
            disabled={!aiPrompt.trim() || aiLoading}
            className="mt-2 w-full rounded-lg spyro-bg-gradient py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
          >
            {aiLoading ? "Writing…" : "Apply AI"}
          </button>
          <div className="mt-3 space-y-1">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</p>
            {["Summarize this document", "Make it more formal", "Add an introduction", "Translate to French"].map((q) => (
              <button
                key={q}
                onClick={() => { setAiPrompt(q); }}
                className="block w-full rounded-lg border border-border bg-card px-2 py-1.5 text-left text-[10px] text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
