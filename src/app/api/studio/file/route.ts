import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXEC_BACKEND_URL = process.env.EXEC_BACKEND_URL || "http://seth1.sethtech.duckdns.org/studio-api";

/**
 * POST /api/studio/file
 * Proxy: read or write a file on the VPS workspace.
 * Body: { path: "file.js", content: "...", action: "read" | "write" }
 */
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${EXEC_BACKEND_URL}/file`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "Backend unavailable" }, { status: 502 });
  }
}
