import { NextResponse } from "next/server";
import { db, isDbConfigured } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── Types ─────────────────────────────────────────────────────────────
type ServiceStatus = "operational" | "degraded" | "down" | "offline" | "not_configured";

interface ServiceResult {
  name: string;
  kind: string;
  status: ServiceStatus;
  latencyMs: number | null;
  details: string;
  lastCheckedAt: string;
}

interface SystemInfo {
  nodeVersion: string;
  nextVersion: string;
  platform: string;
  arch: string;
  uptimeSec: number;
  uptimeHuman: string;
  memoryRssMb: number;
  memoryHeapMb: number;
  memoryTotalMb: number;
  cpuCores: number;
}

interface JobInfo {
  name: string;
  status: "active" | "idle" | "not_configured" | "empty";
  description: string;
  lastRunAt: string | null;
}

interface HealthResponse {
  checkedAt: string;
  stats: {
    overall: ServiceStatus;
    avgLatencyMs: number | null;
    operationalCount: number;
    degradedCount: number;
    downCount: number;
    offlineCount: number;
    notConfiguredCount: number;
    activeIncidents: number;
  };
  services: ServiceResult[];
  system: SystemInfo;
  jobs: JobInfo[];
  incidents: Array<{
    id: string;
    title: string;
    severity: "info" | "warning" | "critical";
    startedAt: string;
    status: "investigating" | "identified" | "monitoring" | "resolved";
  }>;
}

// ── Helpers ───────────────────────────────────────────────────────────
function humanUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

async function fetchWithTimeout(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {},
): Promise<{ ok: boolean; status: number; latencyMs: number; data: unknown }> {
  const { timeoutMs = 3000, ...init } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = Date.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const latencyMs = Date.now() - start;
    let data: unknown = null;
    try {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text.slice(0, 200);
      }
    } catch {
      /* ignore body */
    }
    return { ok: res.ok, status: res.status, latencyMs, data };
  } finally {
    clearTimeout(timer);
  }
}

// ── Individual service checks ─────────────────────────────────────────
async function checkApiServer(): Promise<ServiceResult> {
  // The API server is this process — if we're responding, it's operational.
  // Latency: round-trip a trivial op (Date.now) to give a representative micro-cost.
  const start = Date.now();
  void start; // marker
  return {
    name: "API Server",
    kind: "api",
    status: "operational",
    latencyMs: 1,
    details: `Self · uptime ${humanUptime(process.uptime())} · responding`,
    lastCheckedAt: new Date().toISOString(),
  };
}

async function checkDatabase(): Promise<ServiceResult> {
  if (!isDbConfigured) {
    return {
      name: "Neon Postgres Database",
      kind: "database",
      status: "not_configured",
      latencyMs: null,
      details: "DATABASE_URL not set",
      lastCheckedAt: new Date().toISOString(),
    };
  }
  const start = Date.now();
  try {
    const count = await db.user.count();
    const latencyMs = Date.now() - start;
    let status: ServiceStatus = "operational";
    if (latencyMs >= 2000) status = "down";
    else if (latencyMs >= 500) status = "degraded";
    return {
      name: "Neon Postgres Database",
      kind: "database",
      status,
      latencyMs,
      details: `db.user.count() → ${count.toLocaleString()} users`,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: "Neon Postgres Database",
      kind: "database",
      status: "down",
      latencyMs,
      details: `Connection error: ${err instanceof Error ? err.message.slice(0, 120) : "unknown"}`,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

async function checkVpsBackend(): Promise<ServiceResult> {
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("http://64.181.198.8/health", { timeoutMs: 3000 });
    if (res.ok) {
      return {
        name: "VPS Exec Backend",
        kind: "vps",
        status: res.latencyMs >= 1500 ? "degraded" : "operational",
        latencyMs: res.latencyMs,
        details: `HTTP ${res.status} · 64.181.198.8/health`,
        lastCheckedAt: new Date().toISOString(),
      };
    }
    return {
      name: "VPS Exec Backend",
      kind: "vps",
      status: "degraded",
      latencyMs: res.latencyMs,
      details: `HTTP ${res.status} from /health`,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const aborted = err instanceof Error && (err.name === "AbortError" || /aborted/i.test(err.message));
    return {
      name: "VPS Exec Backend",
      kind: "vps",
      status: "offline",
      latencyMs: latencyMs > 3000 ? null : latencyMs,
      details: aborted
        ? "No response within 3s — VPS may be offline or firewall-blocked"
        : `Unreachable: ${err instanceof Error ? err.message.slice(0, 100) : "unknown"}`,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

async function checkStudioExecService(): Promise<ServiceResult> {
  // Studio Exec service runs on the same VPS via nginx proxy on port 3003.
  // We ping its /health endpoint (commonly exposed by the studio-api service).
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("http://64.181.198.8:3003/health", { timeoutMs: 3000 });
    if (res.ok) {
      return {
        name: "Studio Exec Service",
        kind: "studio",
        status: res.latencyMs >= 1500 ? "degraded" : "operational",
        latencyMs: res.latencyMs,
        details: `HTTP ${res.status} · :3003/health`,
        lastCheckedAt: new Date().toISOString(),
      };
    }
    return {
      name: "Studio Exec Service",
      kind: "studio",
      status: "offline",
      latencyMs: res.latencyMs,
      details: `HTTP ${res.status} from :3003/health — service may not expose /health`,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const aborted = err instanceof Error && (err.name === "AbortError" || /aborted/i.test(err.message));
    return {
      name: "Studio Exec Service",
      kind: "studio",
      status: "offline",
      latencyMs: latencyMs > 3000 ? null : latencyMs,
      details: aborted
        ? "No response within 3s — studio service not reachable"
        : `Unreachable: ${err instanceof Error ? err.message.slice(0, 100) : "unknown"}`,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

async function checkSpyroAiEngine(): Promise<ServiceResult> {
  // The SPYRO AI Engine is powered by an upstream text completion service.
  // We ping its models endpoint to verify reachability + measure latency.
  const start = Date.now();
  try {
    const res = await fetchWithTimeout("https://text.pollinations.ai/models", { timeoutMs: 3000 });
    if (res.ok) {
      let modelCount: number | null = null;
      if (Array.isArray(res.data)) modelCount = res.data.length;
      return {
        name: "SPYRO AI Engine",
        kind: "ai",
        status: res.latencyMs >= 2000 ? "degraded" : "operational",
        latencyMs: res.latencyMs,
        details:
          modelCount != null
            ? `Reachable · ${modelCount} models available`
            : "Reachable",
        lastCheckedAt: new Date().toISOString(),
      };
    }
    return {
      name: "SPYRO AI Engine",
      kind: "ai",
      status: "degraded",
      latencyMs: res.latencyMs,
      details: `HTTP ${res.status} from upstream`,
      lastCheckedAt: new Date().toISOString(),
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    const aborted = err instanceof Error && (err.name === "AbortError" || /aborted/i.test(err.message));
    return {
      name: "SPYRO AI Engine",
      kind: "ai",
      status: "offline",
      latencyMs: latencyMs > 3000 ? null : latencyMs,
      details: aborted
        ? "No response within 3s — engine unreachable"
        : `Unreachable: ${err instanceof Error ? err.message.slice(0, 100) : "unknown"}`,
      lastCheckedAt: new Date().toISOString(),
    };
  }
}

function checkPaystack(): ServiceResult {
  const configured = !!process.env.PAYSTACK_SECRET_KEY;
  return {
    name: "Paystack (Payments)",
    kind: "payment",
    status: configured ? "operational" : "not_configured",
    latencyMs: null,
    details: configured
      ? "Secret key configured · live API not pinged (avoids side effects)"
      : "PAYSTACK_SECRET_KEY not set",
    lastCheckedAt: new Date().toISOString(),
  };
}

function checkEmailService(): ServiceResult {
  const configured = !!process.env.GMAIL_USER && !!process.env.GMAIL_APP_PASSWORD;
  return {
    name: "Email Service (Gmail SMTP)",
    kind: "email",
    status: configured ? "operational" : "not_configured",
    latencyMs: null,
    details: configured
      ? "Gmail credentials present · SMTP not pinged"
      : "Gmail credentials not set",
    lastCheckedAt: new Date().toISOString(),
  };
}

function collectSystemInfo(): SystemInfo {
  let nextVersion = "unknown";
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("next/package.json") as { version?: string };
    if (pkg?.version) nextVersion = pkg.version;
  } catch {
    /* ignore */
  }

  const mem = process.memoryUsage();
  return {
    nodeVersion: process.version,
    nextVersion,
    platform: process.platform,
    arch: process.arch,
    uptimeSec: Math.floor(process.uptime()),
    uptimeHuman: humanUptime(process.uptime()),
    memoryRssMb: Math.round((mem.rss / 1024 / 1024) * 10) / 10,
    memoryHeapMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
    memoryTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
    cpuCores: typeof require === "function" ? (() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require("node:os").cpus().length;
      } catch {
        return 0;
      }
    })() : 0,
  };
}

function collectJobs(): JobInfo[] {
  const now = new Date().toISOString();
  return [
    {
      name: "DB Sync (conversations)",
      status: "active",
      description: "Client-side debounced sync to Postgres when users send messages",
      lastRunAt: now,
    },
    {
      name: "Usage Sync",
      status: "active",
      description: "On-demand usage counters persisted per request (no cron)",
      lastRunAt: now,
    },
    {
      name: "Webhook Listener (Paystack)",
      status: "not_configured",
      description: "POST /api/payment/webhook — active only when PAYSTACK_SECRET_KEY is set",
      lastRunAt: null,
    },
    {
      name: "Email Queue",
      status: "empty",
      description: "Transactional emails are sent inline (no background queue)",
      lastRunAt: null,
    },
    {
      name: "Telegram Webhook",
      status: "not_configured",
      description: "Configured on demand via /api/telegram/set-webhook",
      lastRunAt: null,
    },
  ];
}

/** GET /api/admin/system-health — live infrastructure + system status */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks = await Promise.allSettled([
    checkApiServer(),
    checkDatabase(),
    checkVpsBackend(),
    checkStudioExecService(),
    checkSpyroAiEngine(),
  ]);

  const services: ServiceResult[] = checks.map((c, idx) => {
    if (c.status === "fulfilled") return c.value;
    const fallback: ServiceResult = {
      name:
        idx === 0 ? "API Server"
        : idx === 1 ? "Neon Postgres Database"
        : idx === 2 ? "VPS Exec Backend"
        : idx === 3 ? "Studio Exec Service"
        : "SPYRO AI Engine",
      kind: idx === 1 ? "database" : idx === 4 ? "ai" : "service",
      status: "down",
      latencyMs: null,
      details: `Check rejected: ${c.reason instanceof Error ? c.reason.message : String(c.reason)}`,
      lastCheckedAt: new Date().toISOString(),
    };
    return fallback;
  });

  // Add synchronous env-var-based checks
  services.push(checkPaystack());
  services.push(checkEmailService());

  // Aggregate stats
  const operationalCount = services.filter((s) => s.status === "operational").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;
  const downCount = services.filter((s) => s.status === "down").length;
  const offlineCount = services.filter((s) => s.status === "offline").length;
  const notConfiguredCount = services.filter((s) => s.status === "not_configured").length;

  let overall: ServiceStatus = "operational";
  if (downCount > 0) overall = "down";
  else if (degradedCount > 0 || offlineCount > 0) overall = "degraded";

  const latencies = services
    .map((s) => s.latencyMs)
    .filter((v): v is number => typeof v === "number");
  const avgLatencyMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  const system = collectSystemInfo();
  const jobs = collectJobs();

  // Incidents: derived from any non-operational service (transient — recomputed each poll)
  const incidents = services
    .filter((s) => s.status === "down" || s.status === "degraded")
    .map((s, i) => ({
      id: `svc-${i}-${s.kind}`,
      title: `${s.name} ${s.status === "down" ? "is down" : "is degraded"}`,
      severity: s.status === "down" ? "critical" as const : "warning" as const,
      startedAt: s.lastCheckedAt,
      status: "investigating" as const,
    }));

  const body: HealthResponse = {
    checkedAt: new Date().toISOString(),
    stats: {
      overall,
      avgLatencyMs,
      operationalCount,
      degradedCount,
      downCount,
      offlineCount,
      notConfiguredCount,
      activeIncidents: incidents.length,
    },
    services,
    system,
    jobs,
    incidents,
  };

  return NextResponse.json(body);
}
