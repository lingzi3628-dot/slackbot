import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EXEC_BACKEND_URL = process.env.EXEC_BACKEND_URL || "http://64.181.198.8:3003";

/**
 * POST /api/studio/exec
 * Proxy: executes a real shell command on the VPS backend.
 * Body: { command: "ls -la" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${EXEC_BACKEND_URL}/execute`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[studio/exec] proxy error:", err);
    return NextResponse.json(
      { error: "Exec backend unavailable", output: `Connection failed: ${err instanceof Error ? err.message : "unknown"}`, exitCode: 1 },
      { status: 502 }
    );
  }
}
