import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/db/sync-usage
 * Syncs the user's token/image/email usage to the database.
 * Body: { tokens, images, emails }
 * Creates or updates the UsageRecord for the current month.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { tokens, images, emails } = await req.json();
    const monthKey = new Date().toISOString().slice(0, 7); // "2026-07"

    // Upsert the usage record
    const usage = await db.usageRecord.upsert({
      where: {
        userId_monthKey: {
          userId: session.userId,
          monthKey,
        },
      },
      update: {
        tokensUsed: tokens ?? undefined,
        imagesUsed: images ?? undefined,
        emailsUsed: emails ?? undefined,
      },
      create: {
        userId: session.userId,
        monthKey,
        tokensUsed: tokens || 0,
        imagesUsed: images || 0,
        emailsUsed: emails || 0,
      },
    });

    return NextResponse.json({ ok: true, usage });
  } catch (err) {
    console.error("[db/sync-usage] error:", err);
    return NextResponse.json({ error: "Failed to sync usage" }, { status: 500 });
  }
}

/**
 * GET /api/db/sync-usage
 * Returns the user's current month usage.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const monthKey = new Date().toISOString().slice(0, 7);
    const usage = await db.usageRecord.findUnique({
      where: {
        userId_monthKey: {
          userId: session.userId,
          monthKey,
        },
      },
    });

    return NextResponse.json({
      tokensUsed: usage?.tokensUsed || 0,
      imagesUsed: usage?.imagesUsed || 0,
      emailsUsed: usage?.emailsUsed || 0,
      monthKey,
    });
  } catch (err) {
    console.error("[db/sync-usage] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 });
  }
}
