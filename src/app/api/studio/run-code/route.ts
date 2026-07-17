import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

const EXEC_BACKEND_URL = process.env.EXEC_BACKEND_URL || "http://seth1.sethtech.duckdns.org/studio-api";

/**
 * POST /api/studio/run-code
 * Proxy: executes code (JS/Python/Bash) on the VPS backend.
 * Body: { code: "print('hello')", language: "python", filename: "test.py" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${EXEC_BACKEND_URL}/run-code`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[studio/run-code] proxy error:", err);
    return NextResponse.json(
      { error: "Exec backend unavailable", output: `Connection failed: ${err instanceof Error ? err.message : "unknown"}`, exitCode: 1 },
      { status: 502 }
    );
  }
}
