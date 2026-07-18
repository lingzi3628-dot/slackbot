/**
 * SPYRO Onboarding Survey — collects user profile data to personalize AI.
 * Also includes the interactive tutorial system.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  profession: string;
  experienceLevel: "beginner" | "intermediate" | "advanced" | "expert";
  goals: string[];
  interests: string[];
  workStyle: "visual" | "text" | "hands-on" | "research";
  preferredLanguage: string;
  timezone: string;
  surveyCompleted: boolean;
  tutorialCompleted: boolean;
  tutorialStep: number;
}

interface ProfileState extends UserProfile {
  setProfile: (patch: Partial<UserProfile>) => void;
  completeSurvey: () => void;
  setTutorialStep: (step: number) => void;
  completeTutorial: () => void;
  reset: () => void;
}

const DEFAULT: UserProfile = {
  profession: "",
  experienceLevel: "intermediate",
  goals: [],
  interests: [],
  workStyle: "hands-on",
  preferredLanguage: "English",
  timezone: "Africa/Nairobi",
  surveyCompleted: false,
  tutorialCompleted: false,
  tutorialStep: 0,
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...DEFAULT,
      setProfile: (patch) => set((s) => ({ ...s, ...patch })),
      completeSurvey: () => set({ surveyCompleted: true }),
      setTutorialStep: (step) => set({ tutorialStep: step }),
      completeTutorial: () => set({ tutorialCompleted: true, tutorialStep: -1 }),
      reset: () => set(DEFAULT),
    }),
    { name: "spyro-profile" }
  )
);

// ── Survey questions config ────────────────────────────────────────────
export const SURVEY_STEPS = [
  {
    id: "profession",
    question: "What do you do?",
    subtitle: "This helps SPYRO tailor your workspace and AI responses",
    type: "choice" as const,
    options: [
      { value: "Software Developer", icon: "💻", desc: "Code, build, deploy" },
      { value: "Student", icon: "🎓", desc: "Learn, study, research" },
      { value: "Researcher", icon: "🔬", desc: "Papers, analysis, citations" },
      { value: "Designer", icon: "🎨", desc: "Visual, UX, creative" },
      { value: "Business Owner", icon: "💼", desc: "Manage, grow, scale" },
      { value: "Marketer", icon: "📣", desc: "Content, campaigns, social" },
      { value: "Writer", icon: "✍️", desc: "Articles, docs, books" },
      { value: "Data Analyst", icon: "📊", desc: "Data, charts, insights" },
      { value: "Other", icon: "⭐", desc: "Something else entirely" },
    ],
  },
  {
    id: "experienceLevel",
    question: "How comfortable are you with AI tools?",
    subtitle: "So we can explain things at the right level",
    type: "choice" as const,
    options: [
      { value: "beginner", icon: "🌱", desc: "New to AI — guide me through everything" },
      { value: "intermediate", icon: "⚡", desc: "I've used ChatGPT, Cursor, etc." },
      { value: "advanced", icon: "🚀", desc: "I build with AI regularly" },
      { value: "expert", icon: "🧠", desc: "I live and breathe AI" },
    ],
  },
  {
    id: "goals",
    question: "What do you want to achieve with SPYRO?",
    subtitle: "Pick all that apply — we'll prioritize these features",
    type: "multi" as const,
    options: [
      { value: "Write code faster", icon: "⚡", desc: "AI pair programming" },
      { value: "Research topics", icon: "🔍", desc: "Deep research with citations" },
      { value: "Create content", icon: "✍️", desc: "Articles, docs, social media" },
      { value: "Generate images", icon: "🎨", desc: "AI art and visuals" },
      { value: "Automate tasks", icon: "🤖", desc: "Background agents, workflows" },
      { value: "Manage projects", icon: "📋", desc: "Organize work in one place" },
      { value: "Connect WhatsApp", icon: "💬", desc: "AI replies from your number" },
      { value: "Analyze data", icon: "📊", desc: "Spreadsheets, charts, insights" },
      { value: "Build agents", icon: "🧩", desc: "Custom AI workers" },
      { value: "Write documents", icon: "📄", desc: "Reports, proposals, letters" },
    ],
  },
  {
    id: "interests",
    question: "What are you interested in?",
    subtitle: "We'll suggest relevant apps and templates",
    type: "multi" as const,
    options: [
      { value: "Web Development", icon: "🌐" },
      { value: "Mobile Apps", icon: "📱" },
      { value: "AI/ML", icon: "🤖" },
      { value: "Crypto/Web3", icon: "₿" },
      { value: "Design", icon: "🎨" },
      { value: "Business", icon: "💼" },
      { value: "Education", icon: "📚" },
      { value: "Science", icon: "🔬" },
      { value: "Music", icon: "🎵" },
      { value: "Gaming", icon: "🎮" },
    ],
  },
  {
    id: "workStyle",
    question: "How do you like to work?",
    subtitle: "SPYRO will adapt its interface to your style",
    type: "choice" as const,
    options: [
      { value: "visual", icon: "👁️", desc: "I prefer diagrams, charts, images" },
      { value: "text", icon: "📝", desc: "I prefer reading and writing" },
      { value: "hands-on", icon: "🔧", desc: "I learn by doing — give me tools" },
      { value: "research", icon: "🔬", desc: "I need deep analysis and sources" },
    ],
  },
];

// ── Tutorial steps ─────────────────────────────────────────────────────
export const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Welcome to SPYRO",
    description: "SPYRO is an AI Operating System — not just a chatbot. Let's take a quick tour.",
    highlight: null,
    action: "Let's go",
  },
  {
    id: "chat",
    title: "Chat with AI",
    description: "Click 'Chats' to start a conversation with SPYRO V1. Ask anything — code, research, writing. The AI streams responses in real-time.",
    highlight: "chat",
    action: "Next: Projects",
  },
  {
    id: "projects",
    title: "Organize with Projects",
    description: "Everything belongs to a project. Create projects to organize your chats, files, agents, and knowledge in one place.",
    highlight: "projects",
    action: "Next: Agents",
  },
  {
    id: "agents",
    title: "Build AI Agents",
    description: "Agents are persistent AI workers. Give them instructions, connect them to channels, and they work in the background — even when you're away.",
    highlight: "agents",
    action: "Next: Knowledge",
  },
  {
    id: "knowledge",
    title: "Build your Knowledge Base",
    description: "Upload PDFs, documents, and notes. SPYRO remembers everything and can search your knowledge semantically — like a second brain.",
    highlight: "knowledge",
    action: "Next: Communication",
  },
  {
    id: "communication",
    title: "Communication Center",
    description: "Connect WhatsApp, Email, Telegram. Assign AI agents to reply automatically. Manage all your messages in one unified inbox.",
    highlight: "communication",
    action: "Next: Studio",
  },
  {
    id: "studio",
    title: "Launch Studio for Deep Work",
    description: "Studio is a full IDE with real terminal, code editor, and AI tools. Run actual commands on the VPS, clone repos, execute code — it's a real development environment.",
    highlight: "studio",
    action: "Next: Search",
  },
  {
    id: "search",
    title: "Search Everything (⌘K)",
    description: "Press ⌘K (or Ctrl+K) anywhere to search projects, chats, files, agents, settings — everything. It's the fastest way to navigate SPYRO.",
    highlight: null,
    action: "Next: Done",
  },
  {
    id: "done",
    title: "You're all set! 🎉",
    description: "You now know the essentials. SPYRO will learn from how you use it and get smarter over time. Start by asking the AI anything — or explore Studio for deep work.",
    highlight: null,
    action: "Start using SPYRO",
  },
];
