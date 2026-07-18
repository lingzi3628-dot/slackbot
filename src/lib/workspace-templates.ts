/**
 * SPYRO Workspace Templates
 *
 * A Workspace is a complete digital environment tailored to a profession.
 * Each template provisions: navigation, dashboard widgets, AI agents,
 * knowledge collections, suggested apps, quick actions, and automation
 * templates.
 *
 * The architecture supports a future marketplace where workspaces can be
 * published, shared, and installed.
 */
import type { LucideIcon } from "lucide-react";
import {
  Code2, Rocket, FlaskConical, GraduationCap, Palette, Megaphone,
  TrendingUp, Headphones, Briefcase, DollarSign, Scale, LayoutGrid,
  Bot, BookOpen, FileText, Inbox, BarChart3, GitBranch, FileCode2,
  CheckCircle2, MessageCircle, Zap, Calendar, Users, Image as ImageIcon,
  Clock,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
export interface WorkspaceAgent {
  name: string;
  role: string;
  icon: string;
  color: string;
}

export interface WorkspaceApp {
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface WorkspaceWidget {
  id: string;
  title: string;
  icon: LucideIcon;
}

export interface WorkspaceQuickAction {
  label: string;
  icon: LucideIcon;
  view: string;
}

export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;          // gradient classes
  tagline: string;
  agents: WorkspaceAgent[];
  apps: WorkspaceApp[];
  widgets: WorkspaceWidget[];
  quickActions: WorkspaceQuickAction[];
  knowledgeCollections: string[];
  automationTemplates: string[];
  dashboardSections: string[];  // which Mission Control sections to show
}

// ── Templates ─────────────────────────────────────────────────────────
export const WORKSPACE_TEMPLATES: WorkspaceTemplate[] = [
  {
    id: "developer",
    name: "Developer",
    description: "Code, build, deploy. AI agents for review, backend, frontend, and DevOps.",
    icon: Code2,
    color: "from-cyan-500 to-blue-600",
    tagline: "Ship faster with AI pair programming",
    agents: [
      { name: "Code Reviewer", role: "Reviews PRs and suggests improvements", icon: "🔍", color: "#06B6D4" },
      { name: "Backend Engineer", role: "APIs, databases, server logic", icon: "⚙️", color: "#3B82F6" },
      { name: "Frontend Engineer", role: "UI components, styling, UX", icon: "🎨", color: "#8B5CF6" },
      { name: "DevOps Advisor", role: "CI/CD, deployments, infrastructure", icon: "🚀", color: "#10B981" },
    ],
    apps: [
      { name: "Code Studio", icon: Code2, color: "from-amber-500 to-orange-600" },
      { name: "API Playground", icon: FileCode2, color: "from-cyan-500 to-blue-600" },
      { name: "Git Activity", icon: GitBranch, color: "from-violet-500 to-fuchsia-500" },
    ],
    widgets: [
      { id: "active-projects", title: "Active projects", icon: LayoutGrid },
      { id: "git-activity", title: "Git activity", icon: GitBranch },
      { id: "ai-coding", title: "AI coding assistant", icon: Bot },
      { id: "deployments", title: "Recent deployments", icon: Rocket },
      { id: "docs", title: "Documentation", icon: BookOpen },
      { id: "terminal", title: "Terminal shortcuts", icon: FileCode2 },
    ],
    quickActions: [
      { label: "New Code Chat", icon: Code2, view: "chat" },
      { label: "New Project", icon: LayoutGrid, view: "projects" },
      { label: "Deploy", icon: Rocket, view: "apps" },
      { label: "Review Code", icon: Bot, view: "agents" },
    ],
    knowledgeCollections: ["Code Snippets", "API References", "Architecture Docs", "Bug Reports"],
    automationTemplates: ["Auto-code review on push", "Deploy on merge", "Generate changelog"],
    dashboardSections: ["hero", "quick-actions", "continue-working", "pinned-projects", "running-agents", "recent-activity", "knowledge", "workspace-health"],
  },
  {
    id: "startup",
    name: "Startup",
    description: "Build your company. Sales, marketing, operations, and investor relations.",
    icon: Rocket,
    color: "from-violet-500 to-fuchsia-600",
    tagline: "Your startup OS — from idea to IPO",
    agents: [
      { name: "Sales Agent", role: "Lead qualification and outreach", icon: "📈", color: "#10B981" },
      { name: "Marketing Agent", role: "Content, campaigns, social media", icon: "📣", color: "#EC4899" },
      { name: "Operations Agent", role: "Process automation, scheduling", icon: "⚙️", color: "#F59E0B" },
      { name: "Investor Relations", role: "Updates, metrics, reporting", icon: "📊", color: "#8B5CF6" },
    ],
    apps: [
      { name: "Analytics", icon: BarChart3, color: "from-emerald-500 to-teal-600" },
      { name: "Communication", icon: Inbox, color: "from-violet-500 to-fuchsia-500" },
      { name: "Documents", icon: FileText, color: "from-amber-500 to-orange-600" },
    ],
    widgets: [
      { id: "revenue", title: "Revenue overview", icon: TrendingUp },
      { id: "pipeline", title: "Sales pipeline", icon: Users },
      { id: "campaigns", title: "Marketing campaigns", icon: Megaphone },
      { id: "comm", title: "Customer communications", icon: Inbox },
      { id: "insights", title: "AI business insights", icon: Bot },
      { id: "tasks", title: "Today's tasks", icon: CheckCircle2 },
    ],
    quickActions: [
      { label: "New Pitch", icon: Rocket, view: "chat" },
      { label: "New Campaign", icon: Megaphone, view: "apps" },
      { label: "Investor Update", icon: FileText, view: "chat" },
      { label: "Sales Call", icon: Users, view: "communication" },
    ],
    knowledgeCollections: ["Investor Decks", "Market Research", "Competitors", "OKRs", "Brand Guidelines"],
    automationTemplates: ["Weekly investor update", "Lead scoring", "Social media scheduling"],
    dashboardSections: ["hero", "quick-actions", "continue-working", "running-agents", "communication", "tasks", "ai-suggestions", "recent-activity", "workspace-health"],
  },
  {
    id: "research",
    name: "Research",
    description: "Literature, citations, papers. AI research assistant and fact checker.",
    icon: FlaskConical,
    color: "from-emerald-500 to-teal-600",
    tagline: "Accelerate your research with AI",
    agents: [
      { name: "Research Assistant", role: "Literature search, summaries, analysis", icon: "🔬", color: "#10B981" },
      { name: "Fact Checker", role: "Verifies claims and citations", icon: "✓", color: "#06B6D4" },
      { name: "Citation Manager", role: "Manages references and formats", icon: "📚", color: "#8B5CF6" },
    ],
    apps: [
      { name: "Knowledge Base", icon: BookOpen, color: "from-emerald-500 to-teal-600" },
      { name: "Document Studio", icon: FileText, color: "from-amber-500 to-orange-600" },
      { name: "Web Scout", icon: BarChart3, color: "from-cyan-500 to-blue-600" },
    ],
    widgets: [
      { id: "library", title: "Literature library", icon: BookOpen },
      { id: "citations", title: "Citation manager", icon: FileText },
      { id: "assistant", title: "AI research assistant", icon: Bot },
      { id: "papers", title: "Recent papers", icon: FlaskConical },
      { id: "graph", title: "Knowledge graph", icon: LayoutGrid },
      { id: "timeline", title: "Research timeline", icon: Calendar },
    ],
    quickActions: [
      { label: "New Research", icon: FlaskConical, view: "chat" },
      { label: "Add Paper", icon: BookOpen, view: "knowledge" },
      { label: "Cite Source", icon: FileText, view: "chat" },
      { label: "Fact Check", icon: Bot, view: "agents" },
    ],
    knowledgeCollections: ["Papers", "References", "Datasets", "Notes", "Methodology"],
    automationTemplates: ["Daily literature digest", "Citation formatting", "Plagiarism check"],
    dashboardSections: ["hero", "quick-actions", "continue-working", "running-agents", "knowledge", "recent-activity", "ai-suggestions", "workspace-health"],
  },
  {
    id: "student",
    name: "Student",
    description: "Assignments, exams, notes. AI tutor, flashcards, and study planner.",
    icon: GraduationCap,
    color: "from-amber-500 to-orange-600",
    tagline: "Ace every class with AI",
    agents: [
      { name: "AI Tutor", role: "Explains concepts, answers questions", icon: "🎓", color: "#F59E0B" },
      { name: "Study Planner", role: "Schedules study sessions", icon: "📅", color: "#10B981" },
      { name: "Flashcard Maker", role: "Creates study cards from notes", icon: "🃏", color: "#8B5CF6" },
    ],
    apps: [
      { name: "Documents", icon: FileText, color: "from-amber-500 to-orange-600" },
      { name: "Knowledge", icon: BookOpen, color: "from-emerald-500 to-teal-600" },
      { name: "Chat", icon: MessageCircle, color: "from-violet-500 to-fuchsia-500" },
    ],
    widgets: [
      { id: "assignments", title: "Assignments", icon: FileText },
      { id: "exams", title: "Upcoming exams", icon: Calendar },
      { id: "notes", title: "Lecture notes", icon: BookOpen },
      { id: "tutor", title: "AI tutor", icon: Bot },
      { id: "flashcards", title: "Flashcards", icon: LayoutGrid },
      { id: "planner", title: "Study planner", icon: Calendar },
    ],
    quickActions: [
      { label: "Ask Tutor", icon: Bot, view: "chat" },
      { label: "New Note", icon: BookOpen, view: "knowledge" },
      { label: "Flashcards", icon: LayoutGrid, view: "apps" },
      { label: "Schedule", icon: Calendar, view: "apps" },
    ],
    knowledgeCollections: ["Lecture Notes", "Assignments", "Past Papers", "Flashcards", "Syllabus"],
    automationTemplates: ["Daily study reminder", "Auto-flashcard generation", "Exam countdown"],
    dashboardSections: ["hero", "quick-actions", "tasks", "running-agents", "knowledge", "recent-activity", "ai-suggestions", "workspace-health"],
  },
  {
    id: "designer",
    name: "Designer",
    description: "Visual design, mockups, assets. AI image generation and editing.",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
    tagline: "Create stunning visuals with AI",
    agents: [
      { name: "Design Assistant", role: "Color palettes, layouts, feedback", icon: "🎨", color: "#EC4899" },
      { name: "Image Generator", role: "AI image creation from prompts", icon: "🖼️", color: "#8B5CF6" },
    ],
    apps: [
      { name: "Image Studio", icon: ImageIcon, color: "from-pink-500 to-rose-600" },
      { name: "Photo Editor", icon: Palette, color: "from-violet-500 to-fuchsia-500" },
      { name: "Files", icon: FileText, color: "from-amber-500 to-orange-600" },
    ],
    widgets: [
      { id: "recent-designs", title: "Recent designs", icon: ImageIcon },
      { id: "assets", title: "Asset library", icon: FileText },
      { id: "image-gen", title: "AI image generation", icon: Palette },
      { id: "feedback", title: "Design feedback", icon: Bot },
    ],
    quickActions: [
      { label: "Generate Image", icon: ImageIcon, view: "apps" },
      { label: "Edit Photo", icon: Palette, view: "apps" },
      { label: "New Mockup", icon: FileText, view: "chat" },
    ],
    knowledgeCollections: ["Brand Assets", "Color Palettes", "Typography", "Inspiration"],
    automationTemplates: ["Auto-resize for social", "Brand consistency check"],
    dashboardSections: ["hero", "quick-actions", "continue-working", "running-agents", "recent-files", "recent-activity", "workspace-health"],
  },
  {
    id: "marketing",
    name: "Marketing",
    description: "Campaigns, content, social media. AI content generation and analytics.",
    icon: Megaphone,
    color: "from-orange-500 to-red-600",
    tagline: "Data-driven marketing with AI",
    agents: [
      { name: "Content Writer", role: "Blog posts, ads, social media", icon: "✍️", color: "#F59E0B" },
      { name: "SEO Analyst", role: "Keywords, rankings, optimization", icon: "📈", color: "#10B981" },
      { name: "Social Media Manager", role: "Scheduling, engagement, analytics", icon: "📱", color: "#EC4899" },
    ],
    apps: [
      { name: "Analytics", icon: BarChart3, color: "from-emerald-500 to-teal-600" },
      { name: "Document Studio", icon: FileText, color: "from-amber-500 to-orange-600" },
      { name: "Image Studio", icon: ImageIcon, color: "from-pink-500 to-rose-600" },
    ],
    widgets: [
      { id: "campaigns", title: "Active campaigns", icon: Megaphone },
      { id: "content", title: "Content calendar", icon: Calendar },
      { id: "analytics", title: "Marketing analytics", icon: BarChart3 },
      { id: "social", title: "Social media", icon: Users },
    ],
    quickActions: [
      { label: "Write Blog", icon: FileText, view: "chat" },
      { label: "Create Ad", icon: Megaphone, view: "apps" },
      { label: "Schedule Post", icon: Calendar, view: "apps" },
    ],
    knowledgeCollections: ["Brand Voice", "Content Calendar", "SEO Keywords", "Competitor Analysis"],
    automationTemplates: ["Auto-post schedule", "Weekly analytics report", "Content repurposing"],
    dashboardSections: ["hero", "quick-actions", "running-agents", "communication", "tasks", "ai-suggestions", "recent-activity", "workspace-health"],
  },
  {
    id: "sales",
    name: "Sales",
    description: "Pipeline, leads, customer communication. AI sales agent and CRM.",
    icon: TrendingUp,
    color: "from-emerald-500 to-green-600",
    tagline: "Close more deals with AI",
    agents: [
      { name: "Sales Agent", role: "Lead qualification, follow-ups", icon: "💼", color: "#10B981" },
      { name: "CRM Assistant", role: "Contact management, notes", icon: "📊", color: "#06B6D4" },
    ],
    apps: [
      { name: "Communication", icon: Inbox, color: "from-violet-500 to-fuchsia-500" },
      { name: "Analytics", icon: BarChart3, color: "from-emerald-500 to-teal-600" },
      { name: "Documents", icon: FileText, color: "from-amber-500 to-orange-600" },
    ],
    widgets: [
      { id: "pipeline", title: "Sales pipeline", icon: TrendingUp },
      { id: "leads", title: "Hot leads", icon: Users },
      { id: "comm", title: "Customer messages", icon: Inbox },
      { id: "forecast", title: "Revenue forecast", icon: BarChart3 },
    ],
    quickActions: [
      { label: "New Lead", icon: Users, view: "communication" },
      { label: "Follow Up", icon: MessageCircle, view: "chat" },
      { label: "Pipeline", icon: TrendingUp, view: "analytics" },
    ],
    knowledgeCollections: ["Leads", "Accounts", "Proposals", "Competitors"],
    automationTemplates: ["Lead scoring", "Follow-up reminders", "Weekly pipeline report"],
    dashboardSections: ["hero", "quick-actions", "running-agents", "communication", "tasks", "recent-activity", "workspace-health"],
  },
  {
    id: "support",
    name: "Customer Support",
    description: "Tickets, live chat, AI auto-replies. WhatsApp, email, and social.",
    icon: Headphones,
    color: "from-cyan-500 to-teal-600",
    tagline: "Delight customers with AI support",
    agents: [
      { name: "Support Agent", role: "Auto-replies, ticket routing", icon: "🎧", color: "#06B6D4" },
      { name: "Sentiment Analyst", role: "Monitors customer mood", icon: "📊", color: "#F59E0B" },
    ],
    apps: [
      { name: "Communication", icon: Inbox, color: "from-violet-500 to-fuchsia-500" },
      { name: "Knowledge Base", icon: BookOpen, color: "from-emerald-500 to-teal-600" },
      { name: "Analytics", icon: BarChart3, color: "from-cyan-500 to-blue-600" },
    ],
    widgets: [
      { id: "tickets", title: "Open tickets", icon: Headphones },
      { id: "inbox", title: "Unified inbox", icon: Inbox },
      { id: "sentiment", title: "Sentiment analysis", icon: Bot },
      { id: "response-time", title: "Response time", icon: Clock },
    ],
    quickActions: [
      { label: "Open Inbox", icon: Inbox, view: "communication" },
      { label: "New Reply", icon: MessageCircle, view: "chat" },
      { label: "Knowledge", icon: BookOpen, view: "knowledge" },
    ],
    knowledgeCollections: ["FAQ", "Troubleshooting", "Product Docs", "Tickets"],
    automationTemplates: ["Auto-reply", "Ticket routing", "Satisfaction survey"],
    dashboardSections: ["hero", "quick-actions", "running-agents", "communication", "tasks", "ai-suggestions", "recent-activity", "workspace-health"],
  },
  {
    id: "business",
    name: "Business Operations",
    description: "Process automation, workflows, team coordination, reporting.",
    icon: Briefcase,
    color: "from-indigo-500 to-violet-600",
    tagline: "Run your operations on autopilot",
    agents: [
      { name: "Ops Agent", role: "Process automation, monitoring", icon: "⚙️", color: "#6366F1" },
      { name: "Reporting Agent", role: "Generates reports, dashboards", icon: "📊", color: "#8B5CF6" },
    ],
    apps: [
      { name: "Automation", icon: Zap, color: "from-orange-500 to-red-600" },
      { name: "Analytics", icon: BarChart3, color: "from-indigo-500 to-violet-600" },
      { name: "Documents", icon: FileText, color: "from-amber-500 to-orange-600" },
    ],
    widgets: [
      { id: "automations", title: "Running automations", icon: Zap },
      { id: "team", title: "Team activity", icon: Users },
      { id: "reports", title: "Recent reports", icon: FileText },
      { id: "health", title: "Operations health", icon: Bot },
    ],
    quickActions: [
      { label: "New Automation", icon: Zap, view: "apps" },
      { label: "Generate Report", icon: FileText, view: "chat" },
      { label: "Team Chat", icon: Users, view: "chat" },
    ],
    knowledgeCollections: ["SOPs", "Process Docs", "Team Handbook", "Reports"],
    automationTemplates: ["Daily ops summary", "Approval workflows", "Compliance check"],
    dashboardSections: ["hero", "quick-actions", "running-agents", "tasks", "ai-suggestions", "recent-activity", "workspace-health"],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Invoices, expenses, forecasting. AI financial analysis.",
    icon: DollarSign,
    color: "from-emerald-500 to-green-600",
    tagline: "Smart finance with AI",
    agents: [
      { name: "Finance Assistant", role: "Invoices, expenses, budgets", icon: "💰", color: "#10B981" },
      { name: "Forecast Agent", role: "Revenue and expense forecasting", icon: "📈", color: "#06B6D4" },
    ],
    apps: [
      { name: "Analytics", icon: BarChart3, color: "from-emerald-500 to-green-600" },
      { name: "Documents", icon: FileText, color: "from-amber-500 to-orange-600" },
      { name: "Spreadsheets", icon: LayoutGrid, color: "from-cyan-500 to-blue-600" },
    ],
    widgets: [
      { id: "cashflow", title: "Cash flow", icon: DollarSign },
      { id: "invoices", title: "Invoices", icon: FileText },
      { id: "expenses", title: "Recent expenses", icon: TrendingUp },
      { id: "forecast", title: "Financial forecast", icon: BarChart3 },
    ],
    quickActions: [
      { label: "New Invoice", icon: FileText, view: "chat" },
      { label: "Track Expense", icon: DollarSign, view: "apps" },
      { label: "Forecast", icon: TrendingUp, view: "analytics" },
    ],
    knowledgeCollections: ["Invoices", "Receipts", "Budgets", "Tax Docs"],
    automationTemplates: ["Invoice reminders", "Expense categorization", "Monthly P&L"],
    dashboardSections: ["hero", "quick-actions", "running-agents", "tasks", "recent-activity", "workspace-health"],
  },
  {
    id: "legal",
    name: "Legal",
    description: "Contracts, compliance, research. AI legal document analysis.",
    icon: Scale,
    color: "from-amber-500 to-yellow-600",
    tagline: "AI-powered legal practice",
    agents: [
      { name: "Contract Reviewer", role: "Analyzes contracts, flags risks", icon: "📋", color: "#F59E0B" },
      { name: "Legal Researcher", role: "Case law, precedents, citations", icon: "📚", color: "#8B5CF6" },
    ],
    apps: [
      { name: "Document Studio", icon: FileText, color: "from-amber-500 to-yellow-600" },
      { name: "Knowledge Base", icon: BookOpen, color: "from-emerald-500 to-teal-600" },
      { name: "Chat", icon: MessageCircle, color: "from-violet-500 to-fuchsia-500" },
    ],
    widgets: [
      { id: "contracts", title: "Active contracts", icon: FileText },
      { id: "deadlines", title: "Filing deadlines", icon: Calendar },
      { id: "research", title: "Legal research", icon: BookOpen },
      { id: "compliance", title: "Compliance status", icon: CheckCircle2 },
    ],
    quickActions: [
      { label: "Review Contract", icon: FileText, view: "chat" },
      { label: "Research Case", icon: BookOpen, view: "knowledge" },
      { label: "New Document", icon: Scale, view: "apps" },
    ],
    knowledgeCollections: ["Contracts", "Case Law", "Statutes", "Client Files"],
    automationTemplates: ["Deadline reminders", "Contract expiry alerts", "Compliance audit"],
    dashboardSections: ["hero", "quick-actions", "tasks", "running-agents", "knowledge", "recent-activity", "workspace-health"],
  },
  {
    id: "blank",
    name: "Blank Workspace",
    description: "Start from scratch. Build your own workspace with the apps you choose.",
    icon: LayoutGrid,
    color: "from-zinc-500 to-zinc-700",
    tagline: "Your workspace, your rules",
    agents: [
      { name: "General Assistant", role: "Helps with anything", icon: "🤖", color: "#71717A" },
    ],
    apps: [
      { name: "Chat", icon: MessageCircle, color: "from-violet-500 to-fuchsia-500" },
      { name: "Apps", icon: LayoutGrid, color: "from-cyan-500 to-blue-600" },
    ],
    widgets: [
      { id: "welcome", title: "Welcome", icon: Bot },
      { id: "quick-actions", title: "Quick actions", icon: Zap },
    ],
    quickActions: [
      { label: "New Chat", icon: MessageCircle, view: "chat" },
      { label: "Browse Apps", icon: LayoutGrid, view: "apps" },
    ],
    knowledgeCollections: [],
    automationTemplates: [],
    dashboardSections: ["hero", "quick-actions", "running-agents", "recent-activity", "workspace-health"],
  },
];

export function getTemplate(id: string): WorkspaceTemplate | undefined {
  return WORKSPACE_TEMPLATES.find((t) => t.id === id);
}
