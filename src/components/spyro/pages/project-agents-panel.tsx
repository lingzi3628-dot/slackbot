"use client";
import * as React from "react";
import { Bot, Plus, Trash2 } from "lucide-react";

type Agent = { id: string; name: string; description: string | null; instructions: string; status: string };
export function ProjectAgentsPanel({ projectId }: { projectId: string }) {
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [name, setName] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const load = React.useCallback(async () => { const r = await fetch(`/api/projects/${projectId}/agents`, { cache: "no-store" }); if (r.ok) setAgents((await r.json()).agents ?? []); }, [projectId]);
  React.useEffect(() => { void load(); }, [load]);
  async function create(e: React.FormEvent) { e.preventDefault(); if (!name.trim()) return; const r = await fetch(`/api/projects/${projectId}/agents`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, instructions }) }); if (r.ok) { setAgents((a) => [((await r.json()).agent), ...a]); setName(""); setInstructions(""); setOpen(false); } }
  async function remove(id: string) { if (!window.confirm("Remove this agent?")) return; const r = await fetch(`/api/projects/${projectId}/agents?agentId=${id}`, { method: "DELETE" }); if (r.ok) setAgents((a) => a.filter((x) => x.id !== id)); }
  return <section className="mt-8 rounded-2xl border border-border bg-card/50 p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Project agents</h2><p className="text-sm text-muted-foreground">Specialists available in this project.</p></div><button onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"><Plus className="h-4 w-4" />Add agent</button></div>{open && <form onSubmit={create} className="mt-4 grid gap-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Agent name" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="What should this agent do?" rows={3} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><button className="w-fit rounded-lg bg-secondary px-3 py-2 text-sm">Create agent</button></form>}<div className="mt-4 grid gap-2 sm:grid-cols-2">{agents.map((agent) => <div key={agent.id} className="flex items-center justify-between rounded-xl border border-border p-3"><div className="flex items-center gap-3"><Bot className="h-5 w-5 text-primary" /><div><p className="text-sm font-medium">{agent.name}</p><p className="text-xs text-muted-foreground">{agent.status}</p></div></div><button onClick={() => void remove(agent.id)} aria-label={`Remove ${agent.name}`} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>)}</div></section>;
}
