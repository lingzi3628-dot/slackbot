# SPYRO WhatsApp Service (Baileys)

A free, open-source WhatsApp integration that connects directly to WhatsApp's protocol — **no API key, no paid service, no external hosting**.

Powered by [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) — the most popular open-source WhatsApp Web library.

## Quick Start

```bash
cd mini-services/whatsapp
bun install
bun run dev
```

The service starts on **port 3001**. The SPYRO Next.js app auto-detects it and switches from DEMO mode to LIVE mode.

> **Important:** WhatsApp blocks connections from most cloud/datacenter IPs. Run this on:
> - **Your local machine** (home internet) ✅
> - **A VPS** (DigitalOcean, Hetzner, etc.) — may work depending on the IP ✅
> - Cloud sandboxes (Vercel, AWS, etc.) — ❌ likely blocked
>
> If you get a `405 Connection Failure`, it means WhatsApp blocked the IP. Try a different network/VPS.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  SPYRO Next.js  │────▶│  Baileys Service │────▶│  WhatsApp   │
│   (port 3000)   │◀────│   (port 3001)    │◀────│   Servers   │
└─────────────────┘     └──────────────────┘     └─────────────┘
                                │
                                │ incoming message
                                ▼
                        ┌──────────────────┐
                        │  SPYRO webhook   │
                        │  /api/comms/     │
                        │  webhook         │
                        │  → AI agent      │
                        │  → auto-reply    │
                        └──────────────────┘
```

1. User clicks "Connect WhatsApp" in the SPYRO UI
2. Next.js calls the Baileys service → starts a WhatsApp Web session
3. Baileys generates a real QR code → user scans with WhatsApp mobile app
4. Connection established → phone number captured
5. Incoming messages → forwarded to SPYRO's webhook → AI agent generates reply → sent back via Baileys from the connected number

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| POST | `/connect` | Start session, returns QR code |
| GET | `/status/:sessionId` | Connection state + phone number |
| POST | `/disconnect/:sessionId` | Logout + delete auth |
| POST | `/send/:sessionId` | Send a text message |
| GET | `/chats/:sessionId` | List recent chats |
| GET | `/contacts/:sessionId` | List contacts |

## Environment Variables

Set these in the **main SPYRO app** (not this service):

```bash
# Public URL of your SPYRO app (so Baileys can forward incoming messages)
NEXT_PUBLIC_APP_URL=https://your-spyro-app.com

# Optional: override the Baileys service URL (default: http://localhost:3001)
BAILEYS_SERVICE_URL=http://localhost:3001
```

## Auth State Persistence

Auth state is stored in `./auth-state/{sessionId}/`. This means:
- Sessions survive service restarts
- You don't need to re-scan the QR unless you explicitly disconnect
- Each session = one connected WhatsApp number

## Deploying

### Option 1: Same machine as SPYRO (recommended)
Run both the Next.js app and the Baileys service on the same machine:
```bash
# Terminal 1: Next.js app
cd /home/z/my-project && bun run dev

# Terminal 2: Baileys service
cd /home/z/my-project/mini-services/whatsapp && bun run dev
```

### Option 2: Separate VPS
Deploy the Baileys service on a VPS with a clean IP. Set `BAILEYS_SERVICE_URL` in the SPYRO app to point to it.

### Option 3: Railway / Render
Deploy on a free-tier persistent service. Railway and Render both support long-running processes.

## Why Baileys?

| Feature | Baileys | Evolution API | WhatsApp Business API |
|---------|---------|---------------|----------------------|
| Cost | **Free** | Free (self-hosted) | $0.005-0.08/msg |
| API key needed | No | Yes | Yes (Meta) |
| External hosting | No | Yes | Yes (Meta cloud) |
| Open source | Yes | Yes | No |
| Persistent process | Yes | No | No |
| Message limits | None | None | 1000/24h tier-based |

Baileys is the best choice for a free, self-hosted WhatsApp integration.
