import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EXEC_BACKEND_URL = process.env.EXEC_BACKEND_URL || "http://seth1.sethtech.duckdns.org/studio-api";

// Blocked commands — never allowed even for authenticated users
const BLOCKED_COMMANDS = [
  "rm -rf /", "mkfs", "dd if=", ":(){ :|:&", "shutdown", "reboot",
  "init 0", "halt", "poweroff", "wget http", "curl http://malicious",
];

/**
 * POST /api/studio/exec
 * Proxy: executes a real shell command on the VPS backend.
 * REQUIRES: authenticated user session (prevents anonymous shell access)
 * Body: { command: "ls -la" }
 */
export async function POST(req: NextRequest) {
  // Auth check — must be logged in
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Check for blocked commands
    const cmd = body.command || "";
    if (BLOCKED_COMMANDS.some(b => cmd.toLowerCase().includes(b.toLowerCase()))) {
      return NextResponse.json({ error: "Command blocked for safety", output: "⚠️ This command is blocked." }, { status: 403 });
    }
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
