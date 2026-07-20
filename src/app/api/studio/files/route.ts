import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXEC_BACKEND_URL = process.env.EXEC_BACKEND_URL || "http://seth1.sethtech.duckdns.org/studio-api";

/**
 * GET /api/studio/files
 * Proxy: lists files in the VPS workspace.
 */
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ files: [], error: "Authentication required" }, { status: 401 });
  }

  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/files`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ files: [], error: "Backend unavailable" }, { status: 502 });
  }
}
