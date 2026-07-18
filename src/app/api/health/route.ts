import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check — tests if the database connection is working.
 * Visit /api/health to see the DB status + env var info.
 */
export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const hasChannelBinding = dbUrl?.includes("channel_binding");

  const status: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL_set: !!dbUrl,
      DATABASE_URL_starts_with_postgres: dbUrl?.startsWith("postgresql://") || dbUrl?.startsWith("postgres://"),
      has_channel_binding: hasChannelBinding,
      GMAIL_USER_set: !!process.env.GMAIL_USER,
      GMAIL_APP_PASSWORD_set: !!process.env.GMAIL_APP_PASSWORD,
      FIREBASE_API_KEY_set: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    },
  };

  if (hasChannelBinding) {
    status.error = "DATABASE_URL contains 'channel_binding=require' which Prisma doesn't support. Remove it from your Vercel env var.";
    status.fix = "Remove 'channel_binding=require' from your DATABASE_URL env var. Prisma doesn't support it.";
    return NextResponse.json(status, { status: 500 });
  }

  // Try to connect to the DB.
  try {
    const { db } = await import("@/lib/db");
    const userCount = await db.user.count();
    status.database = "connected";
    status.userCount = userCount;
    return NextResponse.json(status);
  } catch (err) {
    status.database = "error";
    status.error = err instanceof Error ? err.message : "Unknown DB error";
    return NextResponse.json(status, { status: 500 });
  }
}
