import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EXEC_BACKEND_URL = process.env.EXEC_BACKEND_URL || "http://seth1.sethtech.duckdns.org/studio-api";

/**
 * POST /api/studio/git-clone
 * Proxy: clones a git repo on the VPS backend.
 * Body: { url: "https://github.com/user/repo.git" }
 */
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const res = await fetch(`${EXEC_BACKEND_URL}/git-clone`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[studio/git-clone] proxy error:", err);
    return NextResponse.json(
      { error: "Exec backend unavailable", output: `Connection failed: ${err instanceof Error ? err.message : "unknown"}`, success: false },
      { status: 502 }
    );
  }
}
