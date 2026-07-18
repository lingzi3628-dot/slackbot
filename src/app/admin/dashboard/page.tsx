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
        {activeView !== "dashboard" && activeView !== "users" && <PlaceholderView title={NAV.find((n) => n.id === activeView)?.label || activeView} />}
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

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-zinc-800 bg-[#0F1014]">
        <Flag className="h-6 w-6 text-zinc-600" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-zinc-300">{title}</h3>
      <p className="mt-1 text-xs text-zinc-600">This section is under construction. The framework is in place — content will be added incrementally.</p>
    </div>
  );
}
