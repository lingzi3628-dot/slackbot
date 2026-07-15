import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Send a 6-digit verification code to the user's email.
 * Called after registration — user must enter the code to activate.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    // Generate a 6-digit code.
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the code in the user's resetToken field (reused for verification).
    await db.user.update({
      where: { id: user.id },
      data: { resetToken: code, resetTokenExpiry: codeExpiry },
    });

    // Send the code via Gmail SMTP.
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `"SPYRO V1" <${gmailUser}>`,
        to: email,
        subject: "Your SPYRO V1 Verification Code",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #16110d; color: #f5ecd9; padding: 32px; border-radius: 16px;">
            <h1 style="color: #ff7a1a; margin: 0 0 8px;">🐉 SPYRO V1</h1>
            <p style="font-size: 15px; line-height: 1.6;">Hi ${user.name},</p>
            <p style="font-size: 15px; line-height: 1.6;">Here's your verification code:</p>
            <div style="text-align: center; margin: 24px 0;">
              <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff7a1a; background: rgba(255,122,26,0.1); padding: 16px 32px; border-radius: 12px; display: inline-block;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #a99c87;">This code expires in 10 minutes. Enter it in the app to activate your account.</p>
            <p style="font-size: 12px; color: #a99c87; margin-top: 24px;">— SPYRO Labs, Kenya 🇰🇪</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Verification code sent to your email.",
      // In dev (no Gmail configured), return the code for testing.
      ...((!gmailUser || !gmailPass) && { devCode: code }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send code. Database may not be configured." },
      { status: 500 }
    );
  }
}
