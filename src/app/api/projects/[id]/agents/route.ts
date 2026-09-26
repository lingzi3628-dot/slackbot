import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

async function ownsProject(userId: string, id: string) {
  return db.project.findFirst({ where: { id, userId }, select: { id: true } });
}

export async function GET(req: NextRequest, context: Context) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await context.params;
  if (!(await ownsProject(session.userId, id))) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const agents = await db.agent.findMany({ where: { projectId: id, userId: session.userId }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true, description: true, instructions: true, avatar: true, status: true, model: true } });
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest, context: Context) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { id } = await context.params;
  if (!(await ownsProject(session.userId, id))) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
  const text = (key: string, fallback: string, max: number) => typeof body[key] === "string" && String(body[key]).trim() ? String(body[key]).trim().slice(0, max) : fallback;
  const name = text("name", "Project assistant", 80);
  const description = text("description", "", 500) || null;
  const instructions = text("instructions", "Help the user complete work for this project.", 4000);
  const agent = await db.agent.create({ data: { userId: session.userId, projectId: id, name, description, instructions }, select: { id: true, name: true, description: true, instructions: true, avatar: true, status: true, model: true } });
  return NextResponse.json({ agent }, { status: 201 });
}
