"use client";

import * as React from "react";
import { FolderKanban, Plus, Loader2, ArrowRight } from "lucide-react";
import { useUIStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { ProjectAgentsPanel } from "./project-agents-panel";
import { ProjectWorkspace } from "./project-workspace";

type Project = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  updatedAt: string;
  _count: { conversations: number; agents: number; knowledge: number; files: number };
};

export function ProjectsPage() {
  const setView = useUIStore((state) => state.setView);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = React.useState<string | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProjects = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (response.status === 401) {
        setProjects([]);
        return;
      }
      if (!response.ok) throw new Error("Could not load projects");
      const data = await response.json();
      const nextProjects = data.projects ?? [];
      setProjects(nextProjects);
      setActiveProjectId((current) => current ?? nextProjects[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    // Network-backed initialization belongs in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects();
  }, [loadProjects]);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create project");
      setProjects((current) => [data.project, ...current]);
      setName("");
      setDescription("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-5 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-primary">Workspace</p>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Keep conversations, agents, knowledge, and files together around real work.
            </p>
          </div>
          <button onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>

        {showForm && (
          <form onSubmit={createProject} className="mb-8 rounded-2xl border border-border bg-card/70 p-5 shadow-sm">
            <h2 className="font-semibold">Create a project</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Project name" maxLength={80} autoFocus className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you working on?" maxLength={500} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-3 py-2 text-sm text-muted-foreground">Cancel</button>
              <button disabled={saving || !name.trim()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? "Creating…" : "Create project"}</button>
            </div>
          </form>
        )}

        {error && <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
            <FolderKanban className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 text-lg font-semibold">Start with one project</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Create a project to give SPYRO a focused place for your conversations and future knowledge.</p>
            <button onClick={() => setShowForm(true)} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Create your first project</button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => (
              <article key={project.id} onClick={() => setActiveProjectId(project.id)} className={cn("group cursor-pointer rounded-2xl border bg-card/60 p-5 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg", activeProjectId === project.id ? "border-primary ring-1 ring-primary/30" : "border-border")}>
                <div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl" style={{ backgroundColor: `${project.color}22`, color: project.color }}><FolderKanban className="h-5 w-5" /></span><span className="text-xs text-muted-foreground">{new Date(project.updatedAt).toLocaleDateString()}</span></div>
                <h2 className="mt-5 font-semibold">{project.name}</h2>
                <p className="mt-1 min-h-10 text-sm text-muted-foreground">{project.description || "No description yet"}</p>
                <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs text-muted-foreground"><span><b className="block text-foreground">{project._count.conversations}</b>Chats</span><span><b className="block text-foreground">{project._count.agents}</b>Agents</span><span><b className="block text-foreground">{project._count.knowledge}</b>Knowledge</span><span><b className="block text-foreground">{project._count.files}</b>Files</span></div>
                <button onClick={() => setView("chat")} className={cn("mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-80 transition group-hover:opacity-100")}>Open project <ArrowRight className="h-4 w-4" /></button>
              </article>
            ))}
          </div>
        )}
        {projects.length > 0 && (() => { const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0]; return <><ProjectWorkspace project={activeProject} /><ProjectAgentsPanel projectId={activeProject.id} /></>; })()}
      </div>
    </main>
  );
}
