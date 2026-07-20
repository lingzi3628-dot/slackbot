/**
 * Prisma client wrapper — hardens the database connection.
 *
 * Responsibilities:
 *  1. Strip `channel_binding=require` from DATABASE_URL (Prisma can't parse it;
 *     Neon/Supabase sometimes append it). Keeps `sslmode=require` for TLS.
 *  2. Log a warning when stripping occurs (debugging aid — no secrets logged).
 *  3. Singleton cache to prevent connection exhaustion on serverless cold starts.
 *  4. Graceful fallback when DATABASE_URL is missing or malformed.
 *
 * CRITICAL: This module MUST run its URL resolution BEFORE PrismaClient is
 * instantiated. We resolve the URL and force-set process.env.DATABASE_URL
 * at module load time (before the PrismaClient constructor runs).
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

/** Normalize a Postgres connection string for Prisma. */
function normalizeDatabaseUrl(raw: string): string {
  let url = raw.trim().replace(/^["']|["']$/g, "");

  // Strip channel_binding=require (and channel_binding=disable, etc.)
  // Prisma doesn't understand this Neon/Supabase parameter and crashes on it.
  if (url.includes("channel_binding")) {
    const before = url;
    // Remove `channel_binding=require` whether it follows ? or &
    url = url
      .replace(/[?&]channel_binding=[^&]+/gi, "")
      // If we removed the leading ?, restore it on the first remaining param
      .replace(/[?&]{2,}/g, "?")
      .replace(/[?&]$/, "");
    if (before !== url) {
      // Don't log the URL itself (it contains the password). Log only that we stripped.
      console.warn(
        "[prisma] Stripped unsupported `channel_binding` parameter from DATABASE_URL. " +
          "Prisma cannot parse it; keeping sslmode for TLS."
      );
    }
  }

  return url;
}

/**
 * Load DATABASE_URL from multiple sources. Returns a normalized PostgreSQL URL.
 * If process.env.DATABASE_URL is a non-postgres URL (e.g. SQLite from a stray
 * `prisma db push`), it's ignored and we fall back to the .env file / POSTGRES_*.
 */
function resolveDatabaseUrl(): string | undefined {
  // 1. Check process.env — but ONLY if it's a PostgreSQL URL.
  //    (next.config.ts loads .env into process.env, so if .env has SQLite,
  //    process.env.DATABASE_URL will be the SQLite URL — we must ignore it.)
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && (envUrl.startsWith("postgresql://") || envUrl.startsWith("postgres://"))) {
    return normalizeDatabaseUrl(envUrl);
  }
  if (envUrl && !envUrl.startsWith("file:")) {
    console.error(
      `[prisma] WARNING: process.env.DATABASE_URL is "${envUrl.slice(0, 30)}..." (non-PostgreSQL). Falling back to .env file.`
    );
  }

  // 2. .env file (local dev — read manually in case process.env has a stale value)
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        const url = match[1].trim().replace(/^["']|["']$/g, "");
        if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
          const normalized = normalizeDatabaseUrl(url);
          // Force-set process.env so Prisma's internal validation passes
          process.env.DATABASE_URL = normalized;
          return normalized;
        }
        // If .env has a non-postgres URL, warn but continue to other sources
        if (url.startsWith("file:")) {
          console.warn("[prisma] .env has SQLite URL — ignoring, looking for PostgreSQL URL.");
        }
      }
    }
  } catch {
    /* ignore */
  }

  // 3. POSTGRES_URL (Vercel Postgres template)
  if (process.env.POSTGRES_URL) {
    const url = normalizeDatabaseUrl(process.env.POSTGRES_URL);
    process.env.DATABASE_URL = url;
    return url;
  }

  // 4. POSTGRES_PRISMA_URL (Vercel Postgres Prisma template)
  if (process.env.POSTGRES_PRISMA_URL) {
    const url = normalizeDatabaseUrl(
      process.env.POSTGRES_PRISMA_URL.replace(/&?channel_binding=require/g, "")
    );
    process.env.DATABASE_URL = url;
    return url;
  }

  // 5. Hardcoded fallback for this project (Neon) — ONLY in development,
  //    and ONLY if no env source provided a URL. This prevents total breakage
  //    when .env gets overwritten by `prisma db push` etc.
  //    In production, Vercel env vars will always be set (source 1 or 3).
  if (process.env.NODE_ENV !== "production") {
    const fallback = "postgresql://neondb_owner:npg_KaJnbm59NRHM@ep-silent-heart-ah1azq2h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
    console.warn("[prisma] Using hardcoded Neon fallback URL (dev only). Set DATABASE_URL in .env properly.");
    process.env.DATABASE_URL = fallback;
    return fallback;
  }

  return undefined;
}

const resolvedUrl = resolveDatabaseUrl();

if (!resolvedUrl) {
  console.warn("[prisma] DATABASE_URL not found. Database operations will fail.");
}

// ── Singleton cache (prevents connection exhaustion on cold starts) ──
const globalForPrisma = globalThis as unknown as {
  __prismaClient?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.__prismaClient ??
  new PrismaClient({
    ...(resolvedUrl && { datasourceUrl: resolvedUrl }),
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prismaClient = prisma;
}

export const isDbConfigured = !!resolvedUrl;

export default prisma;
