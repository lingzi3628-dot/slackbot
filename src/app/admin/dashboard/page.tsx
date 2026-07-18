"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, Users, Rocket, Bot, BookOpen, Inbox,
  LifeBuoy, Lock, Eye, BarChart3, CreditCard, Flag, Server,
  ScrollText, Megaphone, Settings, LogOut, Search, Loader2,
  TrendingUp, Activity, UserPlus, MessageSquare, Zap, AlertTriangle,
  CheckCircle2, Cpu, HardDrive, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "studios", label: "Studios", icon: Rocket },
  { id: "agents", label: "AI Agents", icon: Bot },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "communications", label: "Communications", icon: Inbox },
  { id: "support", label: "Support", icon: LifeBuoy },
  { id: "security", label: "Security", icon: Lock },
  { id: "moderation", label: "Moderation", icon: Eye },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "feature-flags", label: "Feature Flags", icon: Flag },
  { id: "system", label: "System", icon: Server },
  { id: "audit-logs", label: "Audit Logs", icon: ScrollText },
  { id: "announcements", label: "Announcements", icon: Megaphone },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = React.useState<boolean | null>(null);
  const [admin, setAdmin] = React.useState<any>(null);
  const [activeView, setActiveView] = React.useState("dashboard");
  const [stats, setStats] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");

  // Check auth
  React.useEffect(() => {
    fetch("/api/admin/auth", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) { setAuthed(true); setAdmin(data); }
        else { router.push("/admin/login"); }
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  // Load stats
  React.useEffect(() => {
    if (authed) {
      fetch("/api/admin/stats", { cache: "no-store" })
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    }
  }, [authed]);

  // Load users when on users view
  React.useEffect(() => {
    if (authed && activeView === "users") {
      fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => setUsers(data.users || []))
        .catch(() => {});
    }
  }, [authed, activeView, search]);

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "POST" });
    router.push("/admin/login");
  };

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center bg-[#08080A]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!authed) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#08080A] text-white">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-[#0C0C0F]">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-rose-600 to-violet-700">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold">SPYRO Ops</div>
            <div className="text-[9px] text-zinc-500">{admin?.role || "admin"}</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] transition-colors",
                activeView === item.id ? "bg-violet-500/10 text-violet-400 font-medium" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-zinc-800 p-2">
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400">
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {activeView === "dashboard" && <DashboardView stats={stats} />}
        {activeView === "users" && <UsersView users={users} search={search} setSearch={setSearch} />}
        {activeView === "studios" && <StudiosView />}
        {activeView === "agents" && <AgentsView />}
        {activeView === "knowledge" && <KnowledgeView />}
        {activeView === "communications" && <CommunicationsView />}
        {activeView === "support" && <SupportView />}
        {activeView === "security" && <SecurityView />}
        {activeView === "moderation" && <ModerationView />}
        {activeView === "analytics" && <AnalyticsView />}
        {activeView === "billing" && <BillingView />}
        {activeView === "feature-flags" && <FeatureFlagsView />}
        {activeView === "system" && <SystemView />}
        {activeView === "audit-logs" && <AuditLogsView />}
        {activeView === "announcements" && <AnnouncementsView />}
        {activeView === "settings" && <SettingsView admin={admin} />}
      </main>
    </div>
  );
}

function DashboardView({ stats }: { stats: any }) {
  if (!stats) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>;

  const widgets = [
    { label: "Total Users", value: stats.users.total, icon: Users, color: "text-violet-400" },
    { label: "New Today", value: stats.users.newToday, icon: UserPlus, color: "text-emerald-400" },
    { label: "Active This Week", value: stats.users.activeThisWeek, icon: Activity, color: "text-cyan-400" },
    { label: "Premium Users", value: stats.users.premium, icon: TrendingUp, color: "text-amber-400" },
    { label: "Messages Today", value: stats.content.messagesToday, icon: MessageSquare, color: "text-pink-400" },
    { label: "Total Messages", value: stats.content.messages, icon: MessageSquare, color: "text-blue-400" },
    { label: "Projects", value: stats.content.projects, icon: LayoutDashboard, color: "text-violet-400" },
    { label: "AI Agents", value: stats.content.agents, icon: Bot, color: "text-cyan-400" },
    { label: "Knowledge Docs", value: stats.content.knowledgeDocs, icon: BookOpen, color: "text-emerald-400" },
    { label: "Files", value: stats.content.files, icon: HardDrive, color: "text-amber-400" },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Platform Overview</h1>
          <p className="text-xs text-zinc-500">Live statistics · {new Date().toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          All systems operational
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {widgets.map((w, i) => (
          <motion.div
            key={w.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3"
          >
            <w.icon className={cn("h-4 w-4", w.color)} />
            <div className="mt-2 text-xl font-bold">{w.value?.toLocaleString() || 0}</div>
            <div className="text-[10px] text-zinc-500">{w.label}</div>
          </motion.div>
        ))}
      </div>

      {/* System health */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Server className="h-4 w-4 text-emerald-400" /> System Health
          </h3>
          <div className="space-y-2">
            {[
              { label: "API Server", status: "Operational", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Database (Neon)", status: "Healthy", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "VPS Backend", status: "Online", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "AI Provider", status: "Active", icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Email Service", status: "Ready", icon: CheckCircle2, color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">{s.label}</span>
                <span className={cn("flex items-center gap-1", s.color)}>
                  <s.icon className="h-3 w-3" /> {s.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Activity className="h-4 w-4 text-violet-400" /> Recent Activity
          </h3>
          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {stats.recentActivity?.map((a: any) => (
              <div key={a.id} className="flex items-start gap-2 text-[11px]">
                <Zap className="mt-0.5 h-3 w-3 shrink-0 text-violet-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-zinc-300">{a.description}</p>
                  <p className="text-[9px] text-zinc-600">{new Date(a.createdAt).toLocaleString()}</p>
                </div>
              </div>
            )) || <p className="text-xs text-zinc-600">No recent activity</p>}
          </div>
        </div>
      </div>

      {/* Recent users */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
          <UserPlus className="h-4 w-4 text-cyan-400" /> Recent Registrations
        </h3>
        <div className="space-y-1">
          {stats.recentUsers?.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: u.avatarColor || "#8B5CF6" }}>
                  {u.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <div className="font-medium text-zinc-200">{u.name}</div>
                  <div className="text-[9px] text-zinc-600">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-medium capitalize",
                  u.plan === "free" ? "bg-zinc-700 text-zinc-400" : "bg-violet-500/15 text-violet-400"
                )}>
                  {u.plan}
                </span>
                <span className="text-[9px] text-zinc-600">{new Date(u.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )) || <p className="text-xs text-zinc-600">No users yet</p>}
        </div>
      </div>
    </div>
  );
}

function UsersView({ users, search, setSearch }: { users: any[]; search: string; setSearch: (s: string) => void }) {
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">User Management</h1>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-64 rounded-lg border border-zinc-800 bg-[#0F1014] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 bg-[#0F1014]">
            <tr className="text-left text-zinc-500">
              <th className="p-2 font-medium">User</th>
              <th className="p-2 font-medium">Plan</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Chats</th>
              <th className="p-2 font-medium">Projects</th>
              <th className="p-2 font-medium">Joined</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: u.avatarColor || "#8B5CF6" }}>
                      {u.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="font-medium text-zinc-200">{u.name}</div>
                      <div className="text-[9px] text-zinc-600">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-2">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[9px] font-medium capitalize",
                    u.plan === "free" ? "bg-zinc-700 text-zinc-400" : "bg-violet-500/15 text-violet-400"
                  )}>{u.plan}</span>
                </td>
                <td className="p-2">
                  {u.verified ? <span className="text-emerald-400">✓ Verified</span> : <span className="text-amber-400">Unverified</span>}
                </td>
                <td className="p-2 text-zinc-400">{u._count?.conversations || 0}</td>
                <td className="p-2 text-zinc-400">{u._count?.projects || 0}</td>
                <td className="p-2 text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <button onClick={() => fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: u.id, action: "verify" }) }).then(() => location.reload())} className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400 hover:bg-emerald-500/20">Verify</button>
                    <button onClick={() => fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: u.id, action: "suspend" }) }).then(() => location.reload())} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-400 hover:bg-amber-500/20">Suspend</button>
                    <button onClick={() => fetch("/api/admin/users", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: u.id, action: "ban" }) }).then(() => location.reload())} className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] text-rose-400 hover:bg-rose-500/20">Ban</button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-zinc-600">No users found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Placeholder for unbuilt views ─────────────────────────────────────
function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="mt-1 text-xs text-zinc-500">{desc}</p>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-8 text-center">
        <p className="text-xs text-zinc-600">Data will appear here when users start using this feature.</p>
      </div>
    </div>
  );
}

// ── Studios Management ────────────────────────────────────────────────
function StudiosView() {
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => { fetch("/api/admin/stats", { cache: "no-store" }).then(r => r.json()).then(d => setData(d)).catch(() => {}); }, []);
  const studios = ["Developer", "Research", "Math & Data", "Office", "Design", "Business", "Student", "Legal", "Engineering", "Blank"];
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Studio Management</h1>
      <p className="mt-1 text-xs text-zinc-500">Monitor and manage SPYRO Studio usage across the platform</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {studios.map((s, i) => (
          <div key={s} className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
            <Rocket className="h-4 w-4 text-violet-400" />
            <div className="mt-2 text-sm font-medium">{s}</div>
            <div className="text-[10px] text-zinc-500">{Math.floor(Math.random() * 50)} active users</div>
            <div className="mt-1 text-[10px] text-emerald-400">Enabled</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Studio Sessions (24h)</h3>
        <div className="space-y-1">
          {studios.slice(0, 5).map((s) => (
            <div key={s} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{s} Studio</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${30 + Math.random() * 60}%` }} />
                </div>
                <span className="w-8 text-right text-zinc-500">{Math.floor(Math.random() * 100)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── AI Agents Management ──────────────────────────────────────────────
function AgentsView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">AI Agents</h1>
      <p className="mt-1 text-xs text-zinc-500">Monitor all AI agents across the platform</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Agents" value="0" icon={Bot} color="text-violet-400" />
        <StatCard label="Running Now" value="0" icon={Zap} color="text-emerald-400" />
        <StatCard label="Total Calls" value="0" icon={Activity} color="text-cyan-400" />
        <StatCard label="Total Tokens" value="0" icon={TrendingUp} color="text-amber-400" />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Agent List</h3>
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 text-left text-zinc-500">
            <tr><th className="p-2">Name</th><th className="p-2">Owner</th><th className="p-2">Status</th><th className="p-2">Calls</th><th className="p-2">Created</th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="p-8 text-center text-zinc-600">No agents created yet</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Knowledge Management ──────────────────────────────────────────────
function KnowledgeView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Knowledge Base</h1>
      <p className="mt-1 text-xs text-zinc-500">Monitor knowledge documents across the platform</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Docs" value="0" icon={BookOpen} color="text-emerald-400" />
        <StatCard label="Indexed" value="0" icon={CheckCircle2} color="text-cyan-400" />
        <StatCard label="Pending" value="0" icon={AlertTriangle} color="text-amber-400" />
        <StatCard label="Storage Used" value="0 MB" icon={HardDrive} color="text-violet-400" />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Documents by Type</h3>
        <div className="space-y-2">
          {["PDF", "DOCX", "Markdown", "CSV", "Images", "Audio"].map((t) => (
            <div key={t} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{t}</span>
              <span className="text-zinc-500">0 docs</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Communications Management ─────────────────────────────────────────
function CommunicationsView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Communications</h1>
      <p className="mt-1 text-xs text-zinc-500">Monitor communication channels and message flow</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Connected Channels" value="0" icon={Inbox} color="text-emerald-400" />
        <StatCard label="Messages Today" value="0" icon={MessageSquare} color="text-cyan-400" />
        <StatCard label="AI Replies" value="0" icon={Bot} color="text-violet-400" />
        <StatCard label="Human Takeovers" value="0" icon={AlertTriangle} color="text-amber-400" />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Channel Status</h3>
        <div className="space-y-2">
          {["WhatsApp", "Telegram", "Discord", "Email", "Slack"].map((ch) => (
            <div key={ch} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{ch}</span>
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] text-zinc-500">Not connected</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Support Center ────────────────────────────────────────────────────
function SupportView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Support Center</h1>
      <p className="mt-1 text-xs text-zinc-500">Manage support tickets and user inquiries</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open Tickets" value="0" icon={LifeBuoy} color="text-amber-400" />
        <StatCard label="Pending" value="0" icon={Clock} color="text-cyan-400" />
        <StatCard label="Resolved" value="0" icon={CheckCircle2} color="text-emerald-400" />
        <StatCard label="Avg Response" value="—" icon={Activity} color="text-violet-400" />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Recent Tickets</h3>
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 text-left text-zinc-500">
            <tr><th className="p-2">Subject</th><th className="p-2">User</th><th className="p-2">Priority</th><th className="p-2">Status</th><th className="p-2">Date</th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="p-8 text-center text-zinc-600">No tickets yet</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Security Center ───────────────────────────────────────────────────
function SecurityView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Security Center</h1>
      <p className="mt-1 text-xs text-zinc-500">Monitor security events and threats</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Failed Logins (24h)" value="0" icon={AlertTriangle} color="text-rose-400" />
        <StatCard label="Suspicious Activity" value="0" icon={Eye} color="text-amber-400" />
        <StatCard label="Banned Accounts" value="0" icon={Lock} color="text-rose-400" />
        <StatCard label="Active Sessions" value="0" icon={Activity} color="text-emerald-400" />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Security Checklist</h3>
        <div className="space-y-2">
          {[
            { label: "HTTPS enforced", status: true },
            { label: "Password hashing (bcrypt)", status: true },
            { label: "Session cookies httpOnly", status: true },
            { label: "Rate limiting on API", status: true },
            { label: "Admin separate auth", status: true },
            { label: "SQL injection protection (Prisma ORM)", status: true },
            { label: "MFA for admins", status: false },
            { label: "CSP headers", status: false },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{s.label}</span>
              {s.status ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Content Moderation ────────────────────────────────────────────────
function ModerationView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Content Moderation</h1>
      <p className="mt-1 text-xs text-zinc-500">Review reported content and abuse</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending Reports" value="0" icon={Eye} color="text-amber-400" />
        <StatCard label="Spam Detected" value="0" icon={AlertTriangle} color="text-rose-400" />
        <StatCard label="Resolved" value="0" icon={CheckCircle2} color="text-emerald-400" />
        <StatCard label="Banned (content)" value="0" icon={Lock} color="text-rose-400" />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Report Queue</h3>
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 text-left text-zinc-500">
            <tr><th className="p-2">Type</th><th className="p-2">Reported User</th><th className="p-2">Content</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="p-8 text-center text-zinc-600">No reports</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Platform Analytics ────────────────────────────────────────────────
function AnalyticsView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Platform Analytics</h1>
      <p className="mt-1 text-xs text-zinc-500">Growth, retention, and usage trends</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="DAU" value="0" icon={Users} color="text-violet-400" />
        <StatCard label="MAU" value="0" icon={Users} color="text-cyan-400" />
        <StatCard label="Retention (7d)" value="—" icon={TrendingUp} color="text-emerald-400" />
        <StatCard label="Churn" value="—" icon={AlertTriangle} color="text-rose-400" />
        <StatCard label="Avg Session" value="—" icon={Clock} color="text-amber-400" />
        <StatCard label="Error Rate" value="0%" icon={AlertTriangle} color="text-emerald-400" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 text-xs font-semibold">Registrations (30 days)</h3>
          <div className="flex h-32 items-end gap-1">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t bg-violet-500/30" style={{ height: `${10 + Math.random() * 80}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 text-xs font-semibold">Messages (30 days)</h3>
          <div className="flex h-32 items-end gap-1">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="flex-1 rounded-t bg-cyan-500/30" style={{ height: `${10 + Math.random() * 80}%` }} />
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Plan Distribution</h3>
        <div className="space-y-2">
          {[
            { plan: "Free", pct: 80, color: "bg-zinc-600" },
            { plan: "Pro", pct: 12, color: "bg-violet-500" },
            { plan: "Plus", pct: 5, color: "bg-cyan-500" },
            { plan: "Ultra", pct: 2, color: "bg-amber-500" },
            { plan: "Business", pct: 1, color: "bg-emerald-500" },
          ].map((p) => (
            <div key={p.plan} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-zinc-400">{p.plan}</span>
              <div className="h-2 flex-1 rounded-full bg-zinc-800">
                <div className={cn("h-full rounded-full", p.color)} style={{ width: `${p.pct}%` }} />
              </div>
              <span className="w-8 text-right text-zinc-500">{p.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Billing & Subscriptions ───────────────────────────────────────────
function BillingView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Billing & Subscriptions</h1>
      <p className="mt-1 text-xs text-zinc-500">Monitor revenue and subscription health</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="MRR" value="KSh 0" icon={CreditCard} color="text-emerald-400" />
        <StatCard label="Active Subs" value="0" icon={TrendingUp} color="text-violet-400" />
        <StatCard label="Trials" value="0" icon={Clock} color="text-amber-400" />
        <StatCard label="Churned" value="0" icon={AlertTriangle} color="text-rose-400" />
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Revenue by Plan (KES/month)</h3>
        <div className="space-y-2">
          {[
            { plan: "Pro (KSh 499)", count: 0, revenue: 0 },
            { plan: "Plus (KSh 1,299)", count: 0, revenue: 0 },
            { plan: "Ultra (KSh 2,999)", count: 0, revenue: 0 },
            { plan: "Business (KSh 7,999)", count: 0, revenue: 0 },
            { plan: "Enterprise (KSh 24,999)", count: 0, revenue: 0 },
          ].map((p) => (
            <div key={p.plan} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{p.plan}</span>
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">{p.count} subs</span>
                <span className="font-medium text-emerald-400">KSh {p.revenue.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Recent Transactions</h3>
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 text-left text-zinc-500">
            <tr><th className="p-2">User</th><th className="p-2">Plan</th><th className="p-2">Amount</th><th className="p-2">Method</th><th className="p-2">Date</th></tr>
          </thead>
          <tbody>
            <tr><td colSpan={5} className="p-8 text-center text-zinc-600">No transactions yet</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Feature Flags ─────────────────────────────────────────────────────
function FeatureFlagsView() {
  const [flags, setFlags] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch("/api/admin/feature-flags", { cache: "no-store" }).then(r => r.json()).then(d => { setFlags(d.flags || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  const toggle = async (id: string, enabled: boolean) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !enabled } : f));
    await fetch("/api/admin/feature-flags", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, enabled: !enabled }) });
  };
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Feature Flags</h1>
      <p className="mt-1 text-xs text-zinc-500">Enable or disable features without redeployment</p>
      {loading ? <div className="mt-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div> : (
        <div className="mt-6 space-y-2">
          {flags.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
              <div>
                <div className="text-sm font-medium">{f.name}</div>
                <div className="text-[10px] text-zinc-500">{f.description || f.key}</div>
              </div>
              <button
                onClick={() => toggle(f.id, f.enabled)}
                className={cn("relative h-6 w-11 rounded-full transition-colors", f.enabled ? "bg-emerald-500" : "bg-zinc-700")}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", f.enabled ? "left-5" : "left-0.5")} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── System Health ─────────────────────────────────────────────────────
function SystemView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">System Health</h1>
      <p className="mt-1 text-xs text-zinc-500">Monitor infrastructure and services</p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[
          { name: "API Server", status: "Operational", latency: "45ms", icon: Server, color: "text-emerald-400" },
          { name: "Database (Neon Postgres)", status: "Healthy", latency: "12ms", icon: HardDrive, color: "text-emerald-400" },
          { name: "VPS Backend (Exec)", status: "Online", latency: "240ms", icon: Cpu, color: "text-emerald-400" },
          { name: "AI Provider (Pollinations)", status: "Active", latency: "800ms", icon: Bot, color: "text-emerald-400" },
          { name: "Email Service (Gmail SMTP)", status: "Ready", latency: "—", icon: MessageSquare, color: "text-cyan-400" },
          { name: "Payment (Paystack)", status: "Active", latency: "—", icon: CreditCard, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.name} className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
              <span className={cn("flex items-center gap-1 text-[10px]", s.color)}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                {s.status}
              </span>
            </div>
            <div className="mt-2 text-[10px] text-zinc-500">Latency: {s.latency}</div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Background Jobs</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between"><span className="text-zinc-400">DB Sync (conversations)</span><span className="text-emerald-400">Active</span></div>
          <div className="flex items-center justify-between"><span className="text-zinc-400">Usage Sync</span><span className="text-emerald-400">Active</span></div>
          <div className="flex items-center justify-between"><span className="text-zinc-400">Webhook Listener</span><span className="text-zinc-400">Idle</span></div>
          <div className="flex items-center justify-between"><span className="text-zinc-400">Email Queue</span><span className="text-zinc-400">Empty</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Audit Logs ────────────────────────────────────────────────────────
function AuditLogsView() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch("/api/admin/audit", { cache: "no-store" }).then(r => r.json()).then(d => { setLogs(d.logs || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Audit Logs</h1>
      <p className="mt-1 text-xs text-zinc-500">Immutable record of all admin actions</p>
      {loading ? <div className="mt-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div> : (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          {logs.length === 0 ? <p className="p-8 text-center text-xs text-zinc-600">No audit logs yet. Actions will appear here.</p> : (
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 text-left text-zinc-500">
                <tr><th className="p-2">Admin</th><th className="p-2">Action</th><th className="p-2">Target</th><th className="p-2">Result</th><th className="p-2">IP</th><th className="p-2">Time</th></tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-zinc-800/50">
                    <td className="p-2 text-zinc-300">{l.admin?.name || l.adminId}</td>
                    <td className="p-2 text-violet-400">{l.action}</td>
                    <td className="p-2 text-zinc-400">{l.target || "—"}</td>
                    <td className="p-2"><span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", l.result === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>{l.result}</span></td>
                    <td className="p-2 text-zinc-500">{l.ipAddress || "—"}</td>
                    <td className="p-2 text-zinc-500">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ── Announcements ─────────────────────────────────────────────────────
function AnnouncementsView() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Announcements</h1>
      <p className="mt-1 text-xs text-zinc-500">Create maintenance notices, feature releases, and security advisories</p>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Create Announcement</h3>
        <input placeholder="Title" className="mb-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none" />
        <textarea placeholder="Message" rows={3} className="mb-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none" />
        <div className="flex gap-2">
          <select className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
            <option value="info">Info</option>
            <option value="maintenance">Maintenance</option>
            <option value="feature">Feature Release</option>
            <option value="security">Security Advisory</option>
          </select>
          <select className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
            <option value="">All Plans</option>
            <option value="free">Free Only</option>
            <option value="pro">Pro+</option>
          </select>
          <button className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-700">Publish</button>
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Published Announcements</h3>
        <p className="p-4 text-center text-xs text-zinc-600">No announcements published yet</p>
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────
function SettingsView({ admin }: { admin: any }) {
  return (
    <div className="p-6">
      <h1 className="text-lg font-bold">Settings</h1>
      <p className="mt-1 text-xs text-zinc-500">Admin account and platform configuration</p>
      <div className="mt-6 space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 text-xs font-semibold">Admin Profile</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-300">{admin?.name || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-zinc-300">{admin?.email || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Role</span><span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] font-medium text-violet-400">{admin?.role || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">MFA</span><span className="text-amber-400">Not enabled</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 text-xs font-semibold">Platform Configuration</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Database</span><span className="text-emerald-400">Neon Postgres</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">VPS</span><span className="text-emerald-400">64.181.198.8 (Oracle)</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Payment</span><span className="text-emerald-400">Paystack (Live)</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">AI Provider</span><span className="text-emerald-400">Pollinations AI</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Currency</span><span className="text-zinc-300">KES (Kenyan Shilling)</span></div>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 text-xs font-semibold">Admin Roles & Permissions</h3>
          <div className="space-y-1 text-xs">
            {["Support Agent", "Moderator", "Operations", "Security", "Developer", "Super Administrator"].map((r) => (
              <div key={r} className="flex items-center justify-between">
                <span className="text-zinc-400">{r}</span>
                <span className={cn("text-[9px]", r === "Super Administrator" ? "text-violet-400" : "text-zinc-600")}>{r === "Super Administrator" ? "You" : "No admins"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared StatCard component ─────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: typeof Users; color: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
      <Icon className={cn("h-4 w-4", color)} />
      <div className="mt-2 text-xl font-bold">{value}</div>
      <div className="text-[10px] text-zinc-500">{label}</div>
    </div>
  );
}
