/**
 * Database client — re-exports the hardened Prisma wrapper from lib/prisma.ts.
 *
 * All existing imports `import { db } from "@/lib/db"` continue to work.
 * The actual connection logic (channel_binding stripping, singleton cache,
 * multi-source URL resolution) lives in lib/prisma.ts.
 *
 * @see src/lib/prisma.ts for the implementation.
 */
export { prisma as db, default } from "./prisma";
export { isDbConfigured } from "./prisma";
