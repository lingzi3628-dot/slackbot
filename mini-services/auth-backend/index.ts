/**
 * SPYRO V1 Auth Backend — runs on the VPS (64.181.198.8).
 * 
 * This is a standalone Express server that handles:
 * - User registration (with bcrypt + Neon DB)
 * - User login (with session tokens)
 * - Session verification
 * - Password reset
 * - OTP code send/verify
 * 
 * The Vercel frontend proxies auth requests to this server via /api/auth/*
 * This offloads bcrypt hashing + DB queries from Vercel's 10s function timeout.
 * 
 * Deploy: copy to VPS, run with bun or pm2, nginx proxies /api/* to this server.
 */

import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";

const app = express();
const PORT = process.env.PORT || 3005;

// ── Prisma (Neon Postgres) ────────────────────────────────────────────
// Force the Neon URL — don't rely on process.env.DATABASE_URL (might be SQLite)
const NEON_URL = "postgresql://neondb_owner:npg_KaJnbm59NRHM@ep-silent-heart-ah1azq2h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";
process.env.DATABASE_URL = NEON_URL;

const prisma = new PrismaClient({
  datasourceUrl: NEON_URL,
});

// ── Middleware ────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: [
    "https://slackbot-seven.vercel.app",
    "https://spyro-v1.vercel.app",
    "http://localhost:3000",
  ],
  credentials: true,
}));
app.use(cookieParser());

// ── Session management ────────────────────────────────────────────────
const SESSION_COOKIE = "spyro_session";
const SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours

function createSessionToken(user: { id: string; email: string; name: string; role: string; avatarColor: string }): string {
  const data = { ...user, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  return Buffer.from(JSON.stringify(data)).toString("base64url");
}

function parseSessionToken(token: string): any | null {
  try {
    const data = JSON.parse(Buffer.from(token, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

function getSession(req: express.Request): any | null {
  const token = req.cookies[SESSION_COOKIE];
  if (!token) return null;
  return parseSessionToken(token);
}

// ── Health check ──────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "spyro-auth-backend", timestamp: new Date().toISOString() });
});

// ── Register ──────────────────────────────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    // Hash password (bcrypt cost 10 — fast on VPS)
    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const colors = ["#ff7a1a", "#e8421b", "#ff9a3c", "#ffd27a", "#8B5CF6", "#10b981"];
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        verified: true, // auto-verify
      },
    });

    // Audit log (fire-and-forget)
    prisma.activityLog.create({
      data: {
        userId: user.id,
        type: "auth",
        description: `New registration from ${req.ip}`,
      },
    }).catch(() => {});

    res.json({
      registered: true,
      needsVerification: false,
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
      message: "Account created. You can now log in.",
    });
  } catch (err) {
    console.error("[register] error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ── Login ─────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Dummy hash for constant-time comparison
    const dummyHash = "$2a$10$000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const hashToCompare = user?.password || dummyHash;
    const valid = await bcrypt.compare(password, hashToCompare);

    if (!user || !valid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Auto-verify if not verified
    if (!user.verified) {
      await prisma.user.update({ where: { id: user.id }, data: { verified: true } });
    }

    // Create session
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    });

    // Audit log (fire-and-forget)
    prisma.activityLog.create({
      data: {
        userId: user.id,
        type: "auth",
        description: `Successful login from ${req.ip}`,
      },
    }).catch(() => {});

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      role: user.role,
    });
  } catch (err) {
    console.error("[login] error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── Get current user ──────────────────────────────────────────────────
app.get("/api/auth/me", async (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.json({ user: null });
  }

  // Verify user still exists
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, name: true, email: true, role: true, avatarColor: true },
    });
    if (!user) {
      res.clearCookie(SESSION_COOKIE);
      return res.json({ user: null });
    }
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

// ── Logout ────────────────────────────────────────────────────────────
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie(SESSION_COOKIE);
  res.json({ ok: true, message: "Logged out" });
});

// ── Send OTP code ─────────────────────────────────────────────────────
app.post("/api/auth/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return res.json({ ok: true, message: "If an account exists, a code has been sent." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: code, resetTokenExpiry: codeExpiry },
    });

    // Return the code (since Gmail SMTP may not be configured on VPS)
    res.json({
      ok: true,
      devCode: code,
      message: "Code generated. Use the code below to verify.",
    });
  } catch (err) {
    console.error("[send-code] error:", err);
    res.status(500).json({ error: "Failed to send code" });
  }
});

// ── Verify OTP code ───────────────────────────────────────────────────
app.post("/api/auth/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email?.trim() || !code?.trim()) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.resetToken !== code || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: "Invalid or expired code" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null, verified: true },
    });

    const token = createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarColor: user.avatarColor,
    });

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    res.json({
      verified: true,
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarColor: user.avatarColor,
    });
  } catch (err) {
    console.error("[verify-code] error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ── Forgot password ───────────────────────────────────────────────────
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ error: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry: expiry },
      });
    }

    res.json({ ok: true, message: "If an account exists, a reset link has been sent." });
  } catch (err) {
    console.error("[forgot-password] error:", err);
    res.status(500).json({ error: "Failed to process request" });
  }
});

// ── Reset password ────────────────────────────────────────────────────
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ ok: true, message: "Password reset successfully. You can now log in." });
  } catch (err) {
    console.error("[reset-password] error:", err);
    res.status(500).json({ error: "Reset failed" });
  }
});

// ── Start server ──────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🐉 SPYRO V1 Auth Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
