"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Rocket, Terminal, Database, GitBranch, Server, Shield, Zap,
  Cpu, HardDrive, Globe, Check, Lock, Sparkles, Cloud, Container,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VPSFeature {
  icon: typeof Rocket;
  title: string;
  description: string;
  status: "available" | "requires-vps" | "coming-soon";
  category: "compute" | "storage" | "network" | "security";
}

const VPS_FEATURES: VPSFeature[] = [
  {
    icon: Terminal,
    title: "Real Terminal",
    description: "Execute real Linux commands on your VPS — ls, cat, grep, python3, node, git, apt, and 100+ more. No simulation.",
    status: "available",
    category: "compute",
  },
  {
    icon: GitBranch,
    title: "Git Operations",
    description: "Clone, pull, push to real GitHub repos. Your code lives on the VPS, not in the browser.",
    status: "available",
    category: "compute",
  },
  {
    icon: Cpu,
    title: "Code Execution",
    description: "Run Python, JavaScript, Node.js, and Bash scripts on real hardware. Real stdout, real errors, real performance.",
    status: "available",
    category: "compute",
  },
  {
    icon: Container,
    title: "Docker Containers",
    description: "Build, run, and manage Docker/Podman containers. Deploy microservices directly from Studio.",
    status: "requires-vps",
    category: "compute",
  },
  {
    icon: Database,
    title: "Database Access",
    description: "Connect to PostgreSQL, MySQL, Redis, and MongoDB running on the VPS. Query, insert, manage data.",
    status: "requires-vps",
    category: "storage",
  },
  {
    icon: HardDrive,
    title: "Persistent File Storage",
    description: "Store files on the VPS filesystem. They survive restarts. Read, write, organize — like a real computer.",
    status: "available",
    category: "storage",
  },
  {
    icon: Server,
    title: "Background Services",
    description: "Run long-running processes — web servers, bots, scrapers, cron jobs. They keep running even when you close the browser.",
    status: "requires-vps",
    category: "compute",
  },
  {
    icon: Globe,
    title: "Public URL Hosting",
    description: "Deploy web apps and APIs with public URLs. Your VPS serves them to the internet 24/7.",
    status: "requires-vps",
    category: "network",
  },
  {
    icon: Shield,
    title: "Secure Shell (SSH)",
    description: "Full SSH access to your VPS from Studio. Manage users, permissions, and system config.",
    status: "requires-vps",
    category: "security",
  },
  {
    icon: Zap,
    title: "Webhook Endpoints",
    description: "Create public webhook URLs for your automations. Receive data from GitHub, Stripe, WhatsApp, and more.",
    status: "requires-vps",
    category: "network",
  },
  {
    icon: Cloud,
    title: "Backup & Sync",
    description: "Automatic backups of your workspace to the VPS. Restore anytime. Sync between devices.",
    status: "coming-soon",
    category: "storage",
  },
  {
    icon: Sparkles,
    title: "AI Model Hosting",
    description: "Run local AI models (Llama, Mistral) on the VPS GPU. Private, fast, no API costs.",
    status: "coming-soon",
    category: "compute",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: ["AI chat (SPYRO V1)", "Image generation", "Basic file management", "Community support"],
    current: true,
    cta: "Current plan",
  },
  {
    name: "VPS Connect",
    price: "$5/mo",
    period: "or use your own VPS",
    features: ["Everything in Free", "Real terminal execution", "Git clone/pull/push", "Code execution (Python/JS/Bash)", "Persistent file storage", "Background processes", "Public URL hosting", "Webhook endpoints"],
    current: false,
    cta: "Connect your VPS",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$19/mo",
    period: "billed monthly",
    features: ["Everything in VPS Connect", "Managed VPS (no setup)", "GPU AI model hosting", "Automatic backups", "Priority support", "Team collaboration", "Advanced analytics", "Custom domains"],
    current: false,
    cta: "Upgrade to Pro",
  },
];

export function VPSFeaturesPage() {
  return (
    <div className="ambient-mesh min-h-full">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl spyro-bg-gradient spyro-glow-strong">
            <Rocket className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">VPS-Powered Features</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Your VPS unlocks real computing power — terminal, code execution, git, databases, and more.
            No simulation. Everything runs on real hardware.
          </p>
        </motion.div>

        {/* Current VPS status */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15">
            <Server className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-emerald-400">VPS Connected</div>
            <div className="text-[11px] text-muted-foreground">64.181.198.8 · Oracle Linux 10 · 23GB RAM · Node 22 · Python 3.12 · Git 2.47</div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Online
          </div>
        </motion.div>

        {/* Features grid */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VPS_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.03 }}
              className={cn(
                "surface p-4",
                feature.status === "available" && "border-emerald-500/20",
                feature.status === "requires-vps" && "border-amber-500/20",
                feature.status === "coming-soon" && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between">
                <div className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl",
                  feature.status === "available" ? "bg-emerald-500/10" : feature.status === "requires-vps" ? "bg-amber-500/10" : "bg-secondary"
                )}>
                  <feature.icon className={cn(
                    "h-5 w-5",
                    feature.status === "available" ? "text-emerald-400" : feature.status === "requires-vps" ? "text-amber-400" : "text-muted-foreground"
                  )} />
                </div>
                {feature.status === "available" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400">
                    <Check className="h-2.5 w-2.5" /> Live
                  </span>
                )}
                {feature.status === "requires-vps" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-400">
                    <Server className="h-2.5 w-2.5" /> VPS
                  </span>
                )}
                {feature.status === "coming-soon" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                    <Lock className="h-2.5 w-2.5" /> Soon
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold">{feature.title}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Pricing plans */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <h2 className="text-center text-xl font-bold">Upgrade for more power</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">Your VPS is already connected — most features are included</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl border p-5",
                  plan.highlight ? "border-primary spyro-glow" : "border-border bg-card/40",
                  plan.current && "opacity-60"
                )}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full spyro-bg-gradient px-3 py-0.5 text-[10px] font-bold text-white">
                    BEST VALUE
                  </span>
                )}
                <h3 className="text-sm font-semibold">{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price}</span>
                  <span className="text-[11px] text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={plan.current}
                  className={cn(
                    "mt-4 w-full rounded-xl py-2 text-xs font-medium",
                    plan.current ? "border border-border bg-secondary text-muted-foreground" :
                    plan.highlight ? "spyro-bg-gradient text-white" : "border border-border bg-card hover:bg-secondary"
                  )}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Suggest features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 rounded-2xl border border-border bg-card/40 p-6 text-center"
        >
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h3 className="mt-2 text-lg font-bold">Have an idea for a feature?</h3>
          <p className="mt-1 text-sm text-muted-foreground">SPYRO is built to be extended. If your VPS can run it, we can build it.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {["Cron job scheduler", "Email server", "VPN host", "Game server", "CI/CD pipeline", "API gateway", "Message queue", "Log aggregator"].map((f) => (
              <span key={f} className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-[11px] text-muted-foreground">
                {f}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground/60">All of these are possible with your VPS + SPYRO Studio</p>
        </motion.div>
      </div>
    </div>
  );
}
