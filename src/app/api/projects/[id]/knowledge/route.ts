import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function ownedProject(userId: string, id: string) {
  return db.project.findFirst({ where: { id, userId }, select: { id: true } });
}

/** List indexed and pending knowledge belonging to a project. */
export async function GET(req: NextRequest, context: Context) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await context.params;
  if (!(await ownedProject(session.userId, id))) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const documents = await db.knowledgeDoc.findMany({
    where: { projectId: id, userId: session.userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, type: true, indexed: true, sizeBytes: true, createdAt: true },
  });
  return NextResponse.json({ documents });
}

/** Add text knowledge to a project. File extraction can build on this endpoint. */
export async function POST(req: NextRequest, context: Context) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await context.params;
  if (!(await ownedProject(session.userId, id))) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 100_000) : "";
  if (!title || !content) return NextResponse.json({ error: "Title and content are required" }, { status: 400 });

  const document = await db.knowledgeDoc.create({
    data: { userId: session.userId, projectId: id, title, content, type: "text", indexed: true, sizeBytes: Buffer.byteLength(content) },
    select: { id: true, title: true, type: true, indexed: true, sizeBytes: true, createdAt: true },
  });
  return NextResponse.json({ document }, { status: 201 });
}
