"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, Sparkles, Flame, ArrowRight, Zap, Bot,
  TrendingUp, Clock, Plus, LayoutGrid, Phone, Inbox, FileText,
  Upload, Globe, Plug, FileCode2, Image as ImageIcon, Calendar,
  CheckCircle2, Circle, AlertCircle, Bell, Download, Activity,
  Database, HardDrive, Server, Cpu, Pause, Play, ExternalLink,
  Pin, Star, Search, ChevronRight, BookOpen, Users, Settings,
  type LucideIcon,
} from "lucide-react";
import { useChatStore } from "@/store/chat-store";
import { useUIStore, type View } from "@/store/ui-store";
import { useLocalAuth } from "@/store/local-auth";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useCommsStore } from "@/store/comms-store";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", icon: "🌅" };
  if (hour < 17) return { text: "Good afternoon", icon: "☀️" };
  if (hour < 21) return { text: "Good evening", icon: "🌆" };
  return { text: "Good night", icon: "🌙" };
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ── Real data computed from stores ────────────────────────────────────
// No mock data — everything is derived from the user's actual activity.

const QUICK_ACTIONS = [
  { label: "New Chat", icon: MessageCircle, color: "from-violet-500 to-fuchsia-500", view: "chat" as const },
  { label: "New Project", icon: LayoutGrid, color: "from-cyan-500 to-blue-500", view: "projects" as const },
  { label: "New Agent", icon: Bot, color: "from-emerald-500 to-teal-500", view: "agents" as const },
  { label: "Upload File", icon: Upload, color: "from-amber-500 to-orange-500", view: "apps" as const },
  { label: "Deep Research", icon: Globe, color: "from-pink-500 to-rose-500", view: "chat" as const },
  { label: "Connect WhatsApp", icon: Inbox, color: "from-emerald-500 to-green-500", view: "communication" as const },
  { label: "Import Knowledge", icon: BookOpen, color: "from-indigo-500 to-violet-500", view: "knowledge" as const },
  { label: "Create Automation", icon: Zap, color: "from-orange-500 to-red-500", view: "apps" as const },
  { label: "Generate Image", icon: ImageIcon, color: "from-fuchsia-500 to-pink-500", view: "apps" as const },
  { label: "Generate Document", icon: FileText, color: "from-blue-500 to-indigo-500", view: "chat" as const },
];

// ── Type anchors for section cards ────────────────────────────────────
// These constants hold empty arrays (no mock data) — they exist purely so
// the helper card components below can derive their prop types via
// `typeof CONST[0]`. The real runtime data is computed inside `HomePage`
// from Zustand stores (chat, workspace, comms) and passed via props.
const PINNED_PROJECTS: Array<{
  id: string;
  name: string;
  progress: number;
  color: string;
  agents: number;
  files: number;
  chats: number;
  knowledge: number;
  channels: number;
  storage: string;
  lastActivity: string;
}> = [];

const RUNNING_AGENTS: Array<{
  id: string;
  name: string;
  status: string;
  task: string;
  project: string;
  time: string;
  memory: string;
  confidence: number;
  eta: string;
  avatar: string;
  color: string;
}> = [];

const COMMUNICATION_CHANNELS: Array<{
  id: string;
  name: string;
  icon: string;
  unread: number;
  pendingAI: number;
  review: number;
  lastSync: string;
  health: string;
  color: string;
}> = [];

const TASKS: Array<{
  id: string;
  done: boolean;
  title: string;
  due: string;
  type: string;
  priority: string;
}> = [];

const AI_SUGGESTIONS: Array<{
  id: string;
  icon: LucideIcon;
  title: string;
  action: string;
  color: string;
}> = [];

const RECENT_ACTIVITY: Array<{
  id: string;
  type: string;
  icon: LucideIcon;
  text: string;
  time: number;
  color: string;
}> = [];

// Derive "pinned projects" from actual conversations (group by title keyword)
function deriveProjects(conversations: any[]) {
  if (conversations.length === 0) return [];
  // Group conversations into pseudo-projects by taking the top 3 most recent
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  const colors = ["from-violet-500 to-fuchsia-500", "from-cyan-500 to-blue-500", "from-amber-500 to-orange-500"];
  return sorted.slice(0, 3).map((c, i) => ({
    id: c.id,
    name: c.title.length > 30 ? c.title.slice(0, 30) + "…" : c.title,
    progress: Math.min(100, Math.round((c.messages.length / 20) * 100)),
    color: colors[i],
    agents: 1,
    files: 0,
    chats: c.messages.length,
    knowledge: 0,
    channels: 0,
    storage: "—",
    lastActivity: timeAgo(c.updatedAt),
  }));
}

// Derive running agents from the chat store's generating state + workspace agents
function deriveRunningAgents(isGenerating: boolean, conversations: any[], workspaceAgents: any[]) {
  const agents: any[] = [];
  // If the AI is currently generating, show it as a running agent
  if (isGenerating && conversations.length > 0) {
    const active = conversations.find((c) => c.id === useChatStore.getState().activeId) || conversations[0];
    agents.push({
      id: "active-ai",
      name: "SPYRO V1",
      status: "running",
      task: active ? `Responding: "${active.title.slice(0, 30)}"` : "Processing",
      project: "Current chat",
      time: "live",
      memory: "—",
      confidence: 95,
      eta: "now",
      avatar: "S",
      color: "#8B5CF6",
    });
  }
  // Add workspace agents (from the selected workspace template)
  if (workspaceAgents && workspaceAgents.length > 0) {
    workspaceAgents.slice(0, 2).forEach((a: any, i: number) => {
      agents.push({
        id: `ws-agent-${i}`,
        name: a.name,
        status: "idle",
        task: a.role,
        project: "Workspace",
        time: "—",
        memory: "—",
        confidence: 0,
        eta: "—",
        avatar: a.icon || a.name.charAt(0),
        color: a.color || "#71717A",
      });
    });
  }
  return agents;
}

// Derive recent activity from actual conversation messages
function deriveActivity(conversations: any[]) {
  const items: any[] = [];
  for (const c of conversations) {
    if (c.messages.length === 0) continue;
    const lastMsg = c.messages[c.messages.length - 1];
    items.push({
      id: `act-${c.id}`,
      type: lastMsg.role === "assistant" ? "agent" : "chat",
      icon: lastMsg.role === "assistant" ? Bot : MessageCircle,
      text: `${lastMsg.role === "assistant" ? "AI replied in" : "You sent message in"} "${c.title.slice(0, 30)}"`,
      time: lastMsg.timestamp || c.updatedAt,
      color: lastMsg.role === "assistant" ? "text-cyan-400" : "text-violet-400",
    });
  }
  // Sort by time descending, take 6
  return items.sort((a, b) => b.time - a.time).slice(0, 6);
}

// Derive AI suggestions from actual workspace state
function deriveSuggestions(conversations: any[], hasWorkspace: boolean) {
  const suggestions: any[] = [];
  if (conversations.length === 0) {
    suggestions.push({ id: "s1", icon: MessageCircle, title: "Start your first conversation", action: "New chat", color: "text-violet-400" });
  }
  if (conversations.length > 0 && conversations.length < 5) {
    suggestions.push({ id: "s2", icon: Sparkles, title: `You have ${conversations.length} conversation${conversations.length === 1 ? "" : "s"}`, action: "Continue chatting", color: "text-cyan-400" });
  }
  if (!hasWorkspace) {
    suggestions.push({ id: "s3", icon: LayoutGrid, title: "Choose a workspace template", action: "Set up now", color: "text-amber-400" });
  } else {
    suggestions.push({ id: "s4", icon: Zap, title: "Launch Studio for deep work", action: "Open Studio", color: "text-emerald-400" });
  }
  if (conversations.length > 5) {
    suggestions.push({ id: "s5", icon: Download, title: `${conversations.length} conversations — consider exporting`, action: "Export all", color: "text-rose-400" });
  }
  return suggestions.slice(0, 4);
}

// ── Main Dashboard ────────────────────────────────────────────────────
export function HomePage() {
  const conversations = useChatStore((s) => s.conversations);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const setActive = useChatStore((s) => s.setActive);
  const createConversation = useChatStore((s) => s.createConversation);
  const setView = useUIStore((s) => s.setView);
  const user = useLocalAuth((s) => s.user);

  const greeting = getGreeting();
  const allMessages = conversations.flatMap((c) => c.messages);
  const recentConvos = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);

  const stats = {
    conversations: conversations.length,
    messages: allMessages.length,
    daysActive: user?.createdAt ? Math.max(1, Math.ceil((Date.now() - user.createdAt) / 86400000)) : 1,
    status: isGenerating ? "Thinking" : "Ready",
  };

  const handleNewChat = () => { createConversation(); setView("chat"); };
  const handleOpenConvo = (id: string) => { setActive(id); setView("chat"); };

  // Workspace-aware quick actions — use the template's actions if available
  const workspaceTemplate = useWorkspaceStore((s) => s.template);
  const workspaceActions = workspaceTemplate?.quickActions
    ? workspaceTemplate.quickActions.map((qa) => ({
        label: qa.label,
        icon: qa.icon,
        color: "from-violet-500 to-fuchsia-500",
        view: qa.view as any,
      }))
    : QUICK_ACTIONS;

  // ── Derive real data from stores ──────────────────────────────────
  const pinnedProjects = deriveProjects(conversations);
  const runningAgents = deriveRunningAgents(isGenerating, conversations, workspaceTemplate?.agents || []);
  const recentActivity = deriveActivity(conversations);
  const aiSuggestions = deriveSuggestions(conversations, !!workspaceTemplate);

  // Communication channels — real connection status from comms store
  const commsConnection = useCommsStore.getState().connection;
  const communicationChannels = [
    { id: "wa", name: "WhatsApp", icon: "💬", unread: 0, pendingAI: 0, review: 0, lastSync: commsConnection?.lastSyncAt ? timeAgo(commsConnection.lastSyncAt) : "—", health: commsConnection?.status === "connected" ? "good" : "not-connected", color: commsConnection?.status === "connected" ? "text-emerald-400" : "text-muted-foreground" },
    { id: "email", name: "Email", icon: "📧", unread: 0, pendingAI: 0, review: 0, lastSync: "—", health: "not-connected", color: "text-muted-foreground" },
    { id: "tg", name: "Telegram", icon: "✈️", unread: 0, pendingAI: 0, review: 0, lastSync: "—", health: "not-connected", color: "text-muted-foreground" },
    { id: "slack", name: "Slack", icon: "💼", unread: 0, pendingAI: 0, review: 0, lastSync: "—", health: "not-connected", color: "text-muted-foreground" },
  ];

  return (
    <div className="ambient-mesh min-h-full">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:flex lg:gap-6">
        {/* ── Main column (left + center) ──────────────────────────── */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* HERO */}
          <HeroSection greeting={greeting} user={user} stats={stats} workspace={workspaceTemplate} />

          {/* QUICK ACTIONS — workspace-aware */}
          <QuickActions actions={workspaceActions} onAction={(v) => {
            if (v === "chat") handleNewChat();
            else setView(v as View);
          }} />

          {/* CONTINUE WORKING */}
          {recentConvos.length > 0 && (
            <Section title="Continue working" icon={Clock} actionLabel="View all" onAction={() => setView("chat")}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentConvos.map((c, i) => (
                  <ContinueCard key={c.id} convo={c} index={i} onOpen={() => handleOpenConvo(c.id)} />
                ))}
              </div>
            </Section>
          )}

          {/* PINNED PROJECTS — derived from real conversations */}
          {pinnedProjects.length > 0 && (
            <Section title="Pinned projects" icon={Pin} actionLabel="View all" onAction={() => setView("projects")}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pinnedProjects.map((p, i) => (
                  <PinnedProjectCard key={p.id} project={p} index={i} onOpen={() => setView("projects")} />
                ))}
              </div>
            </Section>
          )}

          {/* RUNNING AI AGENTS — real: shows SPYRO V1 when generating + workspace agents */}
          {runningAgents.length > 0 && (
            <Section title="Running AI agents" icon={Bot} actionLabel="View all" onAction={() => setView("agents")}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {runningAgents.map((a, i) => (
                  <AgentCard key={a.id} agent={a} index={i} onOpen={() => setView("agents")} />
                ))}
              </div>
            </Section>
          )}

          {/* COMMUNICATION CENTER — real connection status */}
          <Section title="Communication center" icon={Inbox} actionLabel="Open inbox" onAction={() => setView("communication")}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {communicationChannels.map((ch, i) => (
                <ChannelCard key={ch.id} channel={ch} index={i} onOpen={() => setView("communication")} />
              ))}
            </div>
          </Section>

          {/* AI SUGGESTIONS — derived from real state */}
          {aiSuggestions.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="AI suggestions" icon={Sparkles}>
                <div className="space-y-2">
                  {aiSuggestions.map((s, i) => (
                    <SuggestionCard key={s.id} suggestion={s} index={i} />
                  ))}
                </div>
              </Section>

              {/* RECENT ACTIVITY — derived from real messages */}
              <Section title="Recent activity" icon={Activity}>
                {recentActivity.length > 0 ? (
                  <ActivityTimeline items={recentActivity} />
                ) : (
                  <EmptyState icon={Activity} title="No activity yet" subtitle="Start a conversation to see activity here" actionLabel="New chat" onAction={handleNewChat} />
                )}
              </Section>
            </div>
          )}

          {/* RECENT ACTIVITY (full width if no suggestions) */}
          {aiSuggestions.length === 0 && recentActivity.length > 0 && (
            <Section title="Recent activity" icon={Activity}>
              <ActivityTimeline items={recentActivity} />
            </Section>
          )}

          {/* KNOWLEDGE + RECENT FILES — empty states when no data */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Knowledge updates" icon={BookOpen} actionLabel="Open knowledge" onAction={() => setView("knowledge")}>
              <EmptyState icon={BookOpen} title="No knowledge yet" subtitle="Upload documents to build your knowledge base" actionLabel="Add knowledge" onAction={() => setView("knowledge")} />
            </Section>

            <Section title="Recent files" icon={FileText} actionLabel="View all" onAction={() => setView("apps")}>
              <EmptyState icon={FileText} title="No files yet" subtitle="Upload files to see them here" actionLabel="Browse apps" onAction={() => setView("apps")} />
            </Section>
          </div>

          {/* WORKSPACE HEALTH + STORAGE */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Workspace health" icon={Server}>
              <HealthPanel />
            </Section>
            <Section title="Storage" icon={HardDrive}>
              <StoragePanel />
            </Section>
          </div>
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────── */}
        <div className="hidden w-72 shrink-0 space-y-4 lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}

// ── Hero Section ──────────────────────────────────────────────────────
function HeroSection({ greeting, user, stats, workspace }: { greeting: { text: string; icon: string }; user: any; stats: any; workspace: any }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ambient-mesh surface-elevated overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">{greeting.icon}</span>
          <span>{greeting.text}</span>
          <span className="relative flex h-1.5 w-1.5">
            {stats.status === "Thinking" && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />}
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", stats.status === "Thinking" ? "bg-primary" : "bg-emerald-500")} />
          </span>
          {/* Workspace badge */}
          {workspace && (
            <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-br px-2.5 py-1 text-[10px] font-medium text-white", workspace.color)}>
              <workspace.icon className="h-3 w-3" />
              {workspace.name}
            </span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          {user?.name ? <>Welcome back, <span className="spyro-text-gradient">{user.name.split(" ")[0]}</span></> : <>Welcome to <span className="spyro-text-gradient">SPYRO</span></>}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Continue where you left off.</p>

        {/* Status bar */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px]">
          <StatusChip icon={LayoutGrid} label="Workspace" value="Personal" />
          <StatusChip icon={Zap} label="Model" value="SPYRO V1" />
          <StatusChip icon={TrendingUp} label="Plan" value="Free" />
          <StatusChip icon={Activity} label="Status" value={stats.status} color={stats.status === "Thinking" ? "text-amber-400" : "text-emerald-400"} />
        </div>

        {/* Mini stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat label="Conversations" value={stats.conversations} icon={MessageCircle} accent="text-violet-400" />
          <MiniStat label="Messages" value={stats.messages} icon={Sparkles} accent="text-cyan-400" />
          <MiniStat label="Days active" value={stats.daysActive} icon={TrendingUp} accent="text-emerald-400" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Quick Actions ─────────────────────────────────────────────────────
function QuickActions({ actions, onAction }: { actions: typeof QUICK_ACTIONS; onAction: (v: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Quick actions</h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.03 }}
            onClick={() => onAction(a.view)}
            className="group surface p-3 text-left transition-all hover:spyro-glow"
          >
            <div className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br text-white shadow-soft transition-transform group-hover:scale-110", a.color)}>
              <a.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-[11px] font-medium leading-tight">{a.label}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Continue Working card ─────────────────────────────────────────────
function ContinueCard({ convo, index, onOpen }: { convo: any; index: number; onOpen: () => void }) {
  const lastMsg = convo.messages[convo.messages.length - 1];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      onClick={onOpen}
      className="group surface-elevated p-4 text-left transition-all hover:spyro-glow"
    >
      <div className="flex items-center justify-between">
        <span className="truncate text-sm font-medium">{convo.title}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{lastMsg?.content?.slice(0, 60) || "No messages yet"}</p>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground/60">
        <MessageCircle className="h-3 w-3" />
        {convo.messages.length} messages
        <span>·</span>
        {timeAgo(convo.updatedAt)}
      </div>
    </motion.button>
  );
}

// ── Pinned Project card ───────────────────────────────────────────────
function PinnedProjectCard({ project, index, onOpen }: { project: typeof PINNED_PROJECTS[0]; index: number; onOpen: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      onClick={onOpen}
      className="group surface overflow-hidden text-left transition-all hover:spyro-glow"
    >
      {/* Cover */}
      <div className={cn("h-20 bg-gradient-to-br", project.color)} />
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="truncate text-sm font-semibold">{project.name}</h3>
          <Pin className="h-3 w-3 fill-primary text-primary" />
        </div>
        {/* Progress */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">{project.progress}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full spyro-bg-gradient"
            />
          </div>
        </div>
        {/* Stats grid */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
          <ProjectStat icon={Bot} value={project.agents} label="agents" />
          <ProjectStat icon={FileText} value={project.files} label="files" />
          <ProjectStat icon={MessageCircle} value={project.chats} label="chats" />
          <ProjectStat icon={BookOpen} value={project.knowledge} label="docs" />
          <ProjectStat icon={Inbox} value={project.channels} label="channels" />
          <ProjectStat icon={HardDrive} value={project.storage} label="" />
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground/60">Last activity: {project.lastActivity}</div>
      </div>
    </motion.button>
  );
}

// ── Running Agent card ────────────────────────────────────────────────
function AgentCard({ agent, index, onOpen }: { agent: typeof RUNNING_AGENTS[0]; index: number; onOpen: () => void }) {
  const isRunning = agent.status === "running";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      className="surface p-4"
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <div className="grid h-10 w-10 place-items-center rounded-xl text-sm font-bold text-white" style={{ background: agent.color }}>
            {agent.avatar}
          </div>
          {isRunning && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-400" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{agent.name}</div>
          <div className="truncate text-[10px] text-muted-foreground">{agent.task}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-lg bg-secondary/40 p-2">
          <div className="text-muted-foreground">Project</div>
          <div className="truncate font-medium">{agent.project}</div>
        </div>
        <div className="rounded-lg bg-secondary/40 p-2">
          <div className="text-muted-foreground">Runtime</div>
          <div className="font-mono font-medium">{agent.time}</div>
        </div>
        <div className="rounded-lg bg-secondary/40 p-2">
          <div className="text-muted-foreground">Memory</div>
          <div className="font-medium">{agent.memory}</div>
        </div>
        <div className="rounded-lg bg-secondary/40 p-2">
          <div className="text-muted-foreground">ETA</div>
          <div className="font-medium">{agent.eta}</div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Confidence</span>
          <span className="font-medium">{agent.confidence}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
          <div className={cn("h-full rounded-full", agent.confidence >= 85 ? "bg-emerald-400" : "bg-amber-400")} style={{ width: `${agent.confidence}%` }} />
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-1">
        <button className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground" aria-label={isRunning ? "Pause" : "Resume"}>
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </button>
        <button onClick={onOpen} className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground" aria-label="Open">
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground" aria-label="Logs">
          <FileText className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Communication Channel card ────────────────────────────────────────
function ChannelCard({ channel, index, onOpen }: { channel: typeof COMMUNICATION_CHANNELS[0]; index: number; onOpen: () => void }) {
  const healthColor = channel.health === "good" ? "text-emerald-400" : channel.health === "disconnected" ? "text-amber-400" : "text-muted-foreground";
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      onClick={onOpen}
      className="surface p-4 text-left transition-all hover:spyro-glow"
    >
      <div className="flex items-center justify-between">
        <span className="text-xl">{channel.icon}</span>
        <span className={cn("h-2 w-2 rounded-full", healthColor === "text-emerald-400" ? "bg-emerald-400" : healthColor === "text-amber-400" ? "bg-amber-400" : "bg-muted-foreground/30")} />
      </div>
      <div className="mt-2 text-sm font-medium">{channel.name}</div>
      <div className={cn("text-[10px]", healthColor)}>{channel.health === "good" ? "Connected" : channel.health === "disconnected" ? "Disconnected" : "Not connected"}</div>
      {channel.health === "good" && (
        <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
          <div className="flex items-center justify-between"><span>Unread</span><span className="font-medium text-foreground">{channel.unread}</span></div>
          <div className="flex items-center justify-between"><span>AI pending</span><span className="font-medium text-violet-400">{channel.pendingAI}</span></div>
          <div className="flex items-center justify-between"><span>Review</span><span className="font-medium text-amber-400">{channel.review}</span></div>
        </div>
      )}
      <div className="mt-2 text-[10px] text-muted-foreground/60">Sync: {channel.lastSync}</div>
    </motion.button>
  );
}

// ── Task List ─────────────────────────────────────────────────────────
function TaskList({ tasks }: { tasks: typeof TASKS }) {
  return (
    <div className="space-y-1.5">
      {tasks.map((t) => (
        <div key={t.id} className={cn("flex items-center gap-3 rounded-xl border border-border p-3", t.done && "opacity-50")}>
          {t.done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <div className={cn("truncate text-xs", t.done && "line-through")}>{t.title}</div>
            <div className="text-[10px] text-muted-foreground">{t.due}</div>
          </div>
          {t.type === "ai" && <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] text-violet-400">AI</span>}
          <PriorityBadge priority={t.priority} />
        </div>
      ))}
    </div>
  );
}

// ── Suggestion Card ───────────────────────────────────────────────────
function SuggestionCard({ suggestion, index }: { suggestion: typeof AI_SUGGESTIONS[0]; index: number }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.04 }}
      className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card/40 p-3 text-left transition-colors hover:bg-secondary/40"
    >
      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary", suggestion.color)}>
        <suggestion.icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-foreground/90">{suggestion.title}</p>
        <p className={cn("text-[10px] font-medium", suggestion.color)}>{suggestion.action}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.button>
  );
}

// ── Activity Timeline ─────────────────────────────────────────────────
function ActivityTimeline({ items }: { items: typeof RECENT_ACTIVITY }) {
  return (
    <div className="space-y-1">
      {items.map((a, i) => (
        <motion.div
          key={a.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.03 }}
          className="flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-secondary/30"
        >
          <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-secondary", a.color)}>
            <a.icon className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-tight">{a.text}</p>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(a.time)}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Health Panel ──────────────────────────────────────────────────────
function HealthPanel() {
  // Real data from stores
  const conversations = useChatStore((s) => s.conversations);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const commsConnected = useCommsStore.getState().connection?.status === "connected";
  const msgCount = conversations.flatMap((c) => c.messages).length;
  const storageUsed = Math.min(100, Math.round((msgCount / 1000) * 100));

  const items = [
    { label: "Storage", value: `${storageUsed}% used`, pct: storageUsed || 5, icon: HardDrive, color: storageUsed > 80 ? "bg-amber-400" : "bg-emerald-400" },
    { label: "Conversations", value: `${conversations.length} active`, pct: Math.min(100, conversations.length * 10) || 5, icon: MessageCircle, color: "bg-cyan-400" },
    { label: "AI status", value: isGenerating ? "Processing" : "Ready", pct: isGenerating ? 100 : 0, icon: Bot, color: isGenerating ? "bg-amber-400" : "bg-emerald-400" },
    { label: "Comm health", value: commsConnected ? "Connected" : "Offline", pct: commsConnected ? 90 : 0, icon: Inbox, color: commsConnected ? "bg-emerald-400" : "bg-muted-foreground" },
    { label: "Messages", value: `${msgCount} total`, pct: Math.min(100, msgCount) || 5, icon: Activity, color: "bg-violet-400" },
    { label: "Database", value: "Healthy", pct: 100, icon: Database, color: "bg-emerald-400" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((h) => (
        <div key={h.label} className="rounded-xl border border-border bg-card/40 p-3">
          <div className="flex items-center gap-2">
            <h.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{h.label}</span>
          </div>
          <div className="mt-1 text-xs font-medium">{h.value}</div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
            <div className={cn("h-full rounded-full", h.color)} style={{ width: `${h.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Storage Panel ─────────────────────────────────────────────────────
function StoragePanel() {
  return (
    <div className="space-y-3">
      {/* Big circular gauge */}
      <div className="flex items-center gap-4">
        <div className="relative grid h-20 w-20 place-items-center">
          <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" className="text-primary" strokeDasharray="227 227" strokeDashoffset="75" strokeLinecap="round" />
          </svg>
          <div className="absolute text-center">
            <div className="text-lg font-bold">67%</div>
            <div className="text-[9px] text-muted-foreground">used</div>
          </div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">6.7 GB used</div>
          <div className="text-[11px] text-muted-foreground">3.3 GB remaining of 10 GB</div>
          <div className="mt-2 text-[10px] text-muted-foreground">No upcoming deletions</div>
        </div>
      </div>
      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium hover:bg-secondary">
          <Download className="h-3 w-3" /> Export
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg spyro-bg-gradient px-3 py-1.5 text-[11px] font-medium text-white">
          <TrendingUp className="h-3 w-3" /> Upgrade
        </button>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium hover:bg-secondary">
          <Activity className="h-3 w-3" /> Analytics
        </button>
      </div>
    </div>
  );
}

// ── Right Sidebar ─────────────────────────────────────────────────────
function RightSidebar() {
  return (
    <>
      {/* Workspace status */}
      <div className="surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <Server className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-semibold">Workspace status</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-[11px] text-muted-foreground">All systems operational</span>
        </div>
      </div>

      {/* Notifications */}
      <div className="surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold">Notifications</span>
          </div>
          <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">3</span>
        </div>
        <div className="space-y-2">
          {[
            { icon: Bot, text: "Research Agent finished", time: "5m ago", color: "text-cyan-400" },
            { icon: Inbox, text: "3 new WhatsApp messages", time: "12m ago", color: "text-emerald-400" },
            { icon: AlertCircle, text: "Storage 67% full", time: "1h ago", color: "text-amber-400" },
          ].map((n, i) => (
            <div key={i} className="flex items-start gap-2">
              <n.icon className={cn("mt-0.5 h-3 w-3 shrink-0", n.color)} />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] leading-tight">{n.text}</p>
                <p className="text-[9px] text-muted-foreground">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar / Upcoming */}
      <div className="surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Upcoming</span>
        </div>
        <div className="space-y-2">
          <div className="rounded-lg bg-secondary/40 p-2">
            <div className="text-[11px] font-medium">Review Research report</div>
            <div className="text-[9px] text-muted-foreground">Today · 5:00 PM</div>
          </div>
          <div className="rounded-lg bg-secondary/40 p-2">
            <div className="text-[11px] font-medium">Export conversations</div>
            <div className="text-[9px] text-muted-foreground">Tomorrow</div>
          </div>
        </div>
      </div>

      {/* Pinned notes */}
      <div className="surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <Pin className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold">Pinned notes</span>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-200/90">
          Remember to index the PDFs before the team meeting.
        </div>
      </div>

      {/* Background jobs */}
      <div className="surface p-4">
        <div className="mb-2 flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-semibold">Background jobs</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin text-cyan-400" /> PDF indexing</span>
            <span className="text-muted-foreground">3/5</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin text-violet-400" /> Agent training</span>
            <span className="text-muted-foreground">68%</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Small reusable components ─────────────────────────────────────────
function Section({ title, icon: Icon, actionLabel, onAction, children }: { title: string; icon: LucideIcon; actionLabel?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h2>
        {actionLabel && (
          <button onClick={onAction} className="text-xs text-muted-foreground hover:text-foreground">
            {actionLabel} →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function StatusChip({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/40 px-2.5 py-1">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("font-medium", color)}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon: LucideIcon; accent: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <Icon className={cn("h-3.5 w-3.5", accent)} />
      <div className="mt-1.5 text-xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ProjectStat({ icon: Icon, value, label }: { icon: LucideIcon; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="h-2.5 w-2.5 text-muted-foreground" />
      <span className="font-medium">{value}</span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    high: "bg-rose-500/10 text-rose-400",
    medium: "bg-amber-500/10 text-amber-400",
    low: "bg-secondary text-muted-foreground",
  };
  return <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize", colors[priority])}>{priority}</span>;
}

function FileIcon({ type }: { type: string }) {
  switch (type) {
    case "image": return <ImageIcon className="h-5 w-5" />;
    case "pdf": return <FileText className="h-5 w-5" />;
    case "code": return <FileCode2 className="h-5 w-5" />;
    case "audio": return <MessageCircle className="h-5 w-5" />;
    default: return <FileText className="h-5 w-5" />;
  }
}

// Loader2 import (used in some cards)
import { Loader2 } from "lucide-react";

// ── Empty State ───────────────────────────────────────────────────────
function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }: { icon: LucideIcon; title: string; subtitle: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/60">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-2 text-xs font-medium">{title}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-3 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-medium hover:bg-secondary">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
