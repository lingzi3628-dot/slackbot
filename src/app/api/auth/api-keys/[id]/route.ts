import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { revokeApiKey } from "@/lib/api-auth";
import { handleApiError } from "@/lib/error-handler";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/auth/api-keys/[id] — revoke (deactivate) an API key.
 *
 * #7 (hardening): Only the owner can revoke their own keys.
 * Audit logged.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id: keyId } = await params;
    if (!keyId) {
      return NextResponse.json({ error: "Key ID is required" }, { status: 400 });
    }

    const revoked = await revokeApiKey(keyId, session.userId);
    if (!revoked) {
      return NextResponse.json(
        { error: "API key not found or you don't have permission to revoke it." },
        { status: 404 }
      );
    }

    // Audit log
    try {
      await db.activityLog.create({
        data: {
          userId: session.userId,
          type: "api_key",
          description: `Revoked API key ${keyId} from ${getClientIp(req)}`,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "DELETE /api/auth/api-keys/[id]");
  }
}
