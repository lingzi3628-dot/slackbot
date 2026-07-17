"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Play, Loader2, Copy, Check, Code2, Terminal, Zap, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Endpoint {
  method: "GET" | "POST";
  path: string;
  name: string;
  description: string;
  body?: string;
  response?: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    method: "POST",
    path: "/api/chat",
    name: "Chat",
    description: "Stream a SPYRO V1 chat response",
    body: JSON.stringify({
      messages: [{ role: "user", content: "Hello SPYRO! What can you do?" }],
      model: "openai",
      temperature: 0.7,
    }, null, 2),
  },
  {
    method: "POST",
    path: "/api/image-gen",
    name: "Image Generation",
    description: "Generate an image from text",
    body: JSON.stringify({ prompt: "A dragon breathing fire", size: "1024x1024" }, null, 2),
  },
  {
    method: "POST",
    path: "/api/web-scout",
    name: "Web Search",
    description: "Search the web + AI summary",
    body: JSON.stringify({ query: "latest AI news" }, null, 2),
  },
  {
    method: "POST",
    path: "/api/tts",
    name: "Text to Speech",
    description: "Convert text to audio",
    body: JSON.stringify({ text: "Hello from SPYRO V1", voice: "tongtong", speed: 1.0 }, null, 2),
  },
  {
    method: "GET",
    path: "/api/docs",
    name: "API Docs",
    description: "Full API documentation",
  },
  {
    method: "GET",
    path: "/api/health",
    name: "Health Check",
    description: "Database + env status",
  },
];

export function ApiPlayground() {
  const [selected, setSelected] = React.useState<Endpoint>(ENDPOINTS[0]);
  const [body, setBody] = React.useState(ENDPOINTS[0].body || "");
  const [response, setResponse] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<number | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [apiKey, setApiKey] = React.useState("");

  const run = async () => {
    setLoading(true);
    setResponse("");
    setStatus(null);

    try {
      const headers: Record<string, string> = { "content-type": "application/json" };
      if (apiKey.trim()) headers["x-api-key"] = apiKey.trim();

      const res = await fetch(selected.path, {
        method: selected.method,
        headers,
        body: selected.method === "POST" ? body : undefined,
      });

      setStatus(res.status);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("audio")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setResponse(`🎵 Audio received (${(blob.size / 1024).toFixed(1)} KB)\nPlay: ${url}`);
      } else if (contentType.includes("text/plain")) {
        const text = await res.text();
        setResponse(text);
      } else {
        const data = await res.json();
        if (data.image) {
          setResponse(JSON.stringify({ ...data, image: data.image.slice(0, 50) + "..." }, null, 2));
        } else {
          setResponse(JSON.stringify(data, null, 2));
        }
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setLoading(false);
    }
  };

  const selectEndpoint = (ep: Endpoint) => {
    setSelected(ep);
    setBody(ep.body || "");
    setResponse("");
    setStatus(null);
  };

  const copyResponse = async () => {
    await navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const curlCommand = `curl -X ${selected.method} ${typeof window !== "undefined" ? window.location.origin : ""}${selected.path}${selected.method === "POST" ? ` \\\n  -H "content-type: application/json"${apiKey ? ` \\\n  -H "x-api-key: ${apiKey}"` : ""} \\\n  -d '${body.replace(/\n\s*/g, " ")}'` : ""}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Terminal className="h-6 w-6 text-primary" />
          API Playground
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Test SPYRO V1 API endpoints interactively. No API key needed for basic usage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        {/* Endpoint list */}
        <div className="space-y-1">
          {ENDPOINTS.map((ep) => (
            <button
              key={ep.path + ep.method}
              onClick={() => selectEndpoint(ep)}
              className={cn(
                "flex w-full flex-col items-start rounded-lg px-3 py-2 text-left transition-colors",
                selected.path === ep.path
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn(
                  "rounded px-1.5 py-0.5 text-[9px] font-bold",
                  ep.method === "GET" ? "bg-green-500/15 text-green-500" : "bg-blue-500/15 text-blue-500"
                )}>
                  {ep.method}
                </span>
                <span className="text-xs font-medium">{ep.name}</span>
              </div>
              <span className="mt-0.5 truncate text-[10px] text-muted-foreground">{ep.path}</span>
            </button>
          ))}
        </div>

        {/* Request + Response */}
        <div className="space-y-4">
          {/* API key */}
          <div className="flex items-center gap-2">
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API key (optional — for higher rate limits)"
              className="flex-1 rounded-lg border border-border/50 bg-muted/20 px-3 py-1.5 text-xs font-mono focus:border-primary/40 focus:outline-none"
            />
          </div>

          {/* Request body */}
          {selected.method === "POST" && (
            <div className="surface-elevated rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Request Body</span>
                <span className="text-[10px] text-muted-foreground">JSON</span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="w-full resize-none rounded-lg border border-border/40 bg-black/30 p-3 font-mono text-[12px] text-foreground/90 focus:border-primary/40 focus:outline-none"
                spellCheck={false}
              />
            </div>
          )}

          {/* Run button */}
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl spyro-bg-gradient px-6 py-2.5 text-sm font-semibold text-white transition-all hover:spyro-glow disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {loading ? "Running..." : `Run ${selected.method} ${selected.path}`}
          </button>

          {/* Status badge */}
          {status !== null && (
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
              status < 300 ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"
            )}>
              {status} {status < 300 ? "OK" : "Error"}
            </span>
          )}

          {/* Response */}
          {response && (
            <div className="surface-elevated rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Response</span>
                <button
                  onClick={copyResponse}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
              <pre className="max-h-96 overflow-auto rounded-lg bg-black/30 p-3 font-mono text-[12px] leading-relaxed text-foreground/90">
                {response}
              </pre>
            </div>
          )}

          {/* cURL command */}
          <div className="surface-elevated rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">cURL</span>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-black/30 p-3 font-mono text-[11px] text-foreground/80">
              {curlCommand}
            </pre>
          </div>

          {/* Rate limit info */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> 20/min anonymous</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> 100/min with API key</span>
            <span className="flex items-center gap-1"><Globe className="h-3 w-3 text-primary" /> CORS enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
