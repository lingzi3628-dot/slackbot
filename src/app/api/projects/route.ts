import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function cleanText(value: unknown, fallback: string, max: number) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : fallback;
}

/** List projects owned by the signed-in user. */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const projects = await db.project.findMany({
    where: { userId: session.userId, status: { not: "archived" } },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { conversations: true, agents: true, knowledge: true, files: true } },
    },
  });
  return NextResponse.json({ projects });
}

/** Create a project that belongs to the current user. */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = body && typeof body === "object" ? body as Record<string, unknown> : {};
  const name = cleanText(input.name, "Untitled project", 80);
  const description = cleanText(input.description, "", 500) || null;
  const color = /^#[0-9a-f]{6}$/i.test(String(input.color || ""))
    ? String(input.color)
    : "#8B5CF6";

  const project = await db.project.create({
    data: { userId: session.userId, name, description, color },
  });
  return NextResponse.json({ project }, { status: 201 });
}
