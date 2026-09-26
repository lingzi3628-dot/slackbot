"use client";
import { useUIStore } from "@/store/ui-store";
import { MessageCircle, BookOpen, Bot, FolderOpen, Activity } from "lucide-react";

type Project = { id: string; name: string; description: string | null; color: string; _count: { conversations: number; agents: number; knowledge: number; files: number } };
export function ProjectWorkspace({ project }: { project: Project }) {
  const setView = useUIStore((s) => s.setView);
  const tabs = [
    ["chat", "Chat", MessageCircle], ["knowledge", "Knowledge", BookOpen], ["agents", "Agents", Bot], ["files", "Files", FolderOpen], ["activity", "Activity", Activity],
  ] as const;
  return <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card/60"><div className="border-b border-border p-5" style={{ borderTop: `3px solid ${project.color}` }}><p className="text-xs font-semibold uppercase tracking-widest text-primary">Active project</p><h2 className="mt-1 text-xl font-bold">{project.name}</h2><p className="mt-1 text-sm text-muted-foreground">{project.description || "Your focused workspace for conversations, knowledge, and agents."}</p><div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs text-muted-foreground"><span><b className="block text-base text-foreground">{project._count.conversations}</b>Chats</span><span><b className="block text-base text-foreground">{project._count.knowledge}</b>Sources</span><span><b className="block text-base text-foreground">{project._count.agents}</b>Agents</span><span><b className="block text-base text-foreground">{project._count.files}</b>Files</span></div></div><nav className="flex overflow-x-auto p-2">{tabs.map(([view, label, Icon]) => <button key={view} onClick={() => setView(view === "files" || view === "activity" ? "projects" : view as "chat" | "knowledge" | "agents")} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"><Icon className="h-4 w-4" />{label}</button>)}</nav></section>;
}
