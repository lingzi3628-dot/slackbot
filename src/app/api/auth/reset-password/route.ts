import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ResetBody {
  token: string;
  password: string;
}

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as ResetBody;

    if (!token?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({ ok: true, message: "Password reset successfully. You can now log in." });
  } catch {
    return NextResponse.json(
      { error: "Reset failed. Database may not be configured." },
      { status: 500 }
    );
  }
}
