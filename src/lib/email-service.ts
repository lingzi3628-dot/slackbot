/**
 * Email service — sends transactional emails via Gmail SMTP.
 *
 * V8 (round 2): Used by the registration flow to send verification emails.
 *
 * Configuration (env vars):
 *  - GMAIL_USER: the Gmail address (e.g. spyro.notifications@gmail.com)
 *  - GMAIL_APP_PASSWORD: 16-char app password from Google Account
 *
 * If not configured, emails are skipped (logged in dev) — registration
 * still succeeds, the user just won't get a verification link.
 */

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    if (process.env.NODE_ENV === "production") {
      console.error("[email] GMAIL_USER or GMAIL_APP_PASSWORD not set — cannot send emails.");
    } else {
      console.warn("[email] GMAIL credentials not set — email sending skipped in dev.");
    }
    return null;
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

/** Send an email verification link to a new user. */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyUrl: string
): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.warn(`[email] Skipped verification email to ${email} (no SMTP). URL: ${verifyUrl}`);
    return;
  }

  const from = process.env.GMAIL_USER || "noreply@spyrolabs.com";

  await t.sendMail({
    from: `"SPYRO V1" <${from}>`,
    to: email,
    subject: "Verify your SPYRO V1 account",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ff7a1a; margin: 0;">🐉 SPYRO V1</h1>
        </div>
        <h2>Verify your email</h2>
        <p>Hi ${name},</p>
        <p>Welcome to SPYRO V1! Please verify your email address to activate your account:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verifyUrl}"
             style="background: linear-gradient(135deg, #ff7a1a, #e8421b);
                    color: white; padding: 14px 32px; text-decoration: none;
                    border-radius: 8px; font-weight: 600; display: inline-block;">
            Verify Email
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy this link: <br>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">
          This link expires in 24 hours. If you didn't create an account, you can ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #999; font-size: 12px;">
          SPYRO Labs · Kenya, East Africa
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nWelcome to SPYRO V1! Verify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  });
}

/** Send a password reset email. */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.warn(`[email] Skipped password reset email to ${email} (no SMTP).`);
    return;
  }

  const from = process.env.GMAIL_USER || "noreply@spyrolabs.com";

  await t.sendMail({
    from: `"SPYRO V1" <${from}>`,
    to: email,
    subject: "Reset your SPYRO V1 password",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #ff7a1a; margin: 0;">🐉 SPYRO V1</h1>
        </div>
        <h2>Reset your password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password. Click below to choose a new one:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: linear-gradient(135deg, #ff7a1a, #e8421b);
                    color: white; padding: 14px 32px; text-decoration: none;
                    border-radius: 8px; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #999; font-size: 12px;">
          This link expires in 1 hour. If you didn't request a reset, ignore this email.
        </p>
      </div>
    `,
    text: `Hi ${name},\n\nReset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
  });
}
