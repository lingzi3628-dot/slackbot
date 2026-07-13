import { NextResponse } from "next/server";
import { getIntegrations } from "@/lib/integrations/registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the list of all registered integrations + their live status.
 * Used by the web UI's integrations panel.
 */
export async function GET() {
  return NextResponse.json({
    integrations: getIntegrations(),
    total: getIntegrations().length,
    connected: getIntegrations().filter((i) => i.status === "connected").length,
  });
}
