/**
 * SPYRO STUDIO — Studio Types Configuration
 *
 * Each Studio type provisions a set of apps relevant to that profession.
 * Studio is an additive layer — it uses the SAME projects, knowledge,
 * chats, agents, and communication as the main platform. No duplicates.
 */
import type { LucideIcon } from "lucide-react";
import {
  Code2, FlaskConical, Calculator, Briefcase, Palette, Megaphone,
  GraduationCap, Scale, Cpu, LayoutGrid, Terminal, GitBranch,
  Database, FileCode2, FileText, BookOpen, BarChart3, Image as ImageIcon,
  Mail, Calendar, Users, Zap, Globe, Server, Bug, Download,
  PenTool, Layers, BookMarked, CreditCard, Phone, MessageCircle,
  Inbox, Search, CheckCircle2, Bot,
} from "lucide-react";

export interface StudioApp {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  category: "core" | "recommended";
}

export interface StudioType {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  tagline: string;
  apps: StudioApp[];
  appStore: StudioApp[]; // installable apps
}

// ── Studio Types ──────────────────────────────────────────────────────
export const STUDIO_TYPES: StudioType[] = [
  {
    id: "developer",
    name: "Software Development",
    icon: Code2,
    color: "from-cyan-500 to-blue-600",
    description: "AI Code Editor, Terminal, Git, Database Explorer, Deployments",
    tagline: "Ship faster with AI pair programming",
    apps: [
      { id: "code-editor", name: "AI Code Editor", icon: Code2, color: "from-amber-500 to-orange-600", category: "core" },
      { id: "terminal", name: "Terminal", icon: Terminal, color: "from-zinc-600 to-zinc-800", category: "core" },
      { id: "git", name: "Git Integration", icon: GitBranch, color: "from-orange-500 to-red-600", category: "core" },
      { id: "db-explorer", name: "Database Explorer", icon: Database, color: "from-emerald-500 to-teal-600", category: "core" },
      { id: "rest-client", name: "REST Client", icon: FileCode2, color: "from-cyan-500 to-blue-600", category: "core" },
      { id: "deployments", name: "Deployments", icon: Server, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "logs", name: "Logs", icon: FileText, color: "from-zinc-500 to-zinc-700", category: "core" },
      { id: "docs", name: "Documentation", icon: BookOpen, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "debugger", name: "Debugger", icon: Bug, color: "from-rose-500 to-red-600", category: "core" },
    ],
    appStore: [
      { id: "docker", name: "Docker", icon: Server, color: "from-blue-500 to-cyan-600", category: "recommended" },
      { id: "github", name: "GitHub", icon: GitBranch, color: "from-zinc-600 to-zinc-800", category: "recommended" },
      { id: "postgres", name: "PostgreSQL Explorer", icon: Database, color: "from-blue-600 to-indigo-700", category: "recommended" },
      { id: "redis", name: "Redis Viewer", icon: Database, color: "from-red-500 to-rose-600", category: "recommended" },
    ],
  },
  {
    id: "research",
    name: "Research",
    icon: FlaskConical,
    color: "from-emerald-500 to-teal-600",
    description: "AI Notebook, PDF Library, Citation Manager, Knowledge Graph",
    tagline: "Accelerate your research with AI",
    apps: [
      { id: "notebook", name: "AI Notebook", icon: BookOpen, color: "from-emerald-500 to-teal-600", category: "core" },
      { id: "pdf-library", name: "PDF Library", icon: FileText, color: "from-rose-500 to-red-600", category: "core" },
      { id: "citations", name: "Citation Manager", icon: BookMarked, color: "from-amber-500 to-orange-600", category: "core" },
      { id: "browser", name: "Research Browser", icon: Globe, color: "from-cyan-500 to-blue-600", category: "core" },
      { id: "knowledge-graph", name: "Knowledge Graph", icon: Layers, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "source-compare", name: "Source Comparison", icon: BarChart3, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "academic-search", name: "Academic Search", icon: Globe, color: "from-emerald-500 to-green-600", category: "core" },
      { id: "timeline", name: "Research Timeline", icon: Calendar, color: "from-amber-500 to-yellow-600", category: "core" },
    ],
    appStore: [
      { id: "pdf-reader", name: "PDF Reader Pro", icon: FileText, color: "from-rose-500 to-red-600", category: "recommended" },
      { id: "reference-library", name: "Reference Library", icon: BookMarked, color: "from-violet-500 to-purple-600", category: "recommended" },
      { id: "fact-checker", name: "Fact Checker", icon: Bug, color: "from-emerald-500 to-teal-600", category: "recommended" },
    ],
  },
  {
    id: "math",
    name: "Mathematics & Data",
    icon: Calculator,
    color: "from-violet-500 to-purple-600",
    description: "AI Spreadsheet, Formula Assistant, Calculator, Graph Builder",
    tagline: "Compute and visualize with AI",
    apps: [
      { id: "spreadsheet", name: "AI Spreadsheet", icon: BarChart3, color: "from-emerald-500 to-green-600", category: "core" },
      { id: "formula", name: "Formula Assistant", icon: Calculator, color: "from-violet-500 to-purple-600", category: "core" },
      { id: "calculator", name: "Scientific Calculator", icon: Calculator, color: "from-cyan-500 to-blue-600", category: "core" },
      { id: "equation-solver", name: "Equation Solver", icon: Calculator, color: "from-amber-500 to-orange-600", category: "core" },
      { id: "latex", name: "LaTeX Editor", icon: FileCode2, color: "from-zinc-600 to-zinc-800", category: "core" },
      { id: "graph-builder", name: "Graph Builder", icon: BarChart3, color: "from-pink-500 to-rose-600", category: "core" },
      { id: "dataset", name: "Dataset Explorer", icon: Database, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "viz", name: "Visualization Workspace", icon: BarChart3, color: "from-fuchsia-500 to-pink-600", category: "core" },
    ],
    appStore: [
      { id: "python-notebook", name: "Python Notebook (soon)", icon: Code2, color: "from-amber-500 to-yellow-600", category: "recommended" },
      { id: "matrix-tools", name: "Matrix Tools", icon: Layers, color: "from-violet-500 to-fuchsia-600", category: "recommended" },
    ],
  },
  {
    id: "office",
    name: "Office Productivity",
    icon: Briefcase,
    color: "from-blue-500 to-indigo-600",
    description: "AI Word, Spreadsheet, Presentation, PDF, Calendar, Email",
    tagline: "Your AI-powered office",
    apps: [
      { id: "word", name: "AI Word", icon: FileText, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "excel", name: "AI Spreadsheet", icon: BarChart3, color: "from-emerald-500 to-green-600", category: "core" },
      { id: "powerpoint", name: "AI Presentation", icon: LayoutGrid, color: "from-orange-500 to-red-600", category: "core" },
      { id: "pdf", name: "AI PDF", icon: FileText, color: "from-rose-500 to-red-600", category: "core" },
      { id: "calendar", name: "Calendar", icon: Calendar, color: "from-cyan-500 to-blue-600", category: "core" },
      { id: "notes", name: "Notes", icon: BookOpen, color: "from-amber-500 to-yellow-600", category: "core" },
      { id: "email", name: "Email", icon: Mail, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "meeting", name: "Meeting Workspace", icon: Users, color: "from-teal-500 to-cyan-600", category: "core" },
    ],
    appStore: [
      { id: "templates", name: "Document Templates", icon: FileText, color: "from-indigo-500 to-violet-600", category: "recommended" },
      { id: "writer", name: "AI Writing Assistant", icon: PenTool, color: "from-pink-500 to-rose-600", category: "recommended" },
    ],
  },
  {
    id: "design",
    name: "Design",
    icon: Palette,
    color: "from-pink-500 to-rose-600",
    description: "Image Studio, Brand Assets, Prompt Builder, AI Generation",
    tagline: "Create stunning visuals with AI",
    apps: [
      { id: "image-studio", name: "Image Studio", icon: ImageIcon, color: "from-pink-500 to-rose-600", category: "core" },
      { id: "brand-assets", name: "Brand Assets", icon: Palette, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "prompt-builder", name: "Prompt Builder", icon: PenTool, color: "from-amber-500 to-orange-600", category: "core" },
      { id: "mockups", name: "Mockups", icon: LayoutGrid, color: "from-cyan-500 to-blue-600", category: "core" },
      { id: "colors", name: "Colors", icon: Palette, color: "from-emerald-500 to-teal-600", category: "core" },
      { id: "ai-editing", name: "AI Editing", icon: PenTool, color: "from-rose-500 to-red-600", category: "core" },
      { id: "asset-manager", name: "Asset Manager", icon: Layers, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "export", name: "Export Center", icon: Download, color: "from-zinc-500 to-zinc-700", category: "core" },
    ],
    appStore: [
      { id: "typography", name: "Typography", icon: FileText, color: "from-amber-500 to-yellow-600", category: "recommended" },
    ],
  },
  {
    id: "business",
    name: "Business Operations",
    icon: Briefcase,
    color: "from-indigo-500 to-violet-600",
    description: "CRM, Communication, Calendar, Reports, Invoices, Analytics",
    tagline: "Run your business on autopilot",
    apps: [
      { id: "crm", name: "CRM", icon: Users, color: "from-emerald-500 to-teal-600", category: "core" },
      { id: "comm-center", name: "Communication Center", icon: Inbox, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "calendar", name: "Calendar", icon: Calendar, color: "from-cyan-500 to-blue-600", category: "core" },
      { id: "reports", name: "Reports", icon: FileText, color: "from-amber-500 to-orange-600", category: "core" },
      { id: "invoices", name: "Invoices", icon: CreditCard, color: "from-emerald-500 to-green-600", category: "core" },
      { id: "marketing", name: "Marketing", icon: Megaphone, color: "from-pink-500 to-rose-600", category: "core" },
      { id: "finance", name: "Finance", icon: BarChart3, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "analytics", name: "Analytics", icon: BarChart3, color: "from-violet-500 to-purple-600", category: "core" },
    ],
    appStore: [
      { id: "accounting", name: "Accounting", icon: CreditCard, color: "from-emerald-500 to-green-600", category: "recommended" },
      { id: "whatsapp", name: "WhatsApp", icon: Phone, color: "from-emerald-500 to-teal-600", category: "recommended" },
    ],
  },
  {
    id: "student",
    name: "Student",
    icon: GraduationCap,
    color: "from-amber-500 to-orange-600",
    description: "Assignments, Notes, Flashcards, AI Tutor, Exams, Planner",
    tagline: "Ace every class with AI",
    apps: [
      { id: "assignments", name: "Assignments", icon: FileText, color: "from-amber-500 to-orange-600", category: "core" },
      { id: "lecture-notes", name: "Lecture Notes", icon: BookOpen, color: "from-emerald-500 to-teal-600", category: "core" },
      { id: "books", name: "Books", icon: BookMarked, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "planner", name: "Planner", icon: Calendar, color: "from-cyan-500 to-blue-600", category: "core" },
      { id: "flashcards", name: "Flashcards", icon: Layers, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "ai-tutor", name: "AI Tutor", icon: Bot, color: "from-amber-500 to-yellow-600", category: "core" },
      { id: "research", name: "Research", icon: Globe, color: "from-pink-500 to-rose-600", category: "core" },
      { id: "exams", name: "Exams", icon: FileText, color: "from-rose-500 to-red-600", category: "core" },
    ],
    appStore: [
      { id: "study-group", name: "Study Group", icon: Users, color: "from-cyan-500 to-teal-600", category: "recommended" },
    ],
  },
  {
    id: "legal",
    name: "Legal",
    icon: Scale,
    color: "from-amber-500 to-yellow-600",
    description: "Contract Review, Case Law, Citations, Compliance, Client Files",
    tagline: "AI-powered legal practice",
    apps: [
      { id: "contracts", name: "Contract Review", icon: FileText, color: "from-amber-500 to-yellow-600", category: "core" },
      { id: "case-law", name: "Case Law Search", icon: BookOpen, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "citations-legal", name: "Citations", icon: BookMarked, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "compliance", name: "Compliance", icon: CheckCircle2, color: "from-emerald-500 to-teal-600", category: "core" },
      { id: "client-files", name: "Client Files", icon: Briefcase, color: "from-zinc-500 to-zinc-700", category: "core" },
      { id: "deadlines", name: "Filing Deadlines", icon: Calendar, color: "from-rose-500 to-red-600", category: "core" },
    ],
    appStore: [
      { id: "e-discovery", name: "E-Discovery", icon: Search, color: "from-cyan-500 to-blue-600", category: "recommended" },
    ],
  },
  {
    id: "engineering",
    name: "Engineering",
    icon: Cpu,
    color: "from-teal-500 to-cyan-600",
    description: "CAD, Simulations, Specs, Technical Docs, Project Management",
    tagline: "Engineer with AI precision",
    apps: [
      { id: "cad", name: "CAD Viewer", icon: Layers, color: "from-teal-500 to-cyan-600", category: "core" },
      { id: "simulations", name: "Simulations", icon: Cpu, color: "from-blue-500 to-indigo-600", category: "core" },
      { id: "specs", name: "Specifications", icon: FileText, color: "from-amber-500 to-orange-600", category: "core" },
      { id: "tech-docs", name: "Technical Docs", icon: BookOpen, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "project-mgmt", name: "Project Management", icon: Briefcase, color: "from-emerald-500 to-teal-600", category: "core" },
    ],
    appStore: [
      { id: "circuit-sim", name: "Circuit Simulator", icon: Cpu, color: "from-emerald-500 to-green-600", category: "recommended" },
    ],
  },
  {
    id: "blank",
    name: "Blank Studio",
    icon: LayoutGrid,
    color: "from-zinc-500 to-zinc-700",
    description: "Start from scratch. Add the apps you need.",
    tagline: "Your studio, your rules",
    apps: [
      { id: "chat", name: "Chat", icon: MessageCircle, color: "from-violet-500 to-fuchsia-500", category: "core" },
      { id: "files", name: "Files", icon: FileText, color: "from-amber-500 to-orange-600", category: "core" },
    ],
    appStore: [],
  },
];

export function getStudioType(id: string): StudioType | undefined {
  return STUDIO_TYPES.find((s) => s.id === id);
}
