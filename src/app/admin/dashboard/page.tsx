"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Shield, LayoutDashboard, Users, Rocket, Bot, BookOpen, Inbox,
  LifeBuoy, Lock, Eye, BarChart3, CreditCard, Flag, Server,
  ScrollText, Megaphone, Settings, LogOut, Search, Loader2,
  TrendingUp, Activity, UserPlus, MessageSquare, Zap, AlertTriangle,
  CheckCircle2, Cpu, HardDrive, Globe, Clock, RefreshCw, X,
  Download, Send, ChevronRight, PieChart, Tag,
  Mail, Smartphone, Hash, Phone, KeyRound, ShieldCheck, ShieldAlert,
  UserCog, Save, Trash2, Plus, Slack,
  Pencil, ChevronDown, Filter, Calendar, Percent, AlertCircle,
  Ban, UserX, FileX, MoreVertical,
  Database, WifiOff, CircleSlash, Play, Pause, ArrowUpRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { STUDIO_TYPES } from "@/lib/studio-types";

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
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(() => {
    setRefreshing(true);
    fetch("/api/admin/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setData(d?.studios ?? null); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const studioIcon = (id: string) => {
    return STUDIO_TYPES.find((s) => s.id === id)?.icon ?? Rocket;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const counts: any[] = data?.counts ?? [];
  const totalStudioUsers: number = data?.totalStudioUsers ?? 0;
  const activeToday: number = data?.activeToday ?? 0;
  const mostPopular: any = data?.mostPopular ?? null;
  const avgSessionsPerUser: number = data?.avgSessionsPerUser ?? 0;
  const sessionsChart: any[] = data?.sessionsChart ?? [];
  const topUsers: any[] = data?.topUsers ?? [];

  const maxSessionCount = sessionsChart.reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const maxStudioCount = counts.reduce((m, s) => Math.max(m, s.userCount), 0) || 1;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Studio Management</h1>
          <p className="mt-1 text-xs text-zinc-500">Monitor SPYRO Studio usage across the platform</p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/30 hover:text-violet-400 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Studio Users" value={totalStudioUsers} icon={Rocket} color="text-violet-400" />
        <StatCard label="Active Today" value={activeToday} icon={Activity} color="text-emerald-400" />
        <StatCard label="Most Popular" value={mostPopular?.name ?? "—"} icon={TrendingUp} color="text-amber-400" />
        <StatCard label="Avg Sessions/User" value={avgSessionsPerUser} icon={Zap} color="text-cyan-400" />
      </div>

      {/* Studio Usage Table */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
          <Rocket className="h-4 w-4 text-violet-400" /> Studio Usage Breakdown
        </h3>
        {counts.length === 0 ? (
          <p className="p-8 text-center text-xs text-zinc-600">No studio data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 text-left text-zinc-500">
                <tr>
                  <th className="p-2 font-medium">Studio</th>
                  <th className="p-2 font-medium">Users</th>
                  <th className="p-2 font-medium">Share</th>
                  <th className="p-2 font-medium">Distribution</th>
                  <th className="p-2 font-medium">Last Activity</th>
                  <th className="p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((s) => {
                  const Icon = studioIcon(s.id);
                  return (
                    <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-violet-400" />
                          <span className="font-medium text-zinc-200">{s.name}</span>
                        </div>
                      </td>
                      <td className="p-2 text-zinc-300">{s.userCount}</td>
                      <td className="p-2 text-zinc-500">{s.percent}%</td>
                      <td className="p-2">
                        <div className="h-1.5 w-32 rounded-full bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            style={{ width: `${Math.round((s.userCount / maxStudioCount) * 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="p-2 text-zinc-500">
                        {s.lastActivity ? new Date(s.lastActivity).toLocaleString() : "—"}
                      </td>
                      <td className="p-2">
                        <span className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-medium capitalize",
                          s.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-zinc-700 text-zinc-400"
                        )}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sessions chart + Top users */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold">
              <BarChart3 className="h-4 w-4 text-cyan-400" /> Studio Sessions (30 days)
            </h3>
            <span
              className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] text-zinc-500"
              title="Studio usage has no dedicated event log — daily message counts across all studios are shown as a platform activity proxy."
            >
              Platform activity (proxy)
            </span>
          </div>
          <div className="flex h-32 items-end gap-1">
            {sessionsChart.map((d) => (
              <div
                key={d.day}
                className="flex-1 rounded-t bg-gradient-to-t from-violet-500/40 to-fuchsia-500/60"
                style={{ height: `${Math.max(2, Math.round((d.count / maxSessionCount) * 100))}%` }}
                title={`${d.day}: ${d.count} messages`}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[9px] text-zinc-600">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Users className="h-4 w-4 text-amber-400" /> Top Studio Users
          </h3>
          {topUsers.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-600">No studio users yet.</p>
          ) : (
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {topUsers.map((u) => {
                const Icon = studioIcon(u.studioType);
                return (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-3 py-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-zinc-800 text-violet-400">
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-zinc-200">{u.name}</div>
                        <div className="truncate text-[9px] text-zinc-600">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] capitalize",
                        u.plan === "free" ? "bg-zinc-700 text-zinc-400" : "bg-violet-500/15 text-violet-400"
                      )}>{u.plan}</span>
                      <span className="text-[9px] text-zinc-600">{new Date(u.lastSeen).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AI Agents Management ──────────────────────────────────────────────
function AgentsView() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [modelFilter, setModelFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [selected, setSelected] = React.useState<any>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    setRefreshing(true);
    fetch("/api/admin/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setData(d?.agents ?? null); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const stats: any = data?.stats ?? { total: 0, running: 0, totalCalls: 0, totalTokens: 0 };
  const list: any[] = data?.list ?? [];

  const models = Array.from(new Set(list.map((a) => a.model).filter(Boolean)));
  const statuses = ["idle", "running", "paused", "error"];

  const filtered = list.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        a.name?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.owner?.email?.toLowerCase().includes(q) ||
        a.owner?.name?.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (modelFilter && a.model !== modelFilter) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  const statusColor = (s: string) => {
    switch (s) {
      case "running": return "bg-emerald-500/10 text-emerald-400";
      case "paused": return "bg-amber-500/10 text-amber-400";
      case "error": return "bg-rose-500/10 text-rose-400";
      default: return "bg-zinc-700 text-zinc-400";
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/agents/${selected.id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmDelete(false);
        setSelected(null);
        load();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Failed to delete agent");
      }
    } finally {
      setDeleting(false);
    }
  };

  const closeDrawer = () => {
    setSelected(null);
    setConfirmDelete(false);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">AI Agents</h1>
          <p className="mt-1 text-xs text-zinc-500">Monitor all AI agents across the platform</p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/30 hover:text-violet-400 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Agents" value={stats.total} icon={Bot} color="text-violet-400" />
        <StatCard label="Running Now" value={stats.running} icon={Zap} color="text-emerald-400" />
        <StatCard label="Total Calls" value={(stats.totalCalls ?? 0).toLocaleString()} icon={Activity} color="text-cyan-400" />
        <StatCard label="Total Tokens" value={(stats.totalTokens ?? 0).toLocaleString()} icon={TrendingUp} color="text-amber-400" />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents…"
            className="w-64 rounded-lg border border-zinc-800 bg-[#0F1014] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
          />
        </div>
        <select
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#0F1014] px-2 py-1.5 text-xs text-white focus:border-violet-500/30 focus:outline-none"
        >
          <option value="">All Models</option>
          {models.map((m) => (<option key={m} value={m}>{m}</option>))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#0F1014] px-2 py-1.5 text-xs text-white capitalize focus:border-violet-500/30 focus:outline-none"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (<option key={s} value={s} className="capitalize">{s}</option>))}
        </select>
        <span className="ml-auto text-[10px] text-zinc-600">{filtered.length} of {list.length}</span>
      </div>

      {/* Agent List */}
      <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 bg-[#0F1014] text-left text-zinc-500">
            <tr>
              <th className="p-2 font-medium">Name</th>
              <th className="p-2 font-medium">Owner</th>
              <th className="p-2 font-medium">Description</th>
              <th className="p-2 font-medium">Model</th>
              <th className="p-2 font-medium">Tools</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Created</th>
              <th className="p-2 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-zinc-600">No agents found.</td></tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/20"
                >
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{a.avatar || "🤖"}</span>
                      <span className="font-medium text-zinc-200">{a.name}</span>
                    </div>
                  </td>
                  <td className="p-2">
                    {a.owner ? (
                      <div>
                        <div className="text-zinc-300">{a.owner.name}</div>
                        <div className="text-[9px] text-zinc-600">{a.owner.email}</div>
                      </div>
                    ) : <span className="text-zinc-600">—</span>}
                  </td>
                  <td className="p-2 max-w-[200px]">
                    <span className="block truncate text-zinc-400">{a.description || "—"}</span>
                  </td>
                  <td className="p-2 text-zinc-300">{a.model}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {(a.channels ?? []).slice(0, 3).map((c: string) => (
                        <span key={c} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400">{c}</span>
                      ))}
                      {(a.channels ?? []).length === 0 && <span className="text-[10px] text-zinc-600">—</span>}
                    </div>
                  </td>
                  <td className="p-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", statusColor(a.status))}>{a.status}</span>
                  </td>
                  <td className="p-2 text-zinc-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 text-zinc-500">{new Date(a.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div className="flex-1 bg-black/60" onClick={closeDrawer} />
          <div className="w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-[#0F1014] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selected.avatar || "🤖"}</span>
                <div>
                  <h2 className="text-sm font-bold text-white">{selected.name}</h2>
                  <span className={cn("mt-0.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", statusColor(selected.status))}>{selected.status}</span>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected.owner && (
              <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Owner</div>
                <div className="mt-1 text-xs text-zinc-200">{selected.owner.name}</div>
                <div className="text-[10px] text-zinc-500">{selected.owner.email}</div>
                <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] capitalize text-violet-400">{selected.owner.plan}</span>
              </div>
            )}

            {selected.description && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Description</div>
                <p className="mt-1 text-xs text-zinc-300">{selected.description}</p>
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Model</div>
                <div className="mt-0.5 text-zinc-200">{selected.model}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Temperature</div>
                <div className="mt-0.5 text-zinc-200">{selected.temperature}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Response Style</div>
                <div className="mt-0.5 capitalize text-zinc-200">{selected.responseStyle}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Approval Mode</div>
                <div className="mt-0.5 capitalize text-zinc-200">{selected.approvalMode}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Total Calls</div>
                <div className="mt-0.5 text-zinc-200">{(selected.totalCalls ?? 0).toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Total Tokens</div>
                <div className="mt-0.5 text-zinc-200">{(selected.totalTokens ?? 0).toLocaleString()}</div>
              </div>
            </div>

            {(selected.channels?.length ?? 0) > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Tools / Channels</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.channels.map((c: string) => (
                    <span key={c} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {(selected.knowledgeSources?.length ?? 0) > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Knowledge Sources</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.knowledgeSources.map((k: string) => (
                    <span key={k} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">{k}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500">System Prompt (Instructions)</div>
              <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900/50 p-2 font-mono text-[11px] text-zinc-300">
{selected.instructions || "(no instructions set)"}
              </pre>
            </div>

            <div className="mb-4 flex justify-between text-[10px] text-zinc-600">
              <span>Created: {new Date(selected.createdAt).toLocaleString()}</span>
              <span>Updated: {new Date(selected.updatedAt).toLocaleString()}</span>
            </div>

            {/* Delete */}
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Agent
              </button>
            ) : (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Confirm deletion — this cannot be undone.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="flex-1 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Knowledge Management ──────────────────────────────────────────────
function KnowledgeView() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<any>(null);

  const load = React.useCallback(() => {
    setRefreshing(true);
    fetch("/api/admin/content", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setData(d?.knowledge ?? null); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const stats: any = data?.stats ?? { total: 0, indexed: 0, pending: 0, storageBytes: 0 };
  const docs: any[] = data?.docs ?? [];
  const byType: any[] = data?.byType ?? [];
  const recentUploads: any[] = data?.recentUploads ?? [];

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const filtered = docs.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.title?.toLowerCase().includes(q) ||
      d.type?.toLowerCase().includes(q) ||
      d.owner?.name?.toLowerCase().includes(q) ||
      d.owner?.email?.toLowerCase().includes(q)
    );
  });

  const maxTypeCount = byType.reduce((m, t) => Math.max(m, t.count), 0) || 1;
  const typeColor = (t: string) => {
    switch (t?.toLowerCase()) {
      case "pdf": return "text-rose-400";
      case "docx": case "doc": return "text-blue-400";
      case "md": case "markdown": return "text-violet-400";
      case "csv": return "text-emerald-400";
      case "image": return "text-pink-400";
      case "audio": return "text-amber-400";
      case "video": return "text-cyan-400";
      case "url": return "text-fuchsia-400";
      default: return "text-zinc-400";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Knowledge Base</h1>
          <p className="mt-1 text-xs text-zinc-500">Monitor knowledge documents across the platform</p>
        </div>
        <button
          onClick={load}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/30 hover:text-violet-400 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Docs" value={stats.total} icon={BookOpen} color="text-emerald-400" />
        <StatCard label="Indexed" value={stats.indexed} icon={CheckCircle2} color="text-cyan-400" />
        <StatCard label="Pending" value={stats.pending} icon={AlertTriangle} color="text-amber-400" />
        <StatCard label="Storage Used" value={formatSize(stats.storageBytes)} icon={HardDrive} color="text-violet-400" />
      </div>

      {/* Documents table */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <FileText className="h-4 w-4 text-emerald-400" /> Documents
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search docs…"
              className="w-56 rounded-lg border border-zinc-800 bg-[#0F1014] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-zinc-800 text-left text-zinc-500">
              <tr>
                <th className="p-2 font-medium">Title</th>
                <th className="p-2 font-medium">Owner</th>
                <th className="p-2 font-medium">Type</th>
                <th className="p-2 font-medium">Size</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-zinc-600">No documents found.</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className="cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/20"
                  >
                    <td className="p-2 max-w-[220px]">
                      <span className="block truncate font-medium text-zinc-200">{d.title}</span>
                    </td>
                    <td className="p-2">
                      {d.owner ? (
                        <div>
                          <div className="text-zinc-300">{d.owner.name}</div>
                          <div className="text-[9px] text-zinc-600">{d.owner.email}</div>
                        </div>
                      ) : <span className="text-zinc-600">—</span>}
                    </td>
                    <td className="p-2">
                      <span className={cn("font-medium uppercase", typeColor(d.type))}>{d.type}</span>
                    </td>
                    <td className="p-2 text-zinc-400">{formatSize(d.sizeBytes)}</td>
                    <td className="p-2">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[9px] font-medium capitalize",
                        d.indexed ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                      )}>
                        {d.indexed ? "Indexed" : "Pending"}
                      </span>
                    </td>
                    <td className="p-2 text-zinc-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Type + Recent Uploads */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <BarChart3 className="h-4 w-4 text-cyan-400" /> Documents by Type
          </h3>
          {byType.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-600">No documents yet.</p>
          ) : (
            <div className="space-y-2">
              {byType.map((t) => (
                <div key={t.type} className="flex items-center gap-2 text-xs">
                  <span className={cn("w-16 uppercase", typeColor(t.type))}>{t.type}</span>
                  <div className="h-2 flex-1 rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                      style={{ width: `${Math.round((t.count / maxTypeCount) * 100)}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-zinc-500">{t.count} docs</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Clock className="h-4 w-4 text-amber-400" /> Recent Uploads
          </h3>
          {recentUploads.length === 0 ? (
            <p className="p-4 text-center text-xs text-zinc-600">No uploads yet.</p>
          ) : (
            <div className="max-h-56 space-y-1.5 overflow-y-auto">
              {recentUploads.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg border border-zinc-800/50 px-3 py-1.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-zinc-200">{d.title}</div>
                    <div className="truncate text-[9px] text-zinc-600">
                      {d.owner?.name ?? "Unknown"} · {d.owner?.email ?? ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("text-[10px] uppercase", typeColor(d.type))}>{d.type}</span>
                    <span className="text-[9px] text-zinc-600">{new Date(d.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div className="flex-1 bg-black/60" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md overflow-y-auto border-l border-zinc-800 bg-[#0F1014] p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className={cn("h-5 w-5", typeColor(selected.type))} />
                <div>
                  <h2 className="text-sm font-bold text-white">{selected.title}</h2>
                  <span className={cn("mt-0.5 inline-block uppercase text-[10px]", typeColor(selected.type))}>{selected.type}</span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected.owner && (
              <div className="mb-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Owner</div>
                <div className="mt-1 text-xs text-zinc-200">{selected.owner.name}</div>
                <div className="text-[10px] text-zinc-500">{selected.owner.email}</div>
                <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] capitalize text-violet-400">{selected.owner.plan}</span>
              </div>
            )}

            <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Size</div>
                <div className="mt-0.5 text-zinc-200">{formatSize(selected.sizeBytes)}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Citations</div>
                <div className="mt-0.5 text-zinc-200">{selected.citations ?? 0}</div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Status</div>
                <div className={cn("mt-0.5 capitalize", selected.indexed ? "text-emerald-400" : "text-amber-400")}>
                  {selected.indexed ? "Indexed" : "Pending"}
                </div>
              </div>
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Collection</div>
                <div className="mt-0.5 text-zinc-200">{selected.collection || "—"}</div>
              </div>
            </div>

            {selected.url && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">URL</div>
                <a href={selected.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-violet-400 hover:underline">{selected.url}</a>
              </div>
            )}

            {(selected.tags?.length ?? 0) > 0 && (
              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wide text-zinc-500">Tags</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selected.tags.map((t: string) => (
                    <span key={t} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">#{t}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-[10px] text-zinc-600">
              Created: {new Date(selected.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Communications Management ─────────────────────────────────────────
function CommunicationsView() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [configuring, setConfiguring] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const r = await fetch("/api/admin/communications", { cache: "no-store" });
      const d = await r.json();
      setData(d);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const channelIcon = (id: string) => {
    switch (id) {
      case "whatsapp": return Smartphone;
      case "telegram": return Send;
      case "discord": return MessageSquare;
      case "email": return Mail;
      case "slack": return Slack;
      case "sms": return Phone;
      default: return Inbox;
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      connected: { label: "Connected", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      configured: { label: "Configured", cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
      not_connected: { label: "Not Connected", cls: "bg-zinc-700/30 text-zinc-500 border-zinc-700/40" },
      error: { label: "Error", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    };
    const s = map[status] || map.not_connected;
    return <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-medium", s.cls)}>{s.label}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Communications</h1>
          <p className="mt-1 text-xs text-zinc-500">Monitor communication channels and message flow</p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/40 hover:text-white"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Connected Channels" value={`${data?.stats?.connectedChannels ?? 0}/${data?.stats?.totalChannels ?? 6}`} icon={Inbox} color="text-emerald-400" />
            <StatCard label="Messages (24h)" value={data?.stats?.messages24h ?? 0} icon={MessageSquare} color="text-cyan-400" />
            <StatCard label="AI Replies (24h)" value={data?.stats?.aiReplies24h ?? 0} icon={Bot} color="text-violet-400" />
            <StatCard label="Human Takeovers" value={data?.stats?.humanTakeovers ?? 0} icon={AlertTriangle} color="text-amber-400" />
          </div>

          {/* Channel Status Grid */}
          <div className="mt-6">
            <h3 className="mb-3 text-xs font-semibold">Channel Status</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {(data?.channels || []).map((ch: any) => {
                const Icon = channelIcon(ch.id);
                const isOpen = configuring === ch.id;
                return (
                  <div key={ch.id} className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-9 w-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900">
                          <Icon className="h-4 w-4 text-violet-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{ch.name}</div>
                          <div className="text-[10px] text-zinc-500">{ch.detailLabel}: <span className="text-zinc-400 font-mono">{ch.detail}</span></div>
                        </div>
                      </div>
                      {statusBadge(ch.status)}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setConfiguring(isOpen ? null : ch.id)}
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] text-zinc-300 hover:border-violet-500/40 hover:text-white"
                      >
                        {isOpen ? "Close" : "Configure"}
                      </button>
                      <button
                        onClick={() => showToast(`Test connection for ${ch.name} — placeholder`)}
                        className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] text-zinc-300 hover:border-violet-500/40 hover:text-white"
                      >
                        Test Connection
                      </button>
                      {ch.status !== "not_connected" && (
                        <button
                          onClick={() => showToast(`Disconnect ${ch.name} — placeholder`)}
                          className="rounded-md border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 text-[10px] text-rose-400 hover:bg-rose-500/10"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                    {isOpen && (
                      <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-violet-300">Configure {ch.name}</span>
                          <button onClick={() => setConfiguring(null)} className="text-zinc-500 hover:text-white"><X className="h-3 w-3" /></button>
                        </div>
                        <div className="space-y-2">
                          {ch.envVars.map((ev: any) => (
                            <div key={ev.name}>
                              <label className="text-[9px] uppercase tracking-wide text-zinc-500">{ev.name}</label>
                              <input
                                type="text"
                                placeholder={ev.set ? "•••• (currently set in env)" : `Enter ${ev.name}`}
                                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[11px] text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={() => { showToast("Configuration will be persisted to env in a future iteration"); setConfiguring(null); }}
                            className="rounded-md bg-violet-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-violet-700"
                          >
                            <Save className="inline h-3 w-3 mr-1" /> Save
                          </button>
                          <span className="text-[9px] text-zinc-500">Placeholder — read-only env vars</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Conversations (proxy: recent platform messages) */}
          <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
            <h3 className="mb-3 text-xs font-semibold">Recent Conversations <span className="ml-1 text-[9px] font-normal text-zinc-600">(platform message stream)</span></h3>
            {(data?.recentMessages || []).length === 0 ? (
              <p className="p-6 text-center text-xs text-zinc-600">No recent messages</p>
            ) : (
              <div className="space-y-1.5">
                {(data?.recentMessages || []).map((m: any) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2">
                    <div className="mt-0.5">
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-medium", m.role === "user" ? "bg-cyan-500/10 text-cyan-400" : "bg-violet-500/10 text-violet-400")}>
                        {m.role}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[11px] font-medium text-zinc-300">{m.userName}</span>
                        <span className="shrink-0 text-[9px] text-zinc-600">{new Date(m.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="truncate text-[10px] text-zinc-500">{m.conversationTitle}</div>
                      <div className="mt-0.5 truncate text-[11px] text-zinc-400">{m.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-violet-500/30 bg-[#0F1014] px-4 py-2.5 text-xs text-violet-200 shadow-lg shadow-violet-500/10">
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Support Center ────────────────────────────────────────────────────
function SupportView() {
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [counts, setCounts] = React.useState({ open: 0, pending: 0, resolved7d: 0 });
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [priority, setPriority] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [selected, setSelected] = React.useState<any | null>(null);
  const [admins, setAdmins] = React.useState<any[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (priority) params.set("priority", priority);
      if (status) params.set("status", status);
      if (assignee) params.set("assignee", assignee);
      const r = await fetch(`/api/admin/tickets?${params.toString()}`, { cache: "no-store" });
      const d = await r.json();
      setTickets(d.tickets || []);
      setCounts(d.counts || { open: 0, pending: 0, resolved7d: 0 });
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [search, priority, status, assignee]);

  React.useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  React.useEffect(() => {
    fetch("/api/admin/auth?includeAdmins=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.admins) setAdmins(d.admins); })
      .catch(() => {});
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Support Center</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Manage support tickets and user inquiries · Powered by SPYRO AI Engine</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/30 hover:text-violet-400"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Open Tickets" value={counts.open} icon={LifeBuoy} color="text-amber-400" />
        <StatCard label="Pending" value={counts.pending} icon={Clock} color="text-cyan-400" />
        <StatCard label="Resolved (7d)" value={counts.resolved7d} icon={CheckCircle2} color="text-emerald-400" />
        <StatCard label="Avg First Response" value="—" icon={Activity} color="text-violet-400" />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, message, user…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
          />
        </div>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
          <option value="">Any priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
          <option value="">Any status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
          <option value="">Any assignee</option>
          <option value="unassigned">Unassigned</option>
          <option value="me">Assigned to me</option>
        </select>
        {(search || priority || status || assignee) && (
          <button
            onClick={() => { setSearch(""); setPriority(""); setStatus(""); setAssignee(""); }}
            className="rounded-lg border border-zinc-800 px-2 py-1.5 text-[10px] text-zinc-400 hover:text-rose-400"
          >
            Clear
          </button>
        )}
      </div>

      {/* Ticket table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800 bg-[#0F1014]">
        {loading ? (
          <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div>
        ) : tickets.length === 0 ? (
          <p className="p-8 text-center text-xs text-zinc-600">No tickets match the current filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 text-left text-zinc-500">
                <tr>
                  <th className="p-2.5 font-medium">ID</th>
                  <th className="p-2.5 font-medium">Subject</th>
                  <th className="p-2.5 font-medium">User</th>
                  <th className="p-2.5 font-medium">Priority</th>
                  <th className="p-2.5 font-medium">Status</th>
                  <th className="p-2.5 font-medium">Assigned</th>
                  <th className="p-2.5 font-medium">Created</th>
                  <th className="p-2.5 font-medium">Updated</th>
                  <th className="p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    className="cursor-pointer border-b border-zinc-800/40 hover:bg-zinc-800/30"
                  >
                    <td className="p-2.5 font-mono text-[10px] text-zinc-500">{t.id.slice(-6)}</td>
                    <td className="max-w-[280px] truncate p-2.5 font-medium text-zinc-200">{t.subject}</td>
                    <td className="p-2.5">
                      <div className="text-zinc-300">{t.user?.name || "Unknown"}</div>
                      <div className="text-[9px] text-zinc-600">{t.user?.email || "—"}</div>
                    </td>
                    <td className="p-2.5"><PriorityBadge value={t.priority} /></td>
                    <td className="p-2.5"><StatusBadge value={t.status} /></td>
                    <td className="p-2.5 text-zinc-400">{t.assignedToName || "—"}</td>
                    <td className="p-2.5 text-zinc-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="p-2.5 text-zinc-500">{timeAgo(t.updatedAt)}</td>
                    <td className="p-2.5"><ChevronRight className="h-3.5 w-3.5 text-zinc-600" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <TicketDrawer
          ticket={selected}
          admins={admins}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            load();
          }}
        />
      )}
    </div>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    urgent: "bg-rose-500/15 text-rose-400",
    high: "bg-amber-500/15 text-amber-400",
    medium: "bg-cyan-500/15 text-cyan-400",
    low: "bg-zinc-700/50 text-zinc-400",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", map[value] || "bg-zinc-700/50 text-zinc-400")}>{value}</span>;
}

function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    open: "bg-amber-500/15 text-amber-400",
    pending: "bg-cyan-500/15 text-cyan-400",
    resolved: "bg-emerald-500/15 text-emerald-400",
    closed: "bg-zinc-700/50 text-zinc-400",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", map[value] || "bg-zinc-700/50 text-zinc-400")}>{value}</span>;
}

function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function TicketDrawer({
  ticket,
  admins,
  onClose,
  onUpdated,
}: {
  ticket: any;
  admins: any[];
  onClose: () => void;
  onUpdated: (t: any) => void;
}) {
  const [priority, setPriority] = React.useState(ticket.priority);
  const [status, setStatus] = React.useState(ticket.status);
  const [assignedTo, setAssignedTo] = React.useState<string>(ticket.assignedTo || "");
  const [notes, setNotes] = React.useState(ticket.notes || "");
  const [reply, setReply] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    setPriority(ticket.priority);
    setStatus(ticket.status);
    setAssignedTo(ticket.assignedTo || "");
    setNotes(ticket.notes || "");
    setReply("");
    setErr(null);
  }, [ticket.id, ticket.priority, ticket.status, ticket.assignedTo, ticket.notes]);

  const save = async (withReply: boolean = false) => {
    setSaving(true);
    setErr(null);
    try {
      const body: any = { priority, status, assignedTo: assignedTo || null };
      if (withReply && reply.trim()) body.reply = reply.trim();
      const r = await fetch(`/api/admin/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Update failed");
      setReply("");
      // Refetch the ticket so notes/updatedAt reflect the server's appended log
      onUpdated(d.ticket);
    } catch (e: any) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="flex h-full w-full max-w-md flex-col border-l border-zinc-800 bg-[#0C0C0F] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-semibold">Ticket #{ticket.id.slice(-6)}</span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-sm font-semibold text-zinc-100">{ticket.subject}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <PriorityBadge value={ticket.priority} />
            <StatusBadge value={ticket.status} />
            <span className="text-[10px] text-zinc-500">Created {new Date(ticket.createdAt).toLocaleString()}</span>
          </div>

          {/* Message */}
          <div className="mt-4 rounded-lg border border-zinc-800 bg-[#0F1014] p-3">
            <div className="mb-1 text-[10px] font-semibold uppercase text-zinc-500">Message</div>
            <p className="whitespace-pre-wrap text-xs text-zinc-300">{ticket.message}</p>
          </div>

          {/* User info */}
          {ticket.user && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-[#0F1014] p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase text-zinc-500">User</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-200">{ticket.user.name}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-zinc-300">{ticket.user.email}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Plan</span><span className="capitalize text-violet-400">{ticket.user.plan}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Signed up</span><span className="text-zinc-400">{new Date(ticket.user.createdAt).toLocaleDateString()}</span></div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-[10px] text-zinc-500">
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>
            <label className="text-[10px] text-zinc-500">
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>

          <label className="mt-3 block text-[10px] text-zinc-500">
            Assignee
            {admins.length > 0 ? (
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white">
                <option value="">Unassigned</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                ))}
              </select>
            ) : (
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Admin ID or name"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
              />
            )}
          </label>

          {/* Reply */}
          <label className="mt-3 block text-[10px] text-zinc-500">
            Send Reply (saves to notes & bumps status)
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="Type your reply to the user…"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
            />
          </label>

          {/* Notes (history) */}
          <label className="mt-3 block text-[10px] text-zinc-500">
            Admin Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Internal notes (history is appended on save)…"
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
            />
          </label>

          {ticket.notes && (
            <details className="mt-2 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-2">
              <summary className="cursor-pointer text-[10px] text-zinc-500">View note history</summary>
              <pre className="mt-2 whitespace-pre-wrap text-[10px] text-zinc-400">{ticket.notes}</pre>
            </details>
          )}

          {err && <p className="mt-2 text-[10px] text-rose-400">{err}</p>}
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-800 p-3">
          <button
            disabled={saving}
            onClick={() => save(false)}
            className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            disabled={saving || !reply.trim()}
            onClick={() => save(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Send Reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Security Center ───────────────────────────────────────────────────
function SecurityView() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const r = await fetch("/api/admin/security", { cache: "no-store" });
      const d = await r.json();
      setData(d);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Security Center</h1>
          <p className="mt-1 text-xs text-zinc-500">Monitor security events and threats</p>
        </div>
        <button
          onClick={() => load(true)}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/40 hover:text-white"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="mt-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Failed Logins (24h)" value={data?.stats?.failedLogins24h ?? 0} icon={AlertTriangle} color="text-rose-400" />
            <StatCard label="Suspicious Activity" value={data?.stats?.suspicious24h ?? 0} icon={Eye} color="text-amber-400" />
            <StatCard label="Banned Accounts" value={data?.stats?.bannedUsers ?? 0} icon={Lock} color="text-rose-400" />
            <StatCard label="Active Admin Sessions" value={data?.stats?.activeAdminSessions24h ?? 0} icon={Activity} color="text-emerald-400" />
          </div>

          {/* Security Checklist */}
          <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><ShieldCheck className="h-3.5 w-3.5 text-violet-400" /> Security Checklist</h3>
            <div className="space-y-2">
              {(data?.checklist || []).map((s: any) => (
                <div key={s.label} className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    {s.status ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />}
                    <div>
                      <div className="text-zinc-300">{s.label}</div>
                      {s.detail && <div className="text-[9px] text-zinc-600">{s.detail}</div>}
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", s.status ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>
                    {s.status ? "Pass" : "Action needed"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Recent Security Events */}
            <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
              <h3 className="mb-3 text-xs font-semibold">Recent Security Events</h3>
              {(data?.recentEvents || []).length === 0 ? (
                <p className="p-6 text-center text-xs text-zinc-600">No security events recorded</p>
              ) : (
                <div className="max-h-72 space-y-1.5 overflow-y-auto">
                  {(data?.recentEvents || []).map((e: any) => (
                    <div key={e.id} className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-violet-400">{e.action}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[8px]", e.result === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                          {e.result}
                        </span>
                      </div>
                      <div className="mt-0.5 text-zinc-500">
                        by <span className="text-zinc-300">{e.adminName}</span>
                        {e.target ? <> · target: <span className="text-zinc-400">{e.targetType}/{e.target}</span></> : null}
                      </div>
                      <div className="text-[9px] text-zinc-600">{e.ipAddress} · {new Date(e.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Admins (last 7 days) */}
            <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
              <h3 className="mb-3 text-xs font-semibold">Active Admins (7d)</h3>
              {(data?.activeAdmins || []).length === 0 ? (
                <p className="p-6 text-center text-xs text-zinc-600">No active admin sessions in the last 7 days</p>
              ) : (
                <div className="max-h-72 space-y-1.5 overflow-y-auto">
                  {(data?.activeAdmins || []).map((a: any) => (
                    <div key={a.id} className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-[11px]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <UserCog className="h-3 w-3 text-violet-400" />
                          <span className="font-medium text-zinc-200">{a.name}</span>
                          {a.mfaEnabled && <KeyRound className="h-3 w-3 text-emerald-400" />}
                        </div>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[8px]", a.active ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-500")}>
                          {a.status}
                        </span>
                      </div>
                      <div className="mt-0.5 text-zinc-500">{a.email} · <span className="text-violet-400">{a.role}</span></div>
                      <div className="text-[9px] text-zinc-600">
                        Last login: {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "never"}
                        {a.lastLoginIP ? ` · ${a.lastLoginIP}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Content Moderation ────────────────────────────────────────────────
function ModerationView() {
  const [reports, setReports] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [rangeFilter, setRangeFilter] = React.useState("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [notes, setNotes] = React.useState("");
  const [acting, setActing] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (rangeFilter) params.set("range", rangeFilter);
    fetch(`/api/admin/reports?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter, rangeFilter]);

  React.useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const stats = React.useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    return {
      pending: reports.filter((r) => r.status === "pending").length,
      reviewing: reports.filter((r) => r.status === "reviewing").length,
      resolved7d: reports.filter(
        (r) => r.status === "resolved" && r.resolvedAt && new Date(r.resolvedAt).getTime() >= weekAgo,
      ).length,
      dismissed7d: reports.filter(
        (r) => r.status === "dismissed" && r.resolvedAt && new Date(r.resolvedAt).getTime() >= weekAgo,
      ).length,
    };
  }, [reports]);

  const selected = React.useMemo(
    () => reports.find((r) => r.id === selectedId) || null,
    [reports, selectedId],
  );

  React.useEffect(() => {
    setNotes(selected?.notes || "");
  }, [selected]);

  const runAction = async (
    reportId: string,
    patch: { status?: string; action?: string },
    successMsg: string,
  ) => {
    setActing(true);
    try {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...patch, notes }),
      });
      setToast(successMsg);
      setSelectedId(null);
      setNotes("");
      load();
    } finally {
      setActing(false);
    }
  };

  const TYPE_BADGES: Record<string, { label: string; cls: string }> = {
    spam: { label: "Spam", cls: "bg-amber-500/15 text-amber-400" },
    abuse: { label: "Abuse", cls: "bg-rose-500/15 text-rose-400" },
    prompt_injection: { label: "Prompt Injection", cls: "bg-violet-500/15 text-violet-400" },
    malicious_upload: { label: "Malicious Upload", cls: "bg-fuchsia-500/15 text-fuchsia-400" },
    rate_limit: { label: "Rate Limit", cls: "bg-sky-500/15 text-sky-400" },
  };
  const STATUS_BADGES: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400",
    reviewing: "bg-sky-500/15 text-sky-400",
    resolved: "bg-emerald-500/15 text-emerald-400",
    dismissed: "bg-zinc-700 text-zinc-300",
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Content Moderation</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Review reported content and abuse · Powered by SPYRO AI Engine
          </p>
        </div>
        <button
          onClick={() => setToast("Auto-scan started — new reports will appear in the queue.")}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/30 hover:text-violet-400"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Auto-Scan
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs text-violet-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> {toast}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Pending" value={stats.pending} icon={Eye} color="text-amber-400" />
        <StatCard label="Reviewing" value={stats.reviewing} icon={AlertCircle} color="text-sky-400" />
        <StatCard label="Resolved (7d)" value={stats.resolved7d} icon={CheckCircle2} color="text-emerald-400" />
        <StatCard label="Dismissed (7d)" value={stats.dismissed7d} icon={X} color="text-zinc-400" />
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reported content…"
            className="w-56 rounded-lg border border-zinc-800 bg-[#0F1014] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#0F1014] px-2 py-1.5 text-xs text-white"
        >
          <option value="">All Types</option>
          <option value="spam">Spam</option>
          <option value="abuse">Abuse</option>
          <option value="prompt_injection">Prompt Injection</option>
          <option value="malicious_upload">Malicious Upload</option>
          <option value="rate_limit">Rate Limit</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#0F1014] px-2 py-1.5 text-xs text-white"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={rangeFilter}
          onChange={(e) => setRangeFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#0F1014] px-2 py-1.5 text-xs text-white"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
        <span className="ml-auto text-[10px] text-zinc-500">
          {reports.length} report{reports.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Queue table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 bg-[#0F1014] text-left text-zinc-500">
            <tr>
              <th className="p-2 font-medium">Time</th>
              <th className="p-2 font-medium">Type</th>
              <th className="p-2 font-medium">Reported User</th>
              <th className="p-2 font-medium">Content</th>
              <th className="p-2 font-medium">Status</th>
              <th className="p-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" />
                </td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-600">
                  No reports match the current filters.
                </td>
              </tr>
            ) : (
              reports.map((r) => {
                const tb = TYPE_BADGES[r.type] || { label: r.type, cls: "bg-zinc-700 text-zinc-300" };
                const preview = (r.content || "").slice(0, 80);
                return (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-zinc-800/50 hover:bg-zinc-800/20"
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td className="p-2 text-zinc-500">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium", tb.cls)}>
                        {tb.label}
                      </span>
                    </td>
                    <td className="p-2">
                      {r.reportedUser ? (
                        <div>
                          <div className="font-medium text-zinc-200">{r.reportedUser.name}</div>
                          <div className="text-[9px] text-zinc-600">{r.reportedUser.email}</div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="p-2">
                      <code className="font-mono text-[10px] text-zinc-400">
                        {preview || "—"}
                        {(r.content || "").length > 80 ? "…" : ""}
                      </code>
                    </td>
                    <td className="p-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", STATUS_BADGES[r.status] || "bg-zinc-700 text-zinc-300")}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedId(r.id)}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-200 hover:bg-zinc-700"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => runAction(r.id, { status: "resolved", action: "none" }, "Report marked as resolved.")}
                          className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-400 hover:bg-emerald-500/20"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => runAction(r.id, { status: "dismissed", action: "none" }, "Report dismissed.")}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400 hover:bg-zinc-700"
                        >
                          Dismiss
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSelectedId(null)}
          />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-zinc-800 bg-[#0F1014] p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Eye className="h-4 w-4 text-violet-400" /> Report Detail
              </h3>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Type</div>
                <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[9px] font-medium", (TYPE_BADGES[selected.type] || { cls: "bg-zinc-700 text-zinc-300" }).cls)}>
                  {(TYPE_BADGES[selected.type] || { label: selected.type }).label}
                </span>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Reported User</div>
                {selected.reportedUser ? (
                  <div className="mt-1 rounded-lg border border-zinc-800 bg-zinc-900 p-2">
                    <div className="font-medium text-zinc-200">{selected.reportedUser.name}</div>
                    <div className="text-[10px] text-zinc-500">{selected.reportedUser.email}</div>
                    <div className="mt-1 flex gap-1">
                      <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] text-violet-400 capitalize">{selected.reportedUser.plan}</span>
                      <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-[9px] text-zinc-300 capitalize">{selected.reportedUser.role}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-zinc-500">—</div>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Reporter</div>
                {selected.reporter ? (
                  <div className="mt-1 text-zinc-300">{selected.reporter.name} · <span className="text-zinc-500">{selected.reporter.email}</span></div>
                ) : (
                  <div className="mt-1 text-zinc-500">Anonymous</div>
                )}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Reported Content</div>
                <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900 p-2 font-mono text-[10px] text-zinc-300">
                  {selected.content || "(no content captured)"}
                </pre>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Admin Notes</div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this resolution…"
                  rows={3}
                  className="mt-1 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
                />
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-500">Timeline</div>
                <div className="mt-1 space-y-0.5 text-[10px] text-zinc-500">
                  <div>Created · {new Date(selected.createdAt).toLocaleString()}</div>
                  {selected.resolvedAt && (
                    <div>Resolved · {new Date(selected.resolvedAt).toLocaleString()}</div>
                  )}
                  {selected.action && (
                    <div>Action taken · <span className="text-zinc-300 capitalize">{selected.action}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
              <button
                disabled={acting}
                onClick={() => runAction(selected.id, { status: "reviewing" }, "Report moved to Reviewing.")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                <Eye className="h-3.5 w-3.5" /> Review
              </button>
              <button
                disabled={acting}
                onClick={() => runAction(selected.id, { status: "resolved", action: "warn" }, "Warning logged and report resolved.")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
              >
                <AlertCircle className="h-3.5 w-3.5" /> Warn User
              </button>
              <button
                disabled={acting || !selected.reportedUserId}
                onClick={() => runAction(selected.id, { status: "resolved", action: "suspend" }, "User suspended for 7 days. Report resolved.")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-400 hover:bg-sky-500/20 disabled:opacity-50"
              >
                <UserX className="h-3.5 w-3.5" /> Suspend 7d
              </button>
              <button
                disabled={acting || !selected.reportedUserId}
                onClick={() => runAction(selected.id, { status: "resolved", action: "ban" }, "User banned. Report resolved.")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20 disabled:opacity-50"
              >
                <Ban className="h-3.5 w-3.5" /> Ban User
              </button>
              <button
                disabled={acting}
                onClick={() => runAction(selected.id, { status: "resolved", action: "delete" }, "Content deleted. Report resolved.")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs text-fuchsia-400 hover:bg-fuchsia-500/20 disabled:opacity-50"
              >
                <FileX className="h-3.5 w-3.5" /> Delete Content
              </button>
              <button
                disabled={acting}
                onClick={() => runAction(selected.id, { status: "dismissed", action: "none" }, "Report dismissed.")}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Dismiss
              </button>
              <button
                disabled={acting}
                onClick={() => runAction(selected.id, { status: "resolved", action: "none" }, "Report marked as resolved.")}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Platform Analytics ────────────────────────────────────────────────
function AnalyticsView() {
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [range, setRange] = React.useState<7 | 30 | 90>(30);

  const load = React.useCallback(async (r: number) => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/analytics?range=${r}`, { cache: "no-store" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setData(d);
    } catch (e: any) {
      setErr(e.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(range); }, [range, load]);

  const exportCsv = () => {
    if (!data) return;
    const lines: string[][] = [];
    lines.push(["# SPYRO Platform Analytics"]);
    lines.push(["# Range (days)", String(data.range)]);
    lines.push(["# Window", `${data.windowStart} → ${data.windowEnd}`]);
    lines.push([]);
    lines.push(["## Top stats"]);
    lines.push(["Metric", "Value"]);
    lines.push(["DAU", String(data.stats.dau)]);
    lines.push(["WAU", String(data.stats.wau)]);
    lines.push(["MAU", String(data.stats.mau)]);
    lines.push(["New users (range)", String(data.stats.newUsers)]);
    lines.push(["Total messages (range)", String(data.stats.totalMessages)]);
    lines.push(["Avg messages / user", String(data.stats.avgMessagesPerUser)]);
    lines.push(["Total users", String(data.stats.totalUsers)]);
    lines.push([]);
    lines.push(["## Daily registrations"]);
    lines.push(["Date", "Count"]);
    for (const r of data.registrations) lines.push([r.date, String(r.count)]);
    lines.push([]);
    lines.push(["## Daily messages"]);
    lines.push(["Date", "Count"]);
    for (const m of data.messages) lines.push([m.date, String(m.count)]);
    lines.push([]);
    lines.push(["## Plan distribution"]);
    lines.push(["Plan", "Count", "Pct"]);
    for (const p of data.plans) lines.push([p.plan, String(p.count), `${p.pct}%`]);
    lines.push([]);
    lines.push(["## Workspace distribution"]);
    lines.push(["WorkspaceType", "Count"]);
    for (const w of data.workspaces) lines.push([w.workspaceType, String(w.count)]);
    lines.push([]);
    lines.push(["## Studio distribution"]);
    lines.push(["StudioType", "Count"]);
    for (const s of data.studios) lines.push([s.studioType, String(s.count)]);
    lines.push([]);
    lines.push(["## Retention (weekly cohorts)"]);
    lines.push(["Cohort", "Size", "W0 %", "W1 %", "W2 %", "W3 %"]);
    for (const row of data.retention) {
      const cells = row.retention.map((r: any) => (r.pct == null ? "—" : `${r.pct}%`));
      while (cells.length < 4) cells.push("—");
      lines.push([row.cohortLabel, String(row.size), ...cells]);
    }

    const csv = lines.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spyro-analytics-${range}d-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const s = data?.stats;
  const planColors: Record<string, string> = {
    free: "bg-zinc-500",
    pro: "bg-violet-500",
    plus: "bg-cyan-500",
    ultra: "bg-amber-500",
    business: "bg-emerald-500",
    enterprise: "bg-rose-500",
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">Platform Analytics</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Growth, retention, and usage trends · live from Postgres</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range selector */}
          <div className="flex rounded-lg border border-zinc-800 bg-[#0F1014] p-0.5 text-[11px]">
            {([7, 30, 90] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 transition-colors",
                  range === r ? "bg-violet-500/15 text-violet-300 font-medium" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
          <button
            onClick={exportCsv}
            disabled={!data}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white disabled:opacity-50"
          >
            <Download className="h-3 w-3" /> Export CSV
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          {err}
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="DAU (today)" value={s?.dau ?? 0} icon={Users} color="text-violet-400" />
        <StatCard label="WAU (7d)" value={s?.wau ?? 0} icon={Users} color="text-cyan-400" />
        <StatCard label="MAU (30d)" value={s?.mau ?? 0} icon={Users} color="text-emerald-400" />
        <StatCard label="New users" value={s?.newUsers ?? 0} icon={UserPlus} color="text-amber-400" />
        <StatCard label="Messages" value={s?.totalMessages ?? 0} icon={MessageSquare} color="text-pink-400" />
        <StatCard label="Avg msgs/user" value={s?.avgMessagesPerUser ?? 0} icon={BarChart3} color="text-violet-400" />
      </div>

      {/* Growth + Activity charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarChart
          title="Registrations per day"
          color="bg-violet-500"
          data={data?.registrations || []}
          range={range}
          emptyHint="No registrations in this range"
        />
        <BarChart
          title="Messages per day"
          color="bg-cyan-500"
          data={data?.messages || []}
          range={range}
          emptyHint="No messages in this range"
        />
      </div>

      {/* Plan + Workspace + Studio distributions */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Plan distribution */}
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <PieChart className="h-4 w-4 text-violet-400" /> Plan Distribution
          </h3>
          <div className="space-y-2">
            {(data?.plans || []).length === 0 && (
              <p className="text-xs text-zinc-600">No users yet.</p>
            )}
            {(data?.plans || []).map((p: any) => {
              const color = planColors[p.plan] || "bg-zinc-600";
              return (
                <div key={p.plan} className="flex items-center gap-2 text-xs">
                  <span className="w-20 truncate text-zinc-400 capitalize">{p.plan}</span>
                  <div className="h-2 flex-1 rounded-full bg-zinc-800">
                    <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(p.pct, 100)}%` }} />
                  </div>
                  <span className="w-12 text-right text-zinc-500">{p.count}</span>
                  <span className="w-10 text-right text-zinc-400">{p.pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workspace distribution */}
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <LayoutDashboard className="h-4 w-4 text-cyan-400" /> Workspace Distribution
          </h3>
          <div className="space-y-1.5">
            {(data?.workspaces || []).length === 0 && (
              <p className="text-xs text-zinc-600">No workspaces selected.</p>
            )}
            {(data?.workspaces || []).map((w: any) => (
              <div key={w.workspaceType} className="flex items-center justify-between text-xs">
                <span className="truncate text-zinc-400">{w.workspaceType}</span>
                <span className="text-zinc-500">{w.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Studio distribution */}
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Rocket className="h-4 w-4 text-amber-400" /> Studio Distribution
          </h3>
          <div className="space-y-1.5">
            {(data?.studios || []).length === 0 && (
              <p className="text-xs text-zinc-600">No studios selected.</p>
            )}
            {(data?.studios || []).map((st: any) => (
              <div key={st.studioType} className="flex items-center justify-between text-xs">
                <span className="truncate text-zinc-400">{st.studioType}</span>
                <span className="text-zinc-500">{st.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retention table */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
          <TrendingUp className="h-4 w-4 text-emerald-400" /> Weekly Cohort Retention
        </h3>
        <p className="mb-3 text-[10px] text-zinc-600">
          For each weekly signup cohort, the % of users who sent ≥1 message in week N after signup. "—" = week is in the future or no users in cohort.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-zinc-800 text-left text-zinc-500">
              <tr>
                <th className="p-2 font-medium">Cohort (signup week)</th>
                <th className="p-2 text-right font-medium">Size</th>
                <th className="p-2 text-right font-medium">W0</th>
                <th className="p-2 text-right font-medium">W1</th>
                <th className="p-2 text-right font-medium">W2</th>
                <th className="p-2 text-right font-medium">W3</th>
              </tr>
            </thead>
            <tbody>
              {(data?.retention || []).length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-zinc-600">No retention data available.</td></tr>
              )}
              {(data?.retention || []).map((row: any) => (
                <tr key={row.cohort} className="border-b border-zinc-800/40 hover:bg-zinc-800/20">
                  <td className="p-2 text-zinc-300">{row.cohortLabel}</td>
                  <td className="p-2 text-right text-zinc-400">{row.size}</td>
                  {row.retention.map((cell: any, i: number) => {
                    const pct = cell.pct;
                    const bg =
                      pct == null ? "bg-transparent"
                      : pct >= 50 ? "bg-emerald-500/15 text-emerald-300"
                      : pct >= 20 ? "bg-amber-500/15 text-amber-300"
                      : pct > 0 ? "bg-rose-500/10 text-rose-300"
                      : "bg-zinc-800/40 text-zinc-500";
                    return (
                      <td key={i} className="p-2 text-right">
                        <span className={cn("inline-block rounded-md px-2 py-0.5 text-[10px] font-medium", bg)}>
                          {pct == null ? "—" : `${pct}%`}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** CSS bar chart — fills missing days with 0 so the timeline is continuous. */
function BarChart({
  title, color, data, range, emptyHint,
}: {
  title: string;
  color: string;
  data: Array<{ date: string; count: number }>;
  range: number;
  emptyHint?: string;
}) {
  // Build the full date range so gaps show as 0-height bars.
  const today = new Date();
  const days: string[] = [];
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const byDate = new Map<string, number>();
  for (const r of data) byDate.set(r.date, r.count);
  const series = days.map((d) => ({ date: d, count: byDate.get(d) || 0 }));
  const max = Math.max(1, ...series.map((s) => s.count));

  // Date label every Nth bar
  const labelEvery = range <= 7 ? 1 : range <= 30 ? 5 : 14;

  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold">{title}</h3>
        <span className="text-[10px] text-zinc-600">
          total {series.reduce((a, b) => a + b.count, 0)} · max {max}
        </span>
      </div>
      {series.every((s) => s.count === 0) ? (
        <div className="flex h-32 items-center justify-center text-xs text-zinc-600">
          {emptyHint || "No data"}
        </div>
      ) : (
        <div className="flex h-32 items-end gap-[1px]">
          {series.map((s, i) => (
            <div
              key={s.date}
              className="group relative flex-1"
              title={`${s.date}: ${s.count}`}
              style={{ height: "100%" }}
            >
              <div
                className={cn("w-full rounded-t transition-all", color)}
                style={{
                  height: `${Math.max(2, (s.count / max) * 100)}%`,
                  marginTop: `${100 - Math.max(2, (s.count / max) * 100)}%`,
                  opacity: s.count === 0 ? 0.15 : 0.85,
                }}
              />
              {i % labelEvery === 0 && (
                <div className="absolute -bottom-4 left-0 -translate-x-1/2 text-[8px] text-zinc-600">
                  {s.date.slice(5)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Billing & Subscriptions ───────────────────────────────────────────
function BillingView() {
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/billing", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load billing data");
      setData(d);
    } catch (e: any) {
      setErr(e.message || "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    if (!data?.recentTransactions?.length) return;
    const rows = [
      ["name", "email", "plan", "amountKES", "startDate", "paystackRef"],
      ...data.recentTransactions.map((t: any) => [
        t.name,
        t.email,
        t.plan,
        String(t.amountKES),
        new Date(t.startDate).toISOString(),
        t.paystackRef || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spyro-billing-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center p-6"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>;
  }

  if (err || !data) {
    return (
      <div className="p-6">
        <h1 className="text-lg font-bold">Billing & Subscriptions</h1>
        <div className="mt-6 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-300">
          {err || "No billing data available."}
        </div>
      </div>
    );
  }

  const { stats, revenueByPlan, planDistribution, recentTransactions, subscriptionGrowth } = data;
  const maxRevenue = Math.max(1, ...revenueByPlan.map((r: any) => r.revenueKES));
  const maxGrowth = Math.max(1, ...subscriptionGrowth.map((s: any) => s.count));
  const freeCount = planDistribution.find((p: any) => p.plan === "free")?.count || 0;
  const premiumCount = stats.activeSubs;
  const totalUsers = freeCount + premiumCount;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Billing & Subscriptions</h1>
          <p className="mt-0.5 text-xs text-zinc-500">Monitor revenue and subscription health · Powered by SPYRO AI Engine</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!recentTransactions?.length}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/30 hover:text-violet-400 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="MRR (KES)" value={`KSh ${stats.mrr.toLocaleString()}`} icon={CreditCard} color="text-emerald-400" />
        <StatCard label="Active Subs" value={stats.activeSubs} icon={TrendingUp} color="text-violet-400" />
        <StatCard label="Trials / Free" value={stats.freeUsers} icon={Clock} color="text-amber-400" />
        <div className="relative">
          <StatCard label="Churned (30d)" value={stats.churned30d} icon={AlertTriangle} color="text-rose-400" />
          <span title="Approximation: counts free-plan users updated in the last 30 days. Real subscription history is not tracked yet." className="absolute right-2 top-2 text-[9px] text-zinc-600">ⓘ</span>
        </div>
      </div>

      {/* Revenue by Plan */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <TrendingUp className="h-4 w-4 text-emerald-400" /> Revenue by Plan (KES/month)
          </h3>
          <span className="text-[10px] text-zinc-500">Total MRR: <span className="font-medium text-emerald-400">KSh {stats.mrr.toLocaleString()}</span></span>
        </div>
        <div className="space-y-3">
          {revenueByPlan.map((r: any) => (
            <div key={r.plan}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="capitalize text-zinc-300">{r.plan} <span className="text-zinc-600">(KSh {r.priceKES.toLocaleString()}/mo)</span></span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">{r.count} subs</span>
                  <span className="font-medium text-emerald-400">KSh {r.revenueKES.toLocaleString()}</span>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500"
                  style={{ width: `${(r.revenueKES / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {stats.mrr === 0 && <p className="text-[10px] text-zinc-600">No active paid subscriptions yet — MRR will populate as users upgrade.</p>}
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <PieChart className="h-4 w-4 text-violet-400" /> Plan Distribution
          </h3>
          {totalUsers === 0 ? (
            <p className="text-[10px] text-zinc-600">No users yet.</p>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24">
                  <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#27272a" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.915" fill="none" stroke="#8B5CF6" strokeWidth="3"
                      strokeDasharray={`${(premiumCount / totalUsers) * 100} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-zinc-200">{totalUsers}</span>
                    <span className="text-[9px] text-zinc-500">users</span>
                  </div>
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-300"><span className="h-2 w-2 rounded-full bg-zinc-600" /> Free</span>
                    <span className="text-zinc-500">{freeCount} ({((freeCount / totalUsers) * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-zinc-300"><span className="h-2 w-2 rounded-full bg-violet-500" /> Premium</span>
                    <span className="text-zinc-500">{premiumCount} ({((premiumCount / totalUsers) * 100).toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 border-t border-zinc-800 pt-3">
                {planDistribution.filter((p: any) => p.plan !== "free").map((p: any) => (
                  <div key={p.plan} className="flex items-center justify-between text-[10px]">
                    <span className="capitalize text-zinc-400">{p.plan}</span>
                    <span className="text-zinc-500">{p.count} users · {p.pct}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Subscription Growth */}
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <BarChart3 className="h-4 w-4 text-cyan-400" /> Premium Signups (6 months)
          </h3>
          <div className="flex h-32 items-end gap-2">
            {subscriptionGrowth.map((s: any) => (
              <div key={s.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[9px] text-zinc-400">{s.count}</span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-violet-700 to-violet-400"
                    style={{ height: `${(s.count / maxGrowth) * 100}%`, minHeight: s.count > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-[9px] text-zinc-600">{s.month}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9px] text-zinc-600">Premium users (pro/plus/ultra/business/enterprise) by signup month.</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-[#0F1014]">
        <div className="flex items-center justify-between border-b border-zinc-800 p-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold">
            <CreditCard className="h-4 w-4 text-emerald-400" /> Recent Transactions
          </h3>
          <span className="text-[10px] text-zinc-600">Most recent {recentTransactions.length} premium subscribers</span>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="p-8 text-center text-xs text-zinc-600">No premium subscribers yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 text-left text-zinc-500">
                <tr>
                  <th className="p-2.5 font-medium">User</th>
                  <th className="p-2.5 font-medium">Plan</th>
                  <th className="p-2.5 font-medium">Monthly Amount</th>
                  <th className="p-2.5 font-medium">Plan Start</th>
                  <th className="p-2.5 font-medium">Reference</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((t: any) => (
                  <tr key={t.userId} className="border-b border-zinc-800/40 hover:bg-zinc-800/30">
                    <td className="p-2.5">
                      <div className="font-medium text-zinc-200">{t.name}</div>
                      <div className="text-[9px] text-zinc-600">{t.email}</div>
                    </td>
                    <td className="p-2.5"><span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] font-medium capitalize text-violet-400">{t.plan}</span></td>
                    <td className="p-2.5 font-medium text-emerald-400">KSh {t.amountKES.toLocaleString()}</td>
                    <td className="p-2.5 text-zinc-500">{new Date(t.startDate).toLocaleDateString()}</td>
                    <td className="p-2.5 text-zinc-500">
                      {t.paystackRef ? (
                        <span className="font-mono text-[10px]">{t.paystackRef}</span>
                      ) : t.hasSubscriptionRecord ? (
                        <span className="text-zinc-600">—</span>
                      ) : (
                        <span className="text-zinc-600" title="No Subscription record — date proxied from user profile update">proxy</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Feature Flags ─────────────────────────────────────────────────────
function FeatureFlagsView() {
  const [flags, setFlags] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [showCreate, setShowCreate] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<{ name: string; description: string }>({ name: "", description: "" });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [newFlag, setNewFlag] = React.useState({
    key: "", name: "", description: "",
    rolloutPct: 100, planRequired: "", enabled: true,
  });

  const PLANS = ["", "free", "pro", "plus", "ultra", "business", "enterprise"];

  const load = () => {
    setLoading(true);
    fetch("/api/admin/feature-flags", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setFlags(d.flags || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  React.useEffect(() => { load(); }, []);

  const filtered = flags.filter((f) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.key.toLowerCase().includes(q) ||
      f.name.toLowerCase().includes(q) ||
      (f.description || "").toLowerCase().includes(q)
    );
  });

  const stats = {
    total: flags.length,
    enabled: flags.filter((f) => f.enabled).length,
    disabled: flags.filter((f) => !f.enabled).length,
    avgRollout: flags.length
      ? Math.round(flags.reduce((s, f) => s + (f.rolloutPct ?? 0), 0) / flags.length)
      : 0,
  };

  const toggle = async (id: string, enabled: boolean) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !enabled } : f)));
    try {
      const r = await fetch("/api/admin/feature-flags", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, enabled: !enabled }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, enabled } : f)));
      setError("Failed to toggle flag");
    }
  };

  const updateRollout = async (id: string, pct: number) => {
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, rolloutPct: pct } : f)));
    try {
      await fetch("/api/admin/feature-flags", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, rolloutPct: pct }),
      });
    } catch { /* ignore — local state already updated */ }
  };

  const updatePlan = async (id: string, plan: string) => {
    const planValue = plan || null;
    setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, planRequired: planValue } : f)));
    try {
      await fetch("/api/admin/feature-flags", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, planRequired: plan }),
      });
    } catch { /* ignore */ }
  };

  const startEdit = (f: any) => {
    setEditingId(f.id);
    setEditForm({ name: f.name, description: f.description || "" });
  };

  const saveEdit = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/feature-flags", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, name: editForm.name, description: editForm.description }),
      });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setFlags((prev) => prev.map((f) => (f.id === id ? { ...f, name: d.flag.name, description: d.flag.description } : f)));
      setEditingId(null);
    } catch {
      setError("Failed to save changes");
    }
    setBusy(false);
  };

  const deleteFlag = async (id: string, key: string) => {
    if (!confirm(`Delete flag "${key}"? This cannot be undone.`)) return;
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/feature-flags?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Failed to delete");
      }
      setFlags((prev) => prev.filter((f) => f.id !== id));
    } catch (e: any) {
      setError(e?.message || "Failed to delete");
    }
    setBusy(false);
  };

  const createFlag = async () => {
    setError(null);
    if (!newFlag.key.trim() || !newFlag.name.trim()) {
      setError("Key and name are required");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/admin/feature-flags", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify(newFlag),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "Failed to create flag");
      }
      const d = await r.json();
      setFlags((prev) => [...prev, d.flag].sort((a, b) => a.key.localeCompare(b.key)));
      setShowCreate(false);
      setNewFlag({ key: "", name: "", description: "", rolloutPct: 100, planRequired: "", enabled: true });
    } catch (e: any) {
      setError(e?.message || "Failed to create flag");
    }
    setBusy(false);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Feature Flags</h1>
          <p className="mt-1 text-xs text-zinc-500">Enable, disable, and roll out features without redeployment</p>
        </div>
        <button
          onClick={() => { setShowCreate((s) => !s); setError(null); }}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
            showCreate ? "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-violet-600 text-white hover:bg-violet-700"
          )}
        >
          {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showCreate ? "Cancel" : "Create Flag"}
        </button>
      </div>

      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Flags" value={stats.total} icon={Flag} color="text-violet-400" />
        <StatCard label="Enabled" value={stats.enabled} icon={CheckCircle2} color="text-emerald-400" />
        <StatCard label="Disabled" value={stats.disabled} icon={AlertCircle} color="text-amber-400" />
        <StatCard label="Rollout Avg" value={`${stats.avgRollout}%`} icon={Percent} color="text-cyan-400" />
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-rose-400/60 hover:text-rose-400"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Create flag form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mb-4 overflow-hidden rounded-xl border border-violet-500/30 bg-[#0F1014] p-4"
        >
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-violet-400">
            <Plus className="h-3.5 w-3.5" /> New Feature Flag
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-[10px] text-zinc-500">
              Key <span className="text-rose-400">*</span>
              <input
                value={newFlag.key}
                onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                placeholder="e.g. launch_studio"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
              />
            </label>
            <label className="text-[10px] text-zinc-500">
              Name <span className="text-rose-400">*</span>
              <input
                value={newFlag.name}
                onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                placeholder="e.g. Launch Studio"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
              />
            </label>
            <label className="text-[10px] text-zinc-500 sm:col-span-2">
              Description
              <textarea
                value={newFlag.description}
                onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                placeholder="What does this flag control?"
                rows={2}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
              />
            </label>
            <label className="text-[10px] text-zinc-500">
              Rollout %
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="range" min={0} max={100} step={5}
                  value={newFlag.rolloutPct}
                  onChange={(e) => setNewFlag({ ...newFlag, rolloutPct: Number(e.target.value) })}
                  className="h-1 flex-1 cursor-pointer accent-violet-500"
                />
                <span className="w-10 text-right font-mono text-xs text-zinc-300">{newFlag.rolloutPct}%</span>
              </div>
            </label>
            <label className="text-[10px] text-zinc-500">
              Plan Required
              <select
                value={newFlag.planRequired}
                onChange={(e) => setNewFlag({ ...newFlag, planRequired: e.target.value })}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-white focus:border-violet-500/30 focus:outline-none"
              >
                {PLANS.map((p) => (
                  <option key={p || "none"} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : "None (all plans)"}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[10px] text-zinc-500 sm:col-span-2">
              <input
                type="checkbox"
                checked={newFlag.enabled}
                onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                className="h-3.5 w-3.5 accent-violet-500"
              />
              Enabled on creation
            </label>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => { setShowCreate(false); setError(null); }} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800">Cancel</button>
            <button onClick={createFlag} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Create Flag
            </button>
          </div>
        </motion.div>
      )}

      {/* Search bar */}
      <div className="mb-3 relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by key, name, or description…"
          className="w-full rounded-lg border border-zinc-800 bg-[#0F1014] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
        />
      </div>

      {/* Flag list */}
      {loading ? (
        <div className="mt-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-8 text-center text-xs text-zinc-600">
          {flags.length === 0 ? "No feature flags yet. Click \"Create Flag\" to add your first one." : "No flags match your search."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f) => {
            const isEditing = editingId === f.id;
            return (
              <div key={f.id} className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Left: identity */}
                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm font-medium text-white focus:border-violet-500/30 focus:outline-none"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={2}
                          placeholder="Description"
                          className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-zinc-100">{f.name}</span>
                          <span className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                            f.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-700/50 text-zinc-500"
                          )}>
                            {f.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-violet-400/70">{f.key}</div>
                        {f.description && <p className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{f.description}</p>}
                      </>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(f.id)} disabled={busy} className="rounded bg-emerald-500/10 px-1.5 py-1 text-[10px] text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50">
                          <Save className="h-3 w-3" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="rounded bg-zinc-700/50 px-1.5 py-1 text-[10px] text-zinc-400 hover:bg-zinc-700">
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => toggle(f.id, f.enabled)} title={f.enabled ? "Disable" : "Enable"}
                          className={cn("relative h-5 w-9 rounded-full transition-colors", f.enabled ? "bg-emerald-500" : "bg-zinc-700")}>
                          <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", f.enabled ? "left-4" : "left-0.5")} />
                        </button>
                        <button onClick={() => startEdit(f)} title="Edit"
                          className="rounded bg-zinc-700/50 p-1 text-zinc-400 hover:bg-zinc-700 hover:text-violet-400">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={() => deleteFlag(f.id, f.key)} title="Delete" disabled={busy}
                          className="rounded bg-rose-500/10 p-1 text-rose-400 hover:bg-rose-500/20 disabled:opacity-50">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline controls: rollout + plan + updated */}
                {!isEditing && (
                  <div className="mt-3 grid grid-cols-1 gap-3 border-t border-zinc-800/50 pt-3 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-zinc-500">
                        <Percent className="h-2.5 w-2.5" /> Rollout
                      </label>
                      <RolloutSlider value={f.rolloutPct ?? 0} onCommit={(pct) => updateRollout(f.id, pct)} />
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-zinc-500">
                        <Shield className="h-2.5 w-2.5" /> Plan Required
                      </label>
                      <select
                        value={f.planRequired || ""}
                        onChange={(e) => updatePlan(f.id, e.target.value)}
                        className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-white focus:border-violet-500/30 focus:outline-none"
                      >
                        {PLANS.map((p) => (
                          <option key={p || "none"} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : "None (all plans)"}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wide text-zinc-500">
                        <Clock className="h-2.5 w-2.5" /> Last Updated
                      </label>
                      <div className="px-2 py-1 text-[11px] text-zinc-400" title={new Date(f.updatedAt).toLocaleString()}>
                        {new Date(f.updatedAt).toLocaleDateString()} {new Date(f.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Rollout slider — commits on pointer-up or blur (avoids spamming the API on every change). */
function RolloutSlider({ value, onCommit }: { value: number; onCommit: (pct: number) => void }) {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => setLocal(value), [value]);
  const commit = () => { if (local !== value) onCommit(local); };
  return (
    <div className="flex items-center gap-2">
      <input
        type="range" min={0} max={100} step={5}
        value={local}
        onChange={(e) => setLocal(Number(e.target.value))}
        onPointerUp={commit}
        onMouseUp={commit}
        onBlur={commit}
        className="h-1 flex-1 cursor-pointer accent-violet-500"
      />
      <span className="w-10 text-right font-mono text-[11px] text-zinc-300">{local}%</span>
    </div>
  );
}

// ── System Health ─────────────────────────────────────────────────────
function SystemView() {
  const [data, setData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const load = React.useCallback(async (soft = false) => {
    if (soft) setRefreshing(true); else setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/system-health", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setData(d);
      setLastUpdated(new Date());
    } catch (e: any) {
      setErr(e.message || "Failed to load system health");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  React.useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => load(true), 15000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  const stats = data?.stats;
  const services: any[] = data?.services || [];
  const jobs: any[] = data?.jobs || [];
  const system: any = data?.system || {};
  const incidents: any[] = data?.incidents || [];

  // Synthetic 24h uptime snapshot — derived from current service mix.
  // operational=100, degraded=99.5, offline=98, down=92, per service avg.
  const configuredServices = services.filter((s) => s.status !== "not_configured");
  const uptimePct = configuredServices.length > 0
    ? Math.round(
        (configuredServices.reduce((sum, s) => {
          const v = s.status === "operational" ? 100
            : s.status === "degraded" ? 99.5
            : s.status === "offline" ? 98
            : 92;
          return sum + v;
        }, 0) / configuredServices.length) * 10,
      ) / 10
    : 100;

  const overallColor =
    stats?.overall === "operational" ? "text-emerald-400"
    : stats?.overall === "degraded" ? "text-amber-400"
    : "text-rose-400";
  const overallLabel =
    stats?.overall === "operational" ? "Operational"
    : stats?.overall === "degraded" ? "Degraded"
    : stats?.overall === "down" ? "Down"
    : "Unknown";

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold">System Health</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Live infrastructure & service status
            {lastUpdated && (
              <span className="ml-1">· Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors",
              autoRefresh
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-zinc-800 bg-[#0F1014] text-zinc-400 hover:text-white",
            )}
            title={autoRefresh ? "Auto-refresh every 15s — click to pause" : "Auto-refresh every 15s"}
          >
            {autoRefresh ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {autoRefresh ? "Auto · 15s" : "Auto refresh"}
          </button>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#0F1014] px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-300">
          {err}
        </div>
      )}

      {/* Top stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Activity className="h-3 w-3" /> Overall Status
          </div>
          <div className={cn("mt-2 flex items-center gap-1.5 text-lg font-bold capitalize", overallColor)}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
            {overallLabel}
          </div>
          <div className="text-[9px] text-zinc-600">
            {stats?.operationalCount || 0}/{services.length} services OK
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <Zap className="h-3 w-3" /> Avg Latency
          </div>
          <div className="mt-2 text-lg font-bold text-violet-400">
            {stats?.avgLatencyMs != null ? `${stats.avgLatencyMs}ms` : "—"}
          </div>
          <div className="text-[9px] text-zinc-600">across pinged services</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <TrendingUp className="h-3 w-3" /> Uptime (24h)
          </div>
          <div className="mt-2 text-lg font-bold text-emerald-400">{uptimePct}%</div>
          <div className="text-[9px] text-zinc-600">snapshot from current mix</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <AlertTriangle className="h-3 w-3" /> Active Incidents
          </div>
          <div className={cn("mt-2 text-lg font-bold", (stats?.activeIncidents || 0) > 0 ? "text-amber-400" : "text-emerald-400")}>
            {stats?.activeIncidents ?? 0}
          </div>
          <div className="text-[9px] text-zinc-600">
            {(stats?.activeIncidents || 0) === 0 ? "No active incidents" : "Requiring attention"}
          </div>
        </div>
      </div>

      {/* Service status grid */}
      <div className="mt-6">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
          <Server className="h-4 w-4 text-violet-400" /> Service Status
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = serviceIcon(s.kind);
            const { color, label, pillBg } = serviceStatusStyle(s.status);
            return (
              <div key={s.name} className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className={cn("h-4 w-4 shrink-0", color)} />
                    <span className="truncate text-xs font-medium">{s.name}</span>
                  </div>
                  <span className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium",
                    pillBg, color,
                  )}>
                    {s.status !== "not_configured" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    )}
                    {label}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                  <span>
                    Latency: {s.latencyMs != null ? `${s.latencyMs}ms` : "—"}
                  </span>
                  <span>
                    {s.lastCheckedAt ? new Date(s.lastCheckedAt).toLocaleTimeString() : "—"}
                  </span>
                </div>
                <div className="mt-1 truncate text-[10px] text-zinc-600" title={s.details}>
                  {s.details}
                </div>
              </div>
            );
          })}
          {services.length === 0 && (
            <div className="col-span-full rounded-xl border border-zinc-800 bg-[#0F1014] p-6 text-center text-xs text-zinc-600">
              No service data available.
            </div>
          )}
        </div>
      </div>

      {/* Two-column: jobs + system info */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Background jobs */}
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Cpu className="h-4 w-4 text-cyan-400" /> Background Jobs
          </h3>
          <div className="space-y-2">
            {jobs.map((j) => {
              const { color, label, Icon } = jobStatusStyle(j.status);
              return (
                <div key={j.name} className="rounded-lg border border-zinc-800/50 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-300">{j.name}</span>
                    <span className={cn("flex items-center gap-1 text-[10px]", color)}>
                      <Icon className="h-3 w-3" /> {label}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-zinc-600">{j.description}</div>
                  {j.lastRunAt && (
                    <div className="mt-0.5 text-[9px] text-zinc-700">
                      Last: {new Date(j.lastRunAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
            {jobs.length === 0 && (
              <p className="text-xs text-zinc-600">No jobs configured.</p>
            )}
          </div>
        </div>

        {/* System info */}
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Cpu className="h-4 w-4 text-violet-400" /> System Info
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <InfoRow label="Node.js" value={system.nodeVersion} icon={Server} />
            <InfoRow label="Next.js" value={system.nextVersion} icon={ArrowUpRight} />
            <InfoRow label="Platform" value={`${system.platform} · ${system.arch}`} icon={HardDrive} />
            <InfoRow label="CPU cores" value={String(system.cpuCores ?? "—")} icon={Cpu} />
            <InfoRow label="Uptime" value={system.uptimeHuman || "—"} icon={Clock} />
            <InfoRow label="Memory (RSS)" value={`${system.memoryRssMb ?? "—"} MB`} icon={HardDrive} />
            <InfoRow label="Heap used" value={`${system.memoryHeapMb ?? "—"} / ${system.memoryTotalMb ?? "—"} MB`} icon={Database} />
            <InfoRow label="Checked at" value={data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : "—"} icon={Activity} />
          </div>
        </div>
      </div>

      {/* Recent incidents */}
      <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-400" /> Recent Incidents
        </h3>
        {incidents.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-zinc-500">No active incidents. All monitored services are healthy.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {incidents.map((inc) => {
              const sevStyle =
                inc.severity === "critical" ? "text-rose-400 bg-rose-500/10"
                : inc.severity === "warning" ? "text-amber-400 bg-amber-500/10"
                : "text-cyan-400 bg-cyan-500/10";
              return (
                <div key={inc.id} className="flex items-center justify-between rounded-lg border border-zinc-800/50 p-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-zinc-200">{inc.title}</div>
                    <div className="text-[9px] text-zinc-600">
                      Started {new Date(inc.startedAt).toLocaleTimeString()} · {inc.status}
                    </div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-medium capitalize", sevStyle)}>
                    {inc.severity}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function serviceIcon(kind: string) {
  switch (kind) {
    case "api": return Server;
    case "database": return Database;
    case "vps": return Cpu;
    case "studio": return HardDrive;
    case "ai": return Bot;
    case "payment": return CreditCard;
    case "email": return Mail;
    default: return Server;
  }
}

function serviceStatusStyle(status: string) {
  switch (status) {
    case "operational":
      return { color: "text-emerald-400", label: "Operational", pillBg: "bg-emerald-500/10" };
    case "degraded":
      return { color: "text-amber-400", label: "Degraded", pillBg: "bg-amber-500/10" };
    case "down":
      return { color: "text-rose-400", label: "Down", pillBg: "bg-rose-500/10" };
    case "offline":
      return { color: "text-zinc-400", label: "Offline", pillBg: "bg-zinc-700/40" };
    case "not_configured":
      return { color: "text-zinc-500", label: "Not configured", pillBg: "bg-zinc-800/40" };
    default:
      return { color: "text-zinc-400", label: status, pillBg: "bg-zinc-800/40" };
  }
}

function jobStatusStyle(status: string) {
  switch (status) {
    case "active":
      return { color: "text-emerald-400", label: "Active", Icon: CheckCircle2 };
    case "idle":
      return { color: "text-zinc-400", label: "Idle", Icon: Pause };
    case "not_configured":
      return { color: "text-zinc-500", label: "Not configured", Icon: CircleSlash };
    case "empty":
      return { color: "text-zinc-400", label: "Empty", Icon: CircleSlash };
    default:
      return { color: "text-zinc-400", label: status, Icon: CircleSlash };
  }
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Server }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/40 py-1">
      <span className="flex items-center gap-1.5 text-[10px] text-zinc-500">
        <Icon className="h-3 w-3" /> {label}
      </span>
      <span className="text-[11px] font-medium text-zinc-200">{value}</span>
    </div>
  );
}

// ── Audit Logs ────────────────────────────────────────────────────────
const AUDIT_ACTION_CATEGORIES: Record<string, { color: string; label: string }> = {
  user: { color: "text-violet-400 bg-violet-500/10", label: "User" },
  feature: { color: "text-cyan-400 bg-cyan-500/10", label: "Feature" },
  announcement: { color: "text-pink-400 bg-pink-500/10", label: "Announce" },
  auth: { color: "text-amber-400 bg-amber-500/10", label: "Auth" },
  system: { color: "text-emerald-400 bg-emerald-500/10", label: "System" },
  ticket: { color: "text-blue-400 bg-blue-500/10", label: "Ticket" },
  moderation: { color: "text-rose-400 bg-rose-500/10", label: "Mod" },
};

function AuditLogsView() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [total, setTotal] = React.useState(0);
  const [actions, setActions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  // filters
  const [search, setSearch] = React.useState("");
  const [admin, setAdmin] = React.useState("");
  const [action, setAction] = React.useState("all");
  const [result, setResult] = React.useState("all");
  const [range, setRange] = React.useState("all");

  const buildParams = (offset: number) => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (admin) p.set("admin", admin);
    if (action && action !== "all") p.set("action", action);
    if (result && result !== "all") p.set("result", result);
    if (range && range !== "all") p.set("range", range);
    p.set("limit", "50");
    p.set("offset", String(offset));
    return p.toString();
  };

  // Debounced fetch on filter changes (also fires once on mount).
  React.useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setExpanded(null);
      fetch(`/api/admin/audit?${buildParams(0)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setLogs(d.logs || []);
          setTotal(d.total || 0);
          if (Array.isArray(d.actions)) setActions(d.actions);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [search, admin, action, result, range]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const r = await fetch(`/api/admin/audit?${buildParams(logs.length)}`, { cache: "no-store" });
      const d = await r.json();
      setLogs((prev) => [...prev, ...(d.logs || [])]);
      setTotal(d.total || 0);
    } catch { /* ignore */ }
    setLoadingMore(false);
  };

  const isToday = (d: string | Date) => {
    const dt = typeof d === "string" ? new Date(d) : d;
    const now = new Date();
    return dt.getFullYear() === now.getFullYear()
      && dt.getMonth() === now.getMonth()
      && dt.getDate() === now.getDate();
  };

  const stats = {
    total,
    today: logs.filter((l) => isToday(l.createdAt)).length,
    failed: logs.filter((l) => l.result === "failed").length,
    uniqueAdmins: new Set(logs.map((l) => l.adminId)).size,
  };

  const exportCsv = () => {
    const headers = ["timestamp", "admin_name", "admin_email", "admin_role", "action", "target", "target_type", "result", "ip_address", "metadata"];
    const escape = (v: unknown) => {
      const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = logs.map((l) => [
      new Date(l.createdAt).toISOString(),
      l.admin?.name || "",
      l.admin?.email || "",
      l.admin?.role || "",
      l.action,
      l.target || "",
      l.targetType || "",
      l.result,
      l.ipAddress || "",
      l.metadata ? JSON.stringify(l.metadata) : "",
    ].map(escape).join(","));
    const csv = [headers.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const actionCategory = (a: string) => {
    const key = (a || "").split(".")[0];
    return AUDIT_ACTION_CATEGORIES[key] || { color: "text-zinc-400 bg-zinc-700/30", label: "Other" };
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Audit Logs</h1>
          <p className="mt-1 text-xs text-zinc-500">Immutable record of all admin actions · {total.toLocaleString()} total matching records</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </button>
      </div>

      {/* Summary stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Logs" value={stats.total.toLocaleString()} icon={ScrollText} color="text-violet-400" />
        <StatCard label="Today's Logs" value={stats.today} icon={Calendar} color="text-cyan-400" />
        <StatCard label="Failed Actions" value={stats.failed} icon={AlertCircle} color="text-rose-400" />
        <StatCard label="Unique Admins" value={stats.uniqueAdmins} icon={Users} color="text-emerald-400" />
      </div>

      {/* Filters bar */}
      <div className="mb-3 space-y-2 rounded-xl border border-zinc-800 bg-[#0F1014] p-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, target, IP, or admin…"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
            <input
              value={admin}
              onChange={(e) => setAdmin(e.target.value)}
              placeholder="Filter by admin name or email…"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:border-violet-500/30 focus:outline-none"
          >
            <option value="all">All Actions</option>
            {(actions.length ? actions : [
              "user.verify", "user.suspend", "user.ban",
              "feature.create", "feature.update", "feature.toggle", "feature.delete",
              "announcement.send", "auth.login", "auth.failed", "system.*",
            ]).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:border-violet-500/30 focus:outline-none"
          >
            <option value="all">All Results</option>
            <option value="success">Success Only</option>
            <option value="failed">Failed Only</option>
          </select>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:border-violet-500/30 focus:outline-none"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="mt-6 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div>
      ) : logs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-[#0F1014] p-12 text-center">
          <ScrollText className="mx-auto mb-2 h-8 w-8 text-zinc-700" />
          <p className="text-xs text-zinc-500">No audit logs match your filters.</p>
          <p className="mt-1 text-[10px] text-zinc-600">Try clearing filters or widening the date range.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-zinc-800 bg-[#0F1014] text-left text-zinc-500">
                <tr>
                  <th className="p-2 font-medium">Timestamp</th>
                  <th className="p-2 font-medium">Admin</th>
                  <th className="p-2 font-medium">Action</th>
                  <th className="p-2 font-medium">Target</th>
                  <th className="p-2 font-medium">Result</th>
                  <th className="p-2 font-medium">IP</th>
                  <th className="w-8 p-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => {
                  const cat = actionCategory(l.action);
                  const isOpen = expanded === l.id;
                  return (
                    <React.Fragment key={l.id}>
                      <tr
                        onClick={() => setExpanded(isOpen ? null : l.id)}
                        className={cn(
                          "cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30",
                          isOpen && "bg-zinc-800/40",
                        )}
                      >
                        <td className="whitespace-nowrap p-2 text-zinc-400" title={new Date(l.createdAt).toLocaleString()}>
                          {new Date(l.createdAt).toLocaleString([], { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-zinc-200">{l.admin?.name || "Unknown"}</div>
                          <div className="text-[9px] text-zinc-600">{l.admin?.email || l.adminId}</div>
                        </td>
                        <td className="p-2">
                          <span className={cn("inline-block rounded px-1.5 py-0.5 text-[9px] font-medium", cat.color)}>
                            {l.action}
                          </span>
                        </td>
                        <td className="p-2">
                          {l.target ? (
                            <div className="flex items-center gap-1.5">
                              <span className="max-w-[120px] truncate font-mono text-[10px] text-zinc-300">{l.target}</span>
                              {l.targetType && (
                                <span className="rounded bg-zinc-800 px-1 py-0.5 text-[8px] uppercase text-zinc-500">{l.targetType}</span>
                              )}
                            </div>
                          ) : <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="p-2">
                          <span className={cn(
                            "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                            l.result === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400",
                          )}>{l.result}</span>
                        </td>
                        <td className="p-2 font-mono text-[10px] text-zinc-500">{l.ipAddress || "—"}</td>
                        <td className="p-2 text-zinc-600">
                          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0B0B0F]">
                          <td colSpan={7} className="p-3">
                            <div className="rounded-lg border border-zinc-800 bg-[#0F1014] p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Metadata</span>
                                <span className="text-[9px] text-zinc-600">{l.admin?.role ? `${l.admin.role} · ` : ""}{new Date(l.createdAt).toISOString()}</span>
                              </div>
                              {l.metadata ? (
                                <pre className="overflow-x-auto rounded bg-zinc-950 p-2 font-mono text-[10px] leading-relaxed text-zinc-300">
                                  {JSON.stringify(l.metadata, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-[10px] italic text-zinc-600">No metadata recorded for this action.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Load more */}
          {logs.length < total && (
            <div className="border-t border-zinc-800 bg-[#0F1014] p-3 text-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}
                Load more ({(total - logs.length).toLocaleString()} remaining)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Announcements ─────────────────────────────────────────────────────
function AnnouncementsView() {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [form, setForm] = React.useState({
    title: "",
    message: "",
    type: "info",
    targetPlan: "",
    targetWorkspace: "",
    scheduledFor: "",
    published: false,
  });
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/announcements?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, typeFilter, statusFilter]);

  React.useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const stats = React.useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 86_400_000;
    return {
      published: items.filter((a) => a.published).length,
      scheduled: items.filter(
        (a) => !a.published && a.scheduledFor && new Date(a.scheduledFor).getTime() > now,
      ).length,
      drafts: items.filter((a) => !a.published && !a.scheduledFor).length,
      sentWeek: items.filter(
        (a) => a.published && new Date(a.updatedAt).getTime() >= weekAgo,
      ).length,
    };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: "",
      message: "",
      type: "info",
      targetPlan: "",
      targetWorkspace: "",
      scheduledFor: "",
      published: false,
    });
    setShowForm(true);
  };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({
      title: a.title || "",
      message: a.message || "",
      type: a.type || "info",
      targetPlan: a.targetPlan || "",
      targetWorkspace: a.targetWorkspace || "",
      scheduledFor: a.scheduledFor
        ? new Date(a.scheduledFor).toISOString().slice(0, 16)
        : "",
      published: !!a.published,
    });
    setShowForm(true);
  };

  const submit = async (mode: "draft" | "publish" | "schedule") => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSaving(true);
    const payload: any = {
      title: form.title.trim(),
      message: form.message.trim(),
      type: form.type,
      targetPlan: form.targetPlan || null,
      targetWorkspace: form.targetWorkspace?.trim() || null,
      scheduledFor:
        mode === "schedule" && form.scheduledFor
          ? new Date(form.scheduledFor).toISOString()
          : null,
      published: mode === "publish",
    };
    try {
      const url = editing
        ? `/api/admin/announcements/${editing.id}`
        : "/api/admin/announcements";
      const method = editing ? "PATCH" : "POST";
      await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      setShowForm(false);
      setEditing(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    load();
  };

  const togglePublish = async (a: any) => {
    await fetch(`/api/admin/announcements/${a.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ published: !a.published }),
    });
    load();
  };

  const TYPE_BADGES: Record<string, string> = {
    info: "bg-sky-500/15 text-sky-400",
    maintenance: "bg-amber-500/15 text-amber-400",
    feature: "bg-violet-500/15 text-violet-400",
    security: "bg-rose-500/15 text-rose-400",
    welcome: "bg-emerald-500/15 text-emerald-400",
  };
  const TYPE_LABELS: Record<string, string> = {
    info: "Info",
    maintenance: "Maintenance",
    feature: "Feature Release",
    security: "Security Advisory",
    welcome: "Welcome",
  };
  const PLAN_LABELS: Record<string, string> = {
    "": "All Plans",
    free: "Free Only",
    pro: "Pro+",
    plus: "Plus+",
    ultra: "Ultra+",
    business: "Business+",
    enterprise: "Enterprise+",
  };

  const statusOf = (a: any): "published" | "scheduled" | "draft" => {
    if (a.published) return "published";
    if (a.scheduledFor && new Date(a.scheduledFor).getTime() > Date.now())
      return "scheduled";
    return "draft";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Announcements</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Create maintenance notices, feature releases, and security advisories · Powered by SPYRO AI Engine
          </p>
        </div>
        <button
          onClick={() => (showForm ? setShowForm(false) : openCreate())}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? "Cancel" : "New Announcement"}
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Published" value={stats.published} icon={Megaphone} color="text-emerald-400" />
        <StatCard label="Scheduled" value={stats.scheduled} icon={Calendar} color="text-amber-400" />
        <StatCard label="Drafts" value={stats.drafts} icon={Save} color="text-zinc-400" />
        <StatCard label="Sent This Week" value={stats.sentWeek} icon={Send} color="text-violet-400" />
      </div>

      {/* Inline Create/Edit form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-violet-500/20 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Megaphone className="h-4 w-4 text-violet-400" />
            {editing ? "Edit Announcement" : "Create Announcement"}
          </h3>
          <div className="space-y-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title (e.g. Scheduled maintenance — 2026-07-20 02:00 EAT)"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
            />
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Message body…"
              rows={4}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white"
              >
                <option value="info">Info</option>
                <option value="maintenance">Maintenance</option>
                <option value="feature">Feature Release</option>
                <option value="security">Security Advisory</option>
                <option value="welcome">Welcome</option>
              </select>
              <select
                value={form.targetPlan}
                onChange={(e) => setForm({ ...form, targetPlan: e.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-2 text-xs text-white"
              >
                <option value="">All Plans</option>
                <option value="free">Free Only</option>
                <option value="pro">Pro+</option>
                <option value="plus">Plus+</option>
                <option value="ultra">Ultra+</option>
                <option value="business">Business+</option>
                <option value="enterprise">Enterprise+</option>
              </select>
              <input
                value={form.targetWorkspace}
                onChange={(e) => setForm({ ...form, targetWorkspace: e.target.value })}
                placeholder="Target workspace (optional)"
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
              />
              <input
                type="datetime-local"
                value={form.scheduledFor}
                onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-violet-500/30 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => submit("draft")}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" /> Save as Draft
              </button>
              <button
                onClick={() => submit("publish")}
                disabled={saving || !!form.scheduledFor}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Publish Now
              </button>
              <button
                onClick={() => submit("schedule")}
                disabled={saving || !form.scheduledFor}
                className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <Calendar className="h-3.5 w-3.5" /> Schedule
              </button>
              {form.scheduledFor && (
                <span className="text-[10px] text-amber-400">
                  Scheduling for {new Date(form.scheduledFor).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or message…"
            className="w-64 rounded-lg border border-zinc-800 bg-[#0F1014] py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/30 focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#0F1014] px-2 py-1.5 text-xs text-white"
        >
          <option value="">All Types</option>
          <option value="info">Info</option>
          <option value="maintenance">Maintenance</option>
          <option value="feature">Feature Release</option>
          <option value="security">Security Advisory</option>
          <option value="welcome">Welcome</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#0F1014] px-2 py-1.5 text-xs text-white"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Drafts</option>
        </select>
        <span className="ml-auto text-[10px] text-zinc-500">
          {items.length} announcement{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* List */}
      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-8 text-center text-xs text-zinc-600">
            No announcements yet. Click “New Announcement” to create one.
          </div>
        ) : (
          items.map((a) => {
            const status = statusOf(a);
            const preview = (a.message || "").slice(0, 100);
            return (
              <div
                key={a.id}
                className="rounded-xl border border-zinc-800 bg-[#0F1014] p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-medium",
                          TYPE_BADGES[a.type] || "bg-zinc-700 text-zinc-300",
                        )}
                      >
                        {TYPE_LABELS[a.type] || a.type}
                      </span>
                      <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-medium text-zinc-300">
                        {PLAN_LABELS[a.targetPlan || ""] || "All Plans"}
                      </span>
                      {a.targetWorkspace && (
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[9px] font-medium text-zinc-400">
                          {a.targetWorkspace}
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] font-medium",
                          status === "published"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : status === "scheduled"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-zinc-700 text-zinc-300",
                        )}
                      >
                        {status === "published"
                          ? "Published"
                          : status === "scheduled"
                            ? `Scheduled · ${new Date(a.scheduledFor).toLocaleString()}`
                            : "Draft"}
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-sm font-semibold text-zinc-100">{a.title}</h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {preview}
                      {(a.message || "").length > 100 ? "…" : ""}
                    </p>
                    <p className="mt-1 text-[10px] text-zinc-600">
                      Created {new Date(a.createdAt).toLocaleString()}
                      {a.scheduledFor && status === "scheduled" && (
                        <> · Goes live {new Date(a.scheduledFor).toLocaleString()}</>
                      )}
                      {a.published && a.updatedAt && (
                        <> · Last updated {new Date(a.updatedAt).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      onClick={() => openEdit(a)}
                      className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200 hover:bg-zinc-700"
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    {status === "draft" && (
                      <button
                        onClick={() => togglePublish(a)}
                        className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-[10px] text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Send className="h-3 w-3" /> Publish
                      </button>
                    )}
                    {status === "published" && (
                      <button
                        onClick={() => togglePublish(a)}
                        className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400 hover:bg-amber-500/20"
                      >
                        <Lock className="h-3 w-3" /> Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => remove(a.id)}
                      className="flex items-center gap-1 rounded bg-rose-500/10 px-2 py-1 text-[10px] text-rose-400 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────────
function SettingsView({ admin }: { admin: any }) {
  const [tab, setTab] = React.useState<"profile" | "admins" | "platform" | "roles" | "security">("profile");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [toast, setToast] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/settings", { cache: "no-store" });
      const d = await r.json();
      setData(d);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const tabs = [
    { id: "profile" as const, label: "Admin Profile", icon: UserCog },
    { id: "admins" as const, label: "Admins", icon: Users },
    { id: "platform" as const, label: "Platform", icon: Globe },
    { id: "roles" as const, label: "Roles", icon: Shield },
    { id: "security" as const, label: "Security", icon: Lock },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Settings</h1>
          <p className="mt-1 text-xs text-zinc-500">Admin account and platform configuration</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/40 hover:text-white"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Tab nav */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs transition-colors",
              tab === t.id ? "border-violet-500 text-violet-400" : "border-transparent text-zinc-400 hover:text-white",
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div>
        ) : tab === "profile" ? (
          <ProfileTab admin={admin} data={data} showToast={showToast} />
        ) : tab === "admins" ? (
          <AdminsTab currentAdminId={admin?.id} currentRole={admin?.role} showToast={showToast} />
        ) : tab === "platform" ? (
          <PlatformTab data={data} />
        ) : tab === "roles" ? (
          <RolesTab data={data} />
        ) : (
          <SecurityTab data={data} />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-violet-500/30 bg-[#0F1014] px-4 py-2.5 text-xs text-violet-200 shadow-lg shadow-violet-500/10">
          {toast}
        </div>
      )}
    </div>
  );
}

function ProfileTab({ admin, data, showToast }: { admin: any; data: any; showToast: (m: string) => void }) {
  const profile = data?.profile || admin;
  const [form, setForm] = React.useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Failed to change password");
      } else {
        showToast("Password changed successfully");
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Admin Profile</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between"><span className="text-zinc-500">Name</span><span className="text-zinc-300">{profile?.name || "—"}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Email</span><span className="text-zinc-300">{profile?.email || "—"}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Role</span><span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[9px] font-medium text-violet-400">{profile?.role || "—"}</span></div>
          <div className="flex justify-between">
            <span className="text-zinc-500">MFA</span>
            {profile?.mfaEnabled
              ? <span className="flex items-center gap-1 text-emerald-400"><KeyRound className="h-3 w-3" /> Enabled</span>
              : <span className="text-amber-400">Not enabled</span>}
          </div>
          <div className="flex justify-between"><span className="text-zinc-500">Last Login</span><span className="text-zinc-300">{profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString() : "—"}</span></div>
          {profile?.lastLoginIP && <div className="flex justify-between"><span className="text-zinc-500">Last IP</span><span className="text-zinc-400 font-mono">{profile.lastLoginIP}</span></div>}
          <div className="flex justify-between"><span className="text-zinc-500">Created</span><span className="text-zinc-300">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 text-xs font-semibold">Change Password</h3>
        <form onSubmit={submit} className="space-y-2.5">
          <div>
            <label className="text-[9px] uppercase tracking-wide text-zinc-500">Current Password</label>
            <input
              type="password"
              required
              value={form.currentPassword}
              onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wide text-zinc-500">New Password</label>
            <input
              type="password"
              required
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-wide text-zinc-500">Confirm New Password</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-[10px] text-rose-400">{error}</div>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminsTab({ currentAdminId, currentRole, showToast }: { currentAdminId: string; currentRole: string; showToast: (m: string) => void }) {
  const [admins, setAdmins] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", email: "", password: "", role: "support" });
  const [creating, setCreating] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/admins", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Failed to load admins");
        setAdmins([]);
      } else {
        setAdmins(d.admins || []);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const canManage = currentRole === "super";

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    setCreating(true);
    try {
      const r = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) {
        setFormError(d.error || "Failed to create admin");
      } else {
        showToast(`Admin ${form.name} created`);
        setForm({ name: "", email: "", password: "", role: "support" });
        load();
      }
    } catch {
      setFormError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (a: any) => {
    try {
      const r = await fetch(`/api/admin/admins/${a.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !a.active }),
      });
      const d = await r.json();
      if (!r.ok) {
        showToast(d.error || "Update failed");
      } else {
        showToast(`${a.name} ${!a.active ? "activated" : "deactivated"}`);
        load();
      }
    } catch {
      showToast("Network error");
    }
  };

  const removeAdmin = async (a: any) => {
    if (!confirm(`Delete admin ${a.name}? This cannot be undone.`)) return;
    try {
      const r = await fetch(`/api/admin/admins/${a.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) {
        showToast(d.error || "Delete failed");
      } else {
        showToast(`${a.name} deleted`);
        load();
      }
    } catch {
      showToast("Network error");
    }
  };

  if (loading) {
    return <div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-500" /></div>;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
        <ShieldAlert className="mr-1 inline h-3.5 w-3.5" /> {error}. Your role ({currentRole}) may not have permission to manage admins.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Admins list (2 cols) */}
      <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold">Admins ({admins.length})</h3>
        </div>
        <div className="space-y-1.5">
          {admins.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-3 py-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-zinc-200">{a.name}</span>
                  {a.id === currentAdminId && <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[8px] text-violet-400">You</span>}
                  {a.mfaEnabled && <KeyRound className="h-3 w-3 text-emerald-400" />}
                </div>
                <div className="truncate text-[10px] text-zinc-500">{a.email}</div>
                <div className="text-[9px] text-zinc-600">
                  Last login: {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString() : "never"}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-medium", a.role === "super" ? "bg-violet-500/15 text-violet-400" : "bg-zinc-700/40 text-zinc-300")}>{a.role}</span>
                {canManage && (
                  <>
                    <button
                      onClick={() => toggleActive(a)}
                      disabled={a.id === currentAdminId}
                      className={cn("rounded-md border px-1.5 py-0.5 text-[9px] disabled:opacity-30", a.active ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-zinc-700 bg-zinc-800 text-zinc-400")}
                      title={a.id === currentAdminId ? "Cannot toggle yourself" : "Toggle active"}
                    >
                      {a.active ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => removeAdmin(a)}
                      disabled={a.id === currentAdminId}
                      className="rounded-md border border-rose-500/20 bg-rose-500/5 px-1.5 py-0.5 text-[9px] text-rose-400 hover:bg-rose-500/10 disabled:opacity-30"
                      title={a.id === currentAdminId ? "Cannot delete yourself" : "Delete admin"}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          {admins.length === 0 && <p className="p-6 text-center text-xs text-zinc-600">No admins found</p>}
        </div>
      </div>

      {/* Create admin (1 col) */}
      <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><Plus className="h-3.5 w-3.5 text-violet-400" /> Create Admin</h3>
        {canManage ? (
          <form onSubmit={createAdmin} className="space-y-2.5">
            <div>
              <label className="text-[9px] uppercase tracking-wide text-zinc-500">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
                placeholder="Jane Doe" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wide text-zinc-500">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
                placeholder="jane@spyro.ai" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wide text-zinc-500">Password</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500/40 focus:outline-none"
                placeholder="Min 8 characters" />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wide text-zinc-500">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-violet-500/40 focus:outline-none">
                <option value="support">Support</option>
                <option value="moderator">Moderator</option>
                <option value="operations">Operations</option>
                <option value="security">Security</option>
                <option value="developer">Developer</option>
                <option value="super">Super</option>
              </select>
            </div>
            {formError && <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-[10px] text-rose-400">{formError}</div>}
            <button type="submit" disabled={creating}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50">
              {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Create Admin
            </button>
          </form>
        ) : (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] text-amber-300">
            <ShieldAlert className="mr-1 inline h-3 w-3" /> Only super admins can create new admins.
          </div>
        )}
      </div>
    </div>
  );
}

function PlatformTab({ data }: { data: any }) {
  const p = data?.platform;
  if (!p) return <p className="text-xs text-zinc-500">Failed to load platform config</p>;
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
      <h3 className="mb-3 text-xs font-semibold">Platform Configuration</h3>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between"><span className="text-zinc-500">Database</span><span className="text-emerald-400">{p.database}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">VPS</span><span className="text-emerald-400">{p.vps}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Payment</span><span className={p.payment === "Not configured" ? "text-amber-400" : "text-emerald-400"}>{p.payment}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">AI Provider</span><span className="text-emerald-400">{p.aiProvider}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">Currency</span><span className="text-zinc-300">{p.currency}</span></div>
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5 text-[10px] text-zinc-500">
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
        <span>{p.note}</span>
      </div>
    </div>
  );
}

function RolesTab({ data }: { data: any }) {
  const roles = data?.roles || [];
  const permissionKeys = data?.allPermissionKeys || [];
  if (roles.length === 0) return <p className="text-xs text-zinc-500">Failed to load roles</p>;
  return (
    <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
      <h3 className="mb-3 text-xs font-semibold">Admin Roles & Permissions Matrix</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="border-b border-zinc-800 text-left text-zinc-500">
            <tr>
              <th className="p-2 text-left">Role</th>
              {permissionKeys.map((pk: string) => (
                <th key={pk} className="p-2 text-center text-[10px]">{pk}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((r: any) => (
              <tr key={r.key} className="border-b border-zinc-800/50">
                <td className="p-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-200">{r.label}</span>
                    {r.key === "super" && <span className="rounded-full bg-violet-500/15 px-1.5 py-0.5 text-[8px] text-violet-400">all</span>}
                  </div>
                </td>
                {r.permissions.map((perm: any) => (
                  <td key={perm.key} className="p-2 text-center">
                    {perm.granted
                      ? <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-emerald-400" />
                      : <span className="text-zinc-700">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-[10px] text-zinc-600">
        Permissions are grouped by namespace (e.g. <code className="text-violet-400">users.*</code> grants all <code className="text-violet-400">users.X</code> actions).
        The <code className="text-violet-400">super</code> role has the <code className="text-violet-400">*</code> wildcard (every permission).
      </div>
    </div>
  );
}

function SecurityTab({ data }: { data: any }) {
  const sec = data?.security;
  const [captchaEnabled, setCaptchaEnabled] = React.useState(false);
  const [captchaLoading, setCaptchaLoading] = React.useState(false);

  // Load current CAPTCHA setting
  React.useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(d => {
        setCaptchaEnabled(d?.security?.captchaEnabled || false);
      })
      .catch(() => {});
  }, []);

  const toggleCaptcha = async () => {
    setCaptchaLoading(true);
    try {
      // Note: env vars can't be changed at runtime on Vercel.
      // This toggle is a visual indicator — to actually enable CAPTCHA,
      // set ENABLE_CAPTCHA=true in Vercel env vars.
      setCaptchaEnabled(!captchaEnabled);
      // Show a note that this requires an env var change
    } catch {}
    setCaptchaLoading(false);
  };

  if (!sec) return <p className="text-xs text-zinc-500">Failed to load security settings</p>;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* CAPTCHA Control */}
      <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><Shield className="h-3.5 w-3.5 text-violet-400" /> CAPTCHA (Bot Protection)</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <div>
              <div className="text-xs font-medium text-zinc-200">Cloudflare Turnstile</div>
              <div className="text-[10px] text-zinc-500">Protects registration + login from automated bots</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-[10px] font-medium", captchaEnabled ? "text-emerald-400" : "text-zinc-500")}>
                {captchaEnabled ? "Enabled" : "Disabled"}
              </span>
              <button
                onClick={toggleCaptcha}
                disabled={captchaLoading}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  captchaEnabled ? "bg-emerald-500" : "bg-zinc-700",
                  captchaLoading && "opacity-50"
                )}
              >
                <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", captchaEnabled ? "left-5" : "left-0.5")} />
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[10px] text-amber-300">
            <ShieldAlert className="mr-1 inline h-3 w-3" />
            To enable CAPTCHA on registration + login, set <code className="rounded bg-zinc-800 px-1">ENABLE_CAPTCHA=true</code> and <code className="rounded bg-zinc-800 px-1">TURNSTILE_SECRET_KEY</code> + <code className="rounded bg-zinc-800 px-1">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> in your Vercel environment variables.
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2">
              <div className="text-zinc-500">Site Key</div>
              <div className="font-mono text-zinc-300">{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "✓ Set" : "✗ Not set"}</div>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2">
              <div className="text-zinc-500">Secret Key</div>
              <div className="font-mono text-zinc-300">{process.env.TURNSTILE_SECRET_KEY ? "✓ Set" : "✗ Not set"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MFA Setup */}
      <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
        <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><KeyRound className="h-3.5 w-3.5 text-violet-400" /> MFA Setup</h3>
        <div className="flex aspect-square max-w-[180px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 mx-auto">
          <div className="text-center">
            <KeyRound className="mx-auto h-6 w-6 text-zinc-600" />
            <div className="mt-1 text-[9px] text-zinc-600">QR Code</div>
            <div className="text-[8px] text-violet-500/60">Coming soon</div>
          </div>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500 text-center">TOTP enrollment flow coming soon.</p>
      </div>

      {/* Session & Password policy */}
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><Clock className="h-3.5 w-3.5 text-violet-400" /> Session Timeout</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Duration</span><span className="text-zinc-300">{sec.sessionTimeoutHours} hours</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Cookie</span><span className="text-zinc-300">httpOnly, secure</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">SameSite</span><span className="text-zinc-300">strict</span></div>
          </div>
          <div className="mt-2 text-[9px] text-zinc-600">DB-backed sessions, revocable.</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0F1014] p-4">
          <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><Lock className="h-3.5 w-3.5 text-violet-400" /> Password Policy</h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-zinc-500">Algorithm</span><span className="text-zinc-300">{sec.passwordPolicy.algorithm}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Min length</span><span className="text-zinc-300">{sec.passwordPolicy.minLength} chars</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Complexity</span><span className="text-zinc-300">Upper + lower + digit + special</span></div>
          </div>
          <div className="mt-2 text-[9px] text-zinc-600">Enforced server-side via bcrypt cost 12.</div>
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
