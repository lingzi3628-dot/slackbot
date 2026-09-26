"use client";

import * as React from "react";
import { BookOpen, Loader2, Plus, Trash2 } from "lucide-react";
import { useUIStore } from "@/store/ui-store";

type Project = { id: string; name: string };
type Document = { id: string; title: string; type: string; indexed: boolean; sizeBytes: number; createdAt: string };

export function KnowledgePage() {
  const setView = useUIStore((s) => s.setView);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [projectId, setProjectId] = React.useState("");
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetch("/api/projects", { cache: "no-store" }).then((r) => r.json()).then((data) => {
      const next = data.projects ?? [];
      setProjects(next);
      const saved = window.localStorage.getItem("spyro-active-project");
      setProjectId(next.some((project: Project) => project.id === saved) ? saved! : next[0]?.id ?? "");
    }).catch(() => setError("Could not load projects")).finally(() => setLoading(false));
  }, []);

  const loadDocuments = React.useCallback(async () => {
    if (!projectId) return setDocuments([]);
    const response = await fetch(`/api/projects/${projectId}/knowledge`, { cache: "no-store" });
    if (response.ok) setDocuments((await response.json()).documents ?? []);
  }, [projectId]);
  React.useEffect(() => {
    // Project selection drives a network-backed refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDocuments();
  }, [loadDocuments]);

  async function removeKnowledge(documentId: string) {
    if (!projectId || !window.confirm("Remove this knowledge document?")) return;
    const response = await fetch(`/api/projects/${projectId}/knowledge?documentId=${encodeURIComponent(documentId)}`, { method: "DELETE" });
    if (response.ok) setDocuments((current) => current.filter((doc) => doc.id !== documentId));
  }

  async function addKnowledge(event: React.FormEvent) {
    event.preventDefault();
    if (!projectId || !title.trim() || !content.trim()) return;
    setSaving(true); setError(null);
    const response = await fetch(`/api/projects/${projectId}/knowledge`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, content }) });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Could not save knowledge");
    else { setDocuments((current) => [data.document, ...current]); setTitle(""); setContent(""); }
    setSaving(false);
  }

  return <main className="flex-1 overflow-y-auto p-5 sm:p-8"><div className="mx-auto max-w-5xl">
    <div className="mb-8 flex items-center justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-cyan-400">Project memory</p><h1 className="text-3xl font-bold">Knowledge</h1><p className="mt-2 text-sm text-muted-foreground">Give SPYRO reliable context for project conversations.</p></div><BookOpen className="h-10 w-10 text-cyan-400" /></div>
    {loading ? <div className="flex justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 animate-spin" />Loading…</div> : projects.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-12 text-center"><p className="text-muted-foreground">Create a project before adding knowledge.</p><button onClick={() => setView("projects")} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Go to projects</button></div> : <>
      <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="mb-5 rounded-xl border border-border bg-card px-3 py-2 text-sm"><option value="">Select project</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <form onSubmit={addKnowledge} className="mb-8 rounded-2xl border border-border bg-card/60 p-5"><h2 className="font-semibold">Add text knowledge</h2><div className="mt-4 grid gap-3"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" maxLength={160} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste notes, guidelines, or project context…" maxLength={100000} rows={5} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /></div><button disabled={saving || !title.trim() || !content.trim()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Plus className="h-4 w-4" />{saving ? "Indexing…" : "Add to project memory"}</button></form>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}<div className="space-y-3">{documents.map((doc) => <article key={doc.id} className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-4"><div><h3 className="font-medium">{doc.title}</h3><p className="text-xs text-muted-foreground">{doc.type} · {doc.indexed ? "Indexed" : "Pending"}</p></div><button onClick={() => void removeKnowledge(doc.id)} aria-label={`Delete ${doc.title}`} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></article>)}{documents.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No knowledge added to this project yet.</p>}</div>
    </>}
  </div></main>;
}
