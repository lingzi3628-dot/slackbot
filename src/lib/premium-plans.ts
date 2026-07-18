/**
 * SPYRO Premium Plans — pricing tiers in Kenyan Shillings (KES).
 * Integrates with Paystack for payments (supports M-Pesa, cards, bank transfer).
 */

export type PlanId = "free" | "pro" | "plus" | "ultra" | "business" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceKES: number;
  priceLabel: string;
  period: string;
  tagline: string;
  highlight?: boolean;
  features: {
    tokens: number;            // monthly AI tokens
    terminal: boolean;         // access to real VPS terminal
    agents: boolean;           // can build AI agents
    imageGen: number;          // images per month (0 = none)
    emailVerif: number;        // email verification codes per month
    studio: boolean;           // SPYRO Studio access
    whatsapp: boolean;         // WhatsApp connection
    knowledge: number;         // knowledge docs limit
    storage: string;           // storage limit
    backgroundJobs: number;    // concurrent background jobs
    apiAccess: boolean;        // API keys
    teamMembers: number;       // 0 = solo
    prioritySupport: boolean;
    customAgents: number;      // max custom agents
    publicUrls: number;        // public hosted URLs
  };
  featureList: string[];       // human-readable features for display
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceKES: 0,
    priceLabel: "KSh 0",
    period: "forever",
    tagline: "Get started with SPYRO",
    features: {
      tokens: 1000,
      terminal: false,
      agents: false,
      imageGen: 3,
      emailVerif: 3,
      studio: false,
      whatsapp: false,
      knowledge: 5,
      storage: "100 MB",
      backgroundJobs: 0,
      apiAccess: false,
      teamMembers: 0,
      prioritySupport: false,
      customAgents: 0,
      publicUrls: 0,
    },
    featureList: [
      "1,000 AI tokens per month",
      "3 image generations",
      "3 email verifications",
      "5 knowledge documents",
      "100 MB storage",
      "Basic chat with SPYRO V1",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceKES: 499,
    priceLabel: "KSh 499",
    period: "per month",
    tagline: "For individual professionals",
    highlight: true,
    features: {
      tokens: 50000,
      terminal: true,
      agents: true,
      imageGen: 100,
      emailVerif: 50,
      studio: true,
      whatsapp: true,
      knowledge: 100,
      storage: "5 GB",
      backgroundJobs: 2,
      apiAccess: true,
      teamMembers: 0,
      prioritySupport: false,
      customAgents: 3,
      publicUrls: 1,
    },
    featureList: [
      "50,000 AI tokens per month",
      "Real VPS terminal access",
      "Build up to 3 AI agents",
      "100 image generations",
      "50 email verifications",
      "SPYRO Studio (IDE + terminal)",
      "WhatsApp connection",
      "100 knowledge documents",
      "5 GB storage",
      "2 background jobs",
      "API access",
      "1 public URL",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    priceKES: 1299,
    priceLabel: "KSh 1,299",
    period: "per month",
    tagline: "For power users & creators",
    features: {
      tokens: 200000,
      terminal: true,
      agents: true,
      imageGen: 500,
      emailVerif: 200,
      studio: true,
      whatsapp: true,
      knowledge: 500,
      storage: "20 GB",
      backgroundJobs: 5,
      apiAccess: true,
      teamMembers: 3,
      prioritySupport: true,
      customAgents: 10,
      publicUrls: 5,
    },
    featureList: [
      "200,000 AI tokens per month",
      "Real VPS terminal access",
      "Build up to 10 AI agents",
      "500 image generations",
      "200 email verifications",
      "SPYRO Studio (IDE + terminal)",
      "WhatsApp connection",
      "500 knowledge documents",
      "20 GB storage",
      "5 background jobs",
      "API access",
      "3 team members",
      "5 public URLs",
      "Priority support",
    ],
  },
  {
    id: "ultra",
    name: "Ultra",
    priceKES: 2999,
    priceLabel: "KSh 2,999",
    period: "per month",
    tagline: "For serious developers & teams",
    features: {
      tokens: 1000000,
      terminal: true,
      agents: true,
      imageGen: 2000,
      emailVerif: 1000,
      studio: true,
      whatsapp: true,
      knowledge: 2000,
      storage: "100 GB",
      backgroundJobs: 20,
      apiAccess: true,
      teamMembers: 10,
      prioritySupport: true,
      customAgents: 50,
      publicUrls: 20,
    },
    featureList: [
      "1,000,000 AI tokens per month",
      "Real VPS terminal access",
      "Build up to 50 AI agents",
      "2,000 image generations",
      "1,000 email verifications",
      "SPYRO Studio (IDE + terminal)",
      "WhatsApp + Email + Telegram",
      "2,000 knowledge documents",
      "100 GB storage",
      "20 background jobs",
      "API access",
      "10 team members",
      "20 public URLs",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceKES: 7999,
    priceLabel: "KSh 7,999",
    period: "per month",
    tagline: "For growing businesses",
    features: {
      tokens: 5000000,
      terminal: true,
      agents: true,
      imageGen: 10000,
      emailVerif: 5000,
      studio: true,
      whatsapp: true,
      knowledge: 10000,
      storage: "500 GB",
      backgroundJobs: 100,
      apiAccess: true,
      teamMembers: 50,
      prioritySupport: true,
      customAgents: 200,
      publicUrls: 100,
    },
    featureList: [
      "5,000,000 AI tokens per month",
      "Real VPS terminal + Docker",
      "Build up to 200 AI agents",
      "10,000 image generations",
      "5,000 email verifications",
      "SPYRO Studio (full IDE)",
      "All communication channels",
      "10,000 knowledge documents",
      "500 GB storage",
      "100 background jobs",
      "API access + webhooks",
      "50 team members",
      "100 public URLs",
      "Priority support + SLA",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceKES: 24999,
    priceLabel: "KSh 24,999",
    period: "per month",
    tagline: "For large organizations",
    features: {
      tokens: -1, // unlimited
      terminal: true,
      agents: true,
      imageGen: -1, // unlimited
      emailVerif: -1, // unlimited
      studio: true,
      whatsapp: true,
      knowledge: -1, // unlimited
      storage: "2 TB",
      backgroundJobs: -1, // unlimited
      apiAccess: true,
      teamMembers: -1, // unlimited
      prioritySupport: true,
      customAgents: -1, // unlimited
      publicUrls: -1, // unlimited
    },
    featureList: [
      "Unlimited AI tokens",
      "Real VPS terminal + Docker + GPU",
      "Unlimited AI agents",
      "Unlimited image generations",
      "Unlimited email verifications",
      "SPYRO Studio (full IDE)",
      "All communication channels",
      "Unlimited knowledge documents",
      "2 TB storage",
      "Unlimited background jobs",
      "API access + webhooks + SSO",
      "Unlimited team members",
      "Unlimited public URLs",
      "Dedicated support + SLA + onboarding",
    ],
  },
];

export function getPlan(id: PlanId): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatKES(amount: number): string {
  return `KSh ${amount.toLocaleString("en-KE")}`;
}
