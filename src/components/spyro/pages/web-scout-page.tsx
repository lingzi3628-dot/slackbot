"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Globe,
  Loader2,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  name: string;
  url: string;
  snippet: string;
  host_name: string;
  date?: string;
}

export function WebScout({ onBack }: { onBack: () => void }) {
  const [phase, setPhase] = React.useState<"activating" | "ready">("activating");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [summary, setSummary] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setPhase("ready"), 2500);
    return () => clearTimeout(timer);
  }, []);

  const search = async () => {
    const q = query.trim();
    if (!q || loading) return;

    setLoading(true);
    setResults([]);
    setSummary("");
    setError(null);

    try {
      const res = await fetch("/api/web-scout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();

      if (data.results) {
        setResults(data.results);
        if (data.summary) setSummary(data.summary);
      } else {
        setError(data.error || "Search failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  if (phase === "activating") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-6">
          <div className="ember-aura relative grid h-20 w-20 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Globe className="h-10 w-10 text-white" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
          <h2 className="text-xl font-bold">Web Scout</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
              Connecting to live web…
            </motion.span>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-1 text-xs text-muted-foreground/60">
            Initializing SPYRO V1 search engine
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="grid h-9 w-9 place-items-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl spyro-bg-gradient">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Web Scout</h2>
            <p className="text-[11px] text-muted-foreground">SPYRO V1 · Live Web Search + AI Summary</p>
          </div>
        </div>
      </div>

      {/* Search input */}
      <div className="surface-elevated mb-4 rounded-2xl p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search the web…"
              disabled={loading}
              className="w-full rounded-xl border border-border/50 bg-muted/20 py-2.5 pl-10 pr-3 text-sm focus:border-primary/40 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            onClick={search}
            disabled={!query.trim() || loading}
            className="flex items-center gap-1.5 rounded-xl spyro-bg-gradient px-5 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Search
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="surface-elevated mb-4 rounded-2xl p-4">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI Summary</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</p>
        </motion.div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sources ({results.length})
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <motion.a
                key={i}
                href={r.url}
                target="_blank"
                rel="noreferrer noopener"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="surface-elevated block rounded-xl p-4 transition-all hover:spyro-glow"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  <span className="text-sm font-medium text-primary hover:underline">{r.name}</span>
                  <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{r.snippet}</p>
                <span className="mt-1 text-[10px] text-muted-foreground/60">{r.host_name}{r.date ? ` · ${r.date}` : ""}</span>
              </motion.a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
