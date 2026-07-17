import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXEC_BACKEND_URL = process.env.EXEC_BACKEND_URL || "http://64.181.198.8:3003";

/**
 * GET /api/studio/files
 * Proxy: lists files in the VPS workspace.
 */
export async function GET() {
  try {
    const res = await fetch(`${EXEC_BACKEND_URL}/files`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ files: [], error: "Backend unavailable" }, { status: 502 });
  }
}
