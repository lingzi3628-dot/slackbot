import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ForgotPasswordBody {
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as ForgotPasswordBody;
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Don't reveal whether the email exists — return success.
      return NextResponse.json({ ok: true, message: "If an account exists, a reset link has been sent." });
    }

    // Generate a reset token (random string).
    const resetToken = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: expiry },
    });

    // Send email via Gmail SMTP.
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin") || "https://slackbot-seven.vercel.app";

    if (gmailUser && gmailPass) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailPass },
      });

      const resetUrl = `${appUrl}/?reset=${resetToken}`;

      await transporter.sendMail({
        from: `"SPYRO V1" <${gmailUser}>`,
        to: email,
        subject: "SPYRO V1 — Password Reset",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #16110d; color: #f5ecd9; padding: 32px; border-radius: 16px;">
            <h1 style="color: #ff7a1a; margin: 0 0 16px;">🐉 SPYRO V1</h1>
            <p style="font-size: 15px; line-height: 1.6;">Hi ${user.name},</p>
            <p style="font-size: 15px; line-height: 1.6;">You requested a password reset for your SPYRO V1 account. Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff7a1a, #e8421b); color: white; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; margin: 16px 0;">Reset Password</a>
            <p style="font-size: 12px; color: #a99c87; margin-top: 24px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
            <p style="font-size: 12px; color: #a99c87;">— SPYRO Labs, Kenya 🇰🇪</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists, a reset link has been sent to your email.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to send reset email. Database may not be configured." },
      { status: 500 }
    );
  }
}
