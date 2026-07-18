import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, createAdminSession } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/login
 * Body: { email, password }
 * Separate auth from user platform — admin-only.
 */
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const admin = await verifyAdminPassword(email.trim(), password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials or account disabled" }, { status: 401 });
    }

    await createAdminSession(admin);

    return NextResponse.json({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
  } catch (err) {
    console.error("[admin/login] error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
