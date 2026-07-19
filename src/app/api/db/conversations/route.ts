import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/db/conversations
 * Returns all conversations + messages for the current user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const conversations = await db.conversation.findMany({
      where: { userId: session.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[db/conversations] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

/**
 * POST /api/db/conversations
 * Create or update a conversation with messages.
 * Body: { conversation: { id?, title, messages: [...] } }
 */
export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { conversation } = await req.json();
    if (!conversation) {
      return NextResponse.json({ error: "Conversation data required" }, { status: 400 });
    }

    // Try to find existing conversation by title (since client IDs differ from DB IDs)
    let dbConv = await db.conversation.findFirst({
      where: { userId: session.id, title: conversation.title },
      include: { messages: true },
    });

    if (!dbConv) {
      // Create new conversation
      dbConv = await db.conversation.create({
        data: {
          userId: session.id,
          title: conversation.title || "New chat",
          pinned: conversation.pinned || false,
        },
        include: { messages: true },
      });
    }

    // Defensive null check — findFirst can return null and create() should not, but TS can't narrow across assignments to `let`.
    if (!dbConv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Sync messages — only add new ones (compare by content + createdAt proximity)
    const existingMsgs = dbConv.messages || [];
    for (const msg of (conversation.messages || [])) {
      // Check if this message already exists (by content + role)
      const exists = existingMsgs.some((m: any) =>
        m.role === msg.role && m.content === msg.content
      );
      if (!exists) {
        await db.message.create({
          data: {
            conversationId: dbConv.id,
            role: msg.role,
            content: msg.content || "",
            type: msg.type || (msg.imageUrl ? "image" : "text"),
            imageUrl: msg.imageUrl || null,
            tokenCount: Math.ceil((msg.content || "").length / 4),
          },
        });
      }
    }

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: dbConv.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ id: dbConv.id, synced: true });
  } catch (err) {
    console.error("[db/conversations] POST error:", err);
    return NextResponse.json({ error: "Failed to sync conversation" }, { status: 500 });
  }
}

/**
 * DELETE /api/db/conversations?id=xxx
 * Delete a conversation.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Conversation ID required" }, { status: 400 });
    }

    await db.conversation.deleteMany({
      where: { id, userId: session.id },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[db/conversations] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
