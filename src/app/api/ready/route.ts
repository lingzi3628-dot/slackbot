import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public liveness endpoint for previews, load balancers, and mobile clients.
 * Keep this deliberately dependency-free: /api/health remains the authenticated
 * deep health check for administrators.
 */
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "spyro", timestamp: new Date().toISOString() },
    {
      status: 200,
      headers: {
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      },
    },
  );
}
