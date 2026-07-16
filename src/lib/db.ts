import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

// ── Load DATABASE_URL from multiple sources ───────────────────────────
function getDbUrl(): string | undefined {
  // 1. Check process.env (Vercel sets this)
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  // 2. Try .env file (local dev)
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^DATABASE_URL=(.+)$/m);
      if (match) {
        const url = match[1].trim().replace(/^["']|["']$/g, '');
        process.env.DATABASE_URL = url;
        return url;
      }
    }
  } catch {
    /* ignore */
  }

  // 3. Try POSTGRES_URL (Vercel Postgres template)
  if (process.env.POSTGRES_URL) {
    process.env.DATABASE_URL = process.env.POSTGRES_URL;
    return process.env.POSTGRES_URL;
  }

  // 4. Try POSTGRES_PRISMA_URL (Vercel Postgres Prisma template)
  if (process.env.POSTGRES_PRISMA_URL) {
    // Remove channel_binding if present (Prisma doesn't support it)
    const url = process.env.POSTGRES_PRISMA_URL.replace(/&?channel_binding=require/g, '');
    process.env.DATABASE_URL = url;
    return url;
  }

  return undefined;
}

const dbUrl = getDbUrl();

if (!dbUrl) {
  console.warn('[db] DATABASE_URL not found. Auth will use local fallback.');
} else if (dbUrl.includes('channel_binding')) {
  console.error('[db] DATABASE_URL contains channel_binding=require — Prisma will fail. Remove it from Vercel env vars.');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(dbUrl && { datasourceUrl: dbUrl }),
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export const isDbConfigured = !!dbUrl
