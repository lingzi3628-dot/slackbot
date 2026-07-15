import { PrismaClient } from '@prisma/client'

// Load DATABASE_URL from .env file if not set (Turbopack workaround).
function loadDbUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path');
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
  return undefined;
}

const dbUrl = loadDbUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: dbUrl,
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
