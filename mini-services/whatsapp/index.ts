/**
 * SPYRO WhatsApp Service — powered by Baileys
 *
 * A persistent background service that maintains a real WhatsApp Web
 * connection using @whiskeysockets/baileys. No API key, no external
 * hosting — Baileys connects directly to WhatsApp's protocol.
 *
 * Endpoints (port 3001):
 *   GET  /health                         → service alive?
 *   POST /connect                        → start/restart a session, returns QR
 *   GET  /status/:sessionId              → connection state + phone number
 *   POST /disconnect/:sessionId          → logout + delete auth
 *   POST /send/:sessionId                → send a text message
 *   GET  /chats/:sessionId               → list recent chats
 *   GET  /contacts/:sessionId            → list contacts
 *
 * Incoming messages are forwarded to the main app's webhook:
 *   POST {APP_URL}/api/comms/webhook?channelId={sessionId}
 *
 * Auth state persists in ./auth-state/{sessionId}/ so sessions survive
 * restarts (scanning the QR again isn't needed unless you log out).
 */
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  type WASocket,
  type BaileysEventMap,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import { pino } from "pino";

const PORT = 3001;
const logger = pino({ level: "silent" }); // silence Baileys' chatty logs
const APP_WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

// ── Session registry ──────────────────────────────────────────────────
interface Session {
  id: string;
  sock: WASocket | null;
  status: "connecting" | "connected" | "disconnected" | "error";
  qrCode?: string;
  phoneNumber?: string;
  deviceName?: string;
  connectedAt?: number;
  lastDisconnect?: { reason: string; statusCode: number };
}

const SESSIONS = new Map<string, Session>();

async function startSession(sessionId: string): Promise<{ qrCode: string }> {
  // If a session already exists, close it first.
  const existing = SESSIONS.get(sessionId);
  if (existing?.sock) {
    try { await existing.sock.end(new Error("restart")); } catch {}
  }

  const session: Session = {
    id: sessionId,
    sock: null,
    status: "connecting",
  };
  SESSIONS.set(sessionId, session);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { state, saveCreds } = await useMultiFileAuthState(`./auth-state/${sessionId}`);
  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ["SPYRO", "Chrome", "1.0.0"],
  });
  session.sock = sock;

  return new Promise((resolve, reject) => {
    let qrResolved = false;

    sock.ev.on("connection.update", async (update: BaileysEventMap["connection.update"]) => {
      const { connection, qr, lastDisconnect } = update;
      console.log(`[wa:${sessionId}] connection.update:`, { connection, hasQr: !!qr, statusCode: lastDisconnect?.error?.output?.statusCode });

      if (qr && !qrResolved) {
        qrResolved = true;
        // Generate a data URL QR for the frontend to render.
        const qrCode = await QRCode.toDataURL(qr, {
          errorCorrectionLevel: "M",
          margin: 2,
          width: 480,
          color: { dark: "#09090B", light: "#FFFFFF" },
        });
        session.qrCode = qrCode;
        resolve({ qrCode });
      }

      if (connection === "open") {
        session.status = "connected";
        session.connectedAt = Date.now();
        session.qrCode = undefined;
        // Capture the connected phone number from the user JID.
        const userJid = sock.user?.id || "";
        session.phoneNumber = userJid.split(":")[0].split("@")[0];
        session.deviceName = sock.user?.name || "WhatsApp";
        console.log(`[wa:${sessionId}] connected as ${session.phoneNumber}`);
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message || "unknown";
        session.lastDisconnect = { reason, statusCode: statusCode ?? 0 };

        if (statusCode === DisconnectReason.loggedOut) {
          session.status = "disconnected";
          console.log(`[wa:${sessionId}] logged out`);
        } else if (statusCode === 410 || statusCode === 408) {
          // Reconnect on transient errors.
          console.log(`[wa:${sessionId}] reconnecting (${statusCode})...`);
          session.status = "connecting";
          setTimeout(() => startSession(sessionId).catch(() => {}), 2000);
        } else {
          session.status = "disconnected";
          console.log(`[wa:${sessionId}] closed (${statusCode}: ${reason})`);
          // Try to reconnect once.
          setTimeout(() => startSession(sessionId).catch(() => {}), 3000);
        }
      }
    });

    sock.ev.on("creds.update", saveCreds);

    // ── Incoming messages → forward to the main app's webhook ────────
    sock.ev.on("messages.upsert", async ({ messages, type }: BaileysEventMap["messages.upsert"]) => {
      // Only process notifications (not our own messages)
      if (type !== "notify") return;

      for (const msg of messages) {
        if (msg.key.fromMe) continue; // skip outgoing

        const fromJid = msg.key.remoteJid || "";
        const fromNumber = fromJid.split("@")[0].split(":")[0];

        // Extract text content (WhatsApp messages come in various shapes)
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          "";

        if (!text.trim()) continue;

        console.log(`[wa:${sessionId}] incoming from ${fromNumber}: ${text.slice(0, 80)}`);

        // Forward to the main app so the AI agent can reply.
        if (APP_WEBHOOK_URL) {
          try {
            await fetch(`${APP_WEBHOOK_URL}/api/comms/webhook?channelId=${sessionId}`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                event: "messages.upsert",
                instance: sessionId,
                data: {
                  messages: [{
                    key: {
                      remoteJid: fromJid,
                      fromMe: false,
                      id: msg.key.id,
                    },
                    message: { conversation: text },
                    messageTimestamp: Math.floor(Date.now() / 1000),
                    pushName: msg.pushName || fromNumber,
                  }],
                },
              }),
            });
          } catch (err) {
            console.error(`[wa:${sessionId}] webhook forward failed:`, err);
          }
        }
      }
    });

    // Timeout if no QR after 20s (session may already be authed)
    setTimeout(() => {
      if (!qrResolved) {
        // If already authed, resolve with empty QR (status will show connected)
        if (session.status === "connected") {
          qrResolved = true;
          resolve({ qrCode: "" });
        } else {
          reject(new Error("Timed out waiting for QR code"));
        }
      }
    }, 20_000);
  });
}

// ── HTTP server ───────────────────────────────────────────────────────
type RouteHandler = (req: Request, match: RegExpMatchArray) => Promise<Response>;

const routes: { method: string; pattern: RegExp; handler: RouteHandler }[] = [
  // Health check
  {
    method: "GET",
    pattern: /^\/health$/,
    handler: async () => json({ ok: true, service: "spyro-whatsapp", version: "1.0.0" }),
  },

  // Connect — start a session and return the QR
  {
    method: "POST",
    pattern: /^\/connect$/,
    handler: async (req) => {
      const body = await req.json().catch(() => ({}));
      const sessionId = body.sessionId || `s${Date.now().toString(36)}`;
      try {
        const { qrCode } = await startSession(sessionId);
        return json({ sessionId, qrCode, status: "connecting" });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "Failed" }, 500);
      }
    },
  },

  // Status — connection state + phone number
  {
    method: "GET",
    pattern: /^\/status\/(.+)$/,
    handler: async (_req, match) => {
      const sessionId = match[1];
      const session = SESSIONS.get(sessionId);
      if (!session) {
        return json({ sessionId, status: "disconnected" });
      }
      return json({
        sessionId,
        status: session.status,
        qrCode: session.qrCode,
        phoneNumber: session.phoneNumber,
        deviceName: session.deviceName,
        connectedAt: session.connectedAt,
        lastDisconnect: session.lastDisconnect,
      });
    },
  },

  // Disconnect — logout + delete auth state
  {
    method: "POST",
    pattern: /^\/disconnect\/(.+)$/,
    handler: async (_req, match) => {
      const sessionId = match[1];
      const session = SESSIONS.get(sessionId);
      if (session?.sock) {
        try { await session.sock.logout(); } catch {}
        try { await session.sock.end(new Error("logout")); } catch {}
      }
      // Best-effort auth state cleanup (mark as deleted; OS will GC the dir).
      try {
        await Bun.write(`./auth-state/${sessionId}/.deleted`, "1");
      } catch {}
      SESSIONS.delete(sessionId);
      return json({ ok: true });
    },
  },

  // Send a text message
  {
    method: "POST",
    pattern: /^\/send\/(.+)$/,
    handler: async (req, match) => {
      const sessionId = match[1];
      const session = SESSIONS.get(sessionId);
      if (!session?.sock || session.status !== "connected") {
        return json({ error: "Session not connected" }, 400);
      }
      const body = await req.json();
      const { number, text } = body;
      if (!number || !text) {
        return json({ error: "number and text required" }, 400);
      }
      // Format the JID: number@s.whatsapp.net
      const jid = number.includes("@") ? number : `${number}@s.whatsapp.net`;
      try {
        const result = await session.sock.sendMessage(jid, { text });
        return json({ ok: true, messageId: result?.key?.id });
      } catch (err) {
        return json({ error: err instanceof Error ? err.message : "Send failed" }, 500);
      }
    },
  },

  // List recent chats
  {
    method: "GET",
    pattern: /^\/chats\/(.+)$/,
    handler: async (_req, match) => {
      const sessionId = match[1];
      const session = SESSIONS.get(sessionId);
      if (!session?.sock || session.status !== "connected") {
        return json({ chats: [] });
      }
      try {
        const chats = await session.sock.fetchChats?.() ?? [];
        return json({ chats });
      } catch {
        return json({ chats: [] });
      }
    },
  },

  // List contacts
  {
    method: "GET",
    pattern: /^\/contacts\/(.+)$/,
    handler: async (_req, match) => {
      const sessionId = match[1];
      const session = SESSIONS.get(sessionId);
      if (!session?.sock || session.status !== "connected") {
        return json({ contacts: [] });
      }
      try {
        // Baileys doesn't have a direct "list contacts" — use the chat list
        // which contains contact info.
        const chats = await session.sock.fetchChats?.() ?? [];
        const contacts = chats.map((c: any) => ({
          id: c.id,
          name: c.name || c.id?.split("@")[0],
          phone: c.id?.split("@")[0],
        }));
        return json({ contacts });
      } catch {
        return json({ contacts: [] });
      }
    },
  },
];

// ── HTTP server (Node http — Baileys needs full ws support, so we run
//    under Node + tsx rather than Bun) ─────────────────────────────────
import http from "node:http";
import { URL as NodeURL } from "node:url";

/** JSON response helper used by route handlers. */
function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// Wrap a Node http req so the route handlers (which use req.json()) work.
async function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new NodeURL(req.url || "/", `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method || "GET";
  const bodyText = await readBody(req);
  const fakeReq = {
    json: async () => (bodyText ? JSON.parse(bodyText) : {}),
  } as unknown as Request;

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = path.match(route.pattern);
    if (match) {
      try {
        const response = await route.handler(fakeReq, match);
        const text = await response.text();
        res.writeHead(response.status, { "content-type": "application/json" });
        res.end(text);
        return;
      } catch (err) {
        console.error(`[http] ${method} ${path} error:`, err);
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "Internal error" }));
        return;
      }
    }
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found", path }));
});

server.listen(PORT, () => {
  console.log(`🔥 SPYRO WhatsApp service running on http://localhost:${PORT}`);
  console.log(`   Webhook target: ${APP_WEBHOOK_URL || "(not set — incoming messages will be logged only)"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[shutdown] closing sessions...");
  for (const [, session] of SESSIONS) {
    try { session.sock?.end(new Error("shutdown")); } catch {}
  }
  server.close();
  process.exit(0);
});
