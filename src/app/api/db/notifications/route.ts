import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/db/notifications
 * Returns notifications for the current user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: session.userId, archived: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("[db/notifications] error:", err);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * POST /api/db/notifications
 * Create a notification.
 * Body: { type, title, message, link? }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { type, title, message, link } = await req.json();
    const notification = await db.notification.create({
      data: {
        userId: session.userId,
        type: type || "system",
        title: title || "Notification",
        message: message || "",
        link: link || null,
      },
    });

    return NextResponse.json({ notification });
  } catch (err) {
    console.error("[db/notifications] POST error:", err);
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
  }
}

/**
 * PATCH /api/db/notifications
 * Mark as read or archive.
 * Body: { id, read?, archived? }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id, read, archived } = await req.json();
    await db.notification.updateMany({
      where: { id, userId: session.userId },
      data: {
        ...(read !== undefined && { read }),
        ...(archived !== undefined && { archived }),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[db/notifications] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
