"use client";

import * as React from "react";
import { Sparkles, Send, Loader2, FileText } from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

/**
 * AI Chat app — embedded in Studio.
 * Connects to the real SPYRO chat backend.
 */
export function AIChatApp({ appName }: { appName: string }) {
  const [messages, setMessages] = React.useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: `You are the AI assistant inside the ${appName} app in SPYRO Studio. Help the user with their work.` },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        }),
      });
      const responseText = await res.text();
      try {
        const data = JSON.parse(responseText);
        const reply = data.choices?.[0]?.message?.content || data.reply || responseText;
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch {
        setMessages((m) => [...m, { role: "assistant", content: responseText }]);
      }
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "Failed"}` }]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/40 px-3 py-2">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-semibold">{appName}</span>
        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] text-violet-400">AI Assistant</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl spyro-bg-gradient text-white shadow-soft">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-medium">{appName} is ready</p>
            <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
              Ask anything. The AI knows your current workspace context — projects, knowledge, and chats.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 text-xs",
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                )}>
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask ${appName}…`}
            rows={1}
            className="flex-1 resize-none bg-transparent text-xs placeholder:text-muted-foreground focus:outline-none"
          />
          <button onClick={send} disabled={!input.trim() || loading} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg spyro-bg-gradient text-white disabled:opacity-40">
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * REST Client app — test API endpoints.
 */
export function RestClientApp() {
  const [method, setMethod] = React.useState("GET");
  const [url, setUrl] = React.useState("https://api.spyro.ai/health");
  const [body, setBody] = React.useState("");
  const [response, setResponse] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const send = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "content-type": "application/json" } : undefined,
        body: body || undefined,
      });
      const text = await res.text();
      setResponse(`Status: ${res.status} ${res.statusText}\n\n${text.slice(0, 2000)}`);
    } catch (e) {
      setResponse(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/40 px-3 py-2">
        <span className="text-xs font-semibold">REST Client</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex gap-2">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs">
            {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => <option key={m}>{m}</option>)}
          </select>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://api.example.com" className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs focus:border-primary/30 focus:outline-none" />
          <button onClick={send} disabled={loading} className="rounded-lg spyro-bg-gradient px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40">{loading ? "…" : "Send"}</button>
        </div>
        {method !== "GET" && (
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"key": "value"}' rows={3} className="mt-2 rounded-lg border border-border bg-card p-2 font-mono text-xs focus:border-primary/30 focus:outline-none" />
        )}
        {response && (
          <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-background p-3">
            <pre className="text-[11px] whitespace-pre-wrap">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Research Browser app — search the web via SPYRO.
 */
export function ResearchBrowserApp() {
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Research: ${query}. Provide a comprehensive answer with sources.` }],
          webSearch: true,
        }),
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        setResult(data.choices?.[0]?.message?.content || data.reply || text);
      } catch {
        setResult(text);
      }
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : "Failed"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/40 px-3 py-2">
        <FileText className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold">Research Browser</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Research any topic…" className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs focus:border-primary/30 focus:outline-none" />
          <button onClick={search} disabled={loading} className="rounded-lg spyro-bg-gradient px-4 py-1.5 text-xs font-medium text-white disabled:opacity-40">{loading ? "…" : "Research"}</button>
        </div>
        {result && (
          <div className="mt-3 min-h-0 flex-1 overflow-auto rounded-lg border border-border bg-background p-4">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-xs leading-relaxed">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}
