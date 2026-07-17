import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/comms/evolution-api";
import { MOCK_AGENTS } from "@/lib/comms/evolution-api";
import type { ChannelType } from "@/lib/comms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/comms/agents
 * Returns the list of AI agents available for channel assignment.
 *
 * In production this would read from the DB. For now we serve the mock
 * assignment set so the UI is fully explorable.
 */
export async function GET() {
  return NextResponse.json({ agents: MOCK_AGENTS });
}

/**
 * PATCH /api/comms/agents
 * Body: { agentId, patch: Partial<AgentAssignment> }
 * Updates an agent's channel assignment or settings.
 * (Demo: no-op, just echoes back.)
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { agentId, patch } = body;
    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }
    const existing = MOCK_AGENTS.find((a) => a.agentId === agentId);
    if (!existing) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    Object.assign(existing, patch ?? {});
    return NextResponse.json({ agent: existing });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update agent" },
      { status: 500 }
    );
  }
}

// Reference to keep the channelType import meaningful for type-checking.
export type _ChannelTypeRef = ChannelType;
// Avoid unused-import lint when getProvider is only used by other routes.
void getProvider;
