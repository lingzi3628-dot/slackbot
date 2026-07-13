# SPYRO V1 — Integrations

SPYRO V1 supports connecting to external chat platforms so you can talk to
the dragon-powered assistant wherever you are. Each integration shares the
same SPYRO V1 persona and the same backend engine.

## Available integrations

| Platform | Status | Setup |
|---|---|---|
| ✈️ **Telegram** | ✅ Live | [Setup guide](#telegram) |
| 🎮 Discord | 🚧 Coming soon | — |
| 💼 Slack | 🚧 Coming soon | — |

The web UI shows a live **Integrations panel** in the sidebar with the
current connection status of each platform.

---

## Telegram

Chat with SPYRO V1 directly in Telegram. The bot supports:
- `/start` — welcome message
- `/new` — clear conversation history
- `/help` — show help
- Any text message → a SPYRO V1 reply (streamed live via message edits)

### Setup (5 minutes)

#### 1. Create a Telegram bot

1. Open Telegram and message **@BotFather**
2. Send `/newbot`
3. Pick a display name (e.g. `SPYRO V1`)
4. Pick a username ending in `bot` (e.g. `SpyroV1_bot`)
5. BotFather gives you a **bot token** like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
   — **copy it**

#### 2. Add the token to Vercel

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add a new variable:
   - **Key:** `TELEGRAM_BOT_TOKEN`
   - **Value:** your bot token from step 1
   - **Environment:** Production (and Preview if you want to test)
3. Click **Save**
4. **Redeploy** the project (Vercel → Deployments → the latest → Redeploy)
   so the new env var is picked up

#### 3. Register the webhook

After the redeploy finishes, open this URL in your browser (replace with
your Vercel domain):

```
https://your-spyro-v1-backend.vercel.app/api/telegram/set-webhook
```

You should see a JSON response like:
```json
{
  "ok": true,
  "bot": { "username": "@SpyroV1_bot", "name": "SPYRO V1" },
  "webhook": { "url": "https://...", "pending_updates": 0 },
  "message": "✅ Webhook set! Message @SpyroV1_bot on Telegram..."
}
```

#### 4. Talk to your bot

1. In Telegram, search for your bot's username (e.g. `@SpyroV1_bot`)
2. Tap **Start**
3. Send a message — SPYRO V1 will reply! 🐉🔥

### How it works

```
Telegram user sends message
        ↓
Telegram Bot API → POST /api/telegram/webhook (Vercel)
        ↓
  Webhook reads message + chat id
        ↓
  Sends "SPYRO V1 is breathing fire…" placeholder
        ↓
  Calls spyro-engine.getReply() with conversation history
        ↓
  Streams tokens — edits the message every ~1.5s to simulate live typing
        ↓
  Final edit with the complete response
        ↓
  Telegram user sees the reply
```

### Commands

| Command | What it does |
|---|---|
| `/start` | Welcome message + command list |
| `/new` | Clear conversation history (fresh start) |
| `/help` | Show help |

### Conversation memory

Each Telegram chat has its own in-memory conversation history (last 20
messages). The bot remembers context within a chat. Use `/new` to reset.

> **Note:** The history is in-memory and resets when the Vercel function
> cold-starts. For persistent multi-user history, connect a database
> (Upstash Redis, Supabase, etc.) — see `src/lib/integrations/telegram-store.ts`.

### Teardown

To stop the bot (e.g. when switching deployment URLs):
```
https://your-spyro-v1-backend.vercel.app/api/telegram/unset-webhook
```

### Troubleshooting

| Problem | Fix |
|---|---|
| `set-webhook` returns "TELEGRAM_BOT_TOKEN is not set" | Add the env var in Vercel + redeploy |
| Bot doesn't respond to messages | Check the set-webhook response — `pending_updates` should be 0 and `last_error` should be null |
| `set-webhook` returns 401 Unauthorized | Your bot token is wrong — get a new one from @BotFather |
| Messages take >10s to get a reply | The first request after a cold start is slower; subsequent ones are fast. The function has a 60s timeout. |
| Reply is truncated | Telegram messages max at 4096 chars; long replies are truncated with a `…(truncated)` note |

---

## Discord (coming soon)

Not yet implemented. The architecture in `src/lib/integrations/` is designed
to make adding Discord straightforward — register a new integration in
`registry.ts`, add a `discord-client.ts` + `discord-store.ts`, and a
`/api/discord/webhook/route.ts`. The shared `spyro-engine.ts` handles the
AI logic.

---

## Slack (coming soon)

Not yet implemented. Same integration pattern as Discord.

---

## Building a new integration

The integration framework is in `src/lib/integrations/`. To add a new platform:

1. **Register it** in `src/lib/integrations/registry.ts` (add to `getIntegrations()`)
2. **Create a client** — `src/lib/integrations/<platform>-client.ts` (platform API calls)
3. **Create a store** — `src/lib/integrations/<platform>-store.ts` (per-chat history)
4. **Create a webhook route** — `src/app/api/<platform>/webhook/route.ts`
5. **Call `getSpyroReply()`** from `@/lib/spyro-engine` to get the AI response

The shared `spyro-engine.ts` + `spyro-persona.ts` mean every integration
gets the exact same SPYRO V1 personality — no duplication.

---

Built with fire by SPYRO Labs. 🐉🔥
