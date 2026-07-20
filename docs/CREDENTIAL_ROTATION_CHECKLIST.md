# CREDENTIAL ROTATION & SENSITIVE FLAG CHECKLIST

> **Trigger:** Vercel April 2026 breach — environment variables stored without
> the "Sensitive" flag were exposed at rest. ALL credentials must be rotated
> and re-added with the Sensitive checkbox checked.
>
> **Stack:** Next.js 16 · Neon Postgres · Prisma · Gmail SMTP · Firebase ·
> Slack · OpenAI (Pollinations) · Paystack · Telegram · Upstash Redis

---

## How to use this checklist

1. **Rotate** each credential at its provider (Section A).
2. **Add** the new value to Vercel with the **"Sensitive" checkbox CHECKED** (Section B).
3. **Redeploy** the app (Section C).
4. **Verify** each service still works (Section D).
5. **Monitor** audit logs for unauthorized access (Section E).

Do NOT skip any step. A credential rotated but re-added WITHOUT the Sensitive
flag is still vulnerable.

---

## Section A — Rotate each credential at its provider

### A1. DATABASE_URL (Neon Postgres)

1. Go to **https://console.neon.tech** → sign in.
2. Select your project (`ep-silent-heart-ah1azq2h`).
3. Go to **Project Settings** → **Connection Details**.
4. Click **Reset password**. (This invalidates the OLD password immediately.)
5. Copy the new connection string. It looks like:
   `postgresql://neondb_owner:<NEW_PASSWORD>@ep-silent-heart-ah1azq2h-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`
6. **Ensure there is NO `channel_binding=require`** in the string. If Neon
   appended it, remove the `&channel_binding=require` portion before pasting
   into Vercel (Prisma cannot parse it — see V5 fix in `lib/prisma.ts`).

- [ ] Rotated DATABASE_URL
- [ ] Verified no `channel_binding` parameter in new string

### A2. GMAIL_USER + GMAIL_APP_PASSWORD

1. Go to **https://myaccount.google.com** → sign in with the Gmail account
   used for sending (e.g. `spyro.notifications@gmail.com`).
2. Go to **Security** → **2-Step Verification** (must be ON).
3. Scroll to **App passwords** (at the bottom of 2-Step Verification page).
4. Find the existing "SPYRO" app password → click **Delete** (trash icon).
5. Click **Create a new app password** → name it `SPYRO-V2` → copy the
   16-character password.
6. The `GMAIL_USER` value stays the same (the email address). Only the
   `GMAIL_APP_PASSWORD` changes.

- [ ] Revoked old Gmail App Password
- [ ] Generated new Gmail App Password

### A3. FIREBASE_API_KEY (NEXT_PUBLIC_FIREBASE_API_KEY)

1. Go to **https://console.firebase.google.com** → select your project.
2. Go to **Project Settings** (gear icon) → **General** tab.
3. Scroll to **Web apps** → select your web app.
4. Under **Web API Key**, click **Restrict key** (or "Manage in Google Cloud").
5. In Google Cloud Console → **APIs & Services** → **Credentials**.
6. Click the API key → **Restrict key**:
   - **Application restriction:** HTTP referrer (add your production domain).
   - **API restrictions:** Restrict to **Identity Toolkit API** only.
7. To fully rotate: click **Regenerate key** (note: this breaks existing
   clients until the new key is deployed).
8. Copy the new key.

- [ ] Restricted Firebase API key to Identity Toolkit API
- [ ] Added production domain to HTTP referrer allowlist
- [ ] (Optional) Regenerated key for full rotation

### A4. SLACK_BOT_TOKEN (xoxb-...)

1. Go to **https://api.slack.com/apps** → select your Slack app.
2. Go to **OAuth & Permissions** in the left sidebar.
3. Click **Reinstall App** (this generates a new token — the old one is
   revoked when you reinstall).
4. Copy the new **Bot User OAuth Token** (`xoxb-...`).

- [ ] Reinstalled Slack app
- [ ] Copied new SLACK_BOT_TOKEN

### A5. SLACK_SIGNING_SECRET

1. Go to **https://api.slack.com/apps** → select your app.
2. Go to **Basic Information** in the left sidebar.
3. Scroll to **App Credentials** → **Signing Secret**.
4. Click **Regenerate**. (WARNING: this breaks incoming webhooks until the
   new secret is deployed.)
5. Copy the new signing secret.

- [ ] Regenerated SLACK_SIGNING_SECRET
- [ ] Noted: deploy new secret ASAP — webhooks will fail until deployed

### A6. OPENAI_API_KEY (if used — Pollinations is the current AI provider)

1. Go to **https://platform.openai.com** → **API Keys**.
2. Find the existing key → click **Delete** (trash icon).
3. Click **Create new secret key** → name it `SPYRO-PROD-2026`.
4. Copy the new key (`sk-proj-...`). You won't see it again.

- [ ] Deleted old OpenAI API key
- [ ] Created new OpenAI API key

### A7. PAYSTACK_SECRET_KEY + PAYSTACK_PUBLIC_KEY

1. Go to **https://dashboard.paystack.co** → sign in.
2. Go to **Settings** → **API Keys & Webhooks**.
3. Click **Regenerate Secret Key** (live mode, not test).
4. Copy the new secret key (`sk_live_...`).
5. The public key (`pk_live_...`) does NOT need rotation — it's public by
   design. But verify it's still valid.

- [ ] Regenerated PAYSTACK_SECRET_KEY
- [ ] Verified PAYSTACK_PUBLIC_KEY still valid

### A8. TELEGRAM_BOT_TOKEN

1. Open Telegram → message **@BotFather**.
2. Send `/revoke` → select your bot.
3. BotFather issues a new token. Copy it.
4. (Alternatively: `/token` → select bot → "Revoke current token".)

- [ ] Revoked old Telegram bot token
- [ ] Copied new TELEGRAM_BOT_TOKEN
- [ ] Re-run `/api/telegram/set-webhook` to register the new token

### A9. UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (new — for V4)

1. Go to **https://console.upstash.com** → sign in.
2. Create a new Redis database (or use existing).
3. Copy the **REST URL** and **REST Token** from the database details page.
4. (If rotating an existing one: delete the old database after creating new.)

- [ ] Created Upstash Redis database
- [ ] Copied UPSTASH_REDIS_REST_URL
- [ ] Copied UPSTASH_REDIS_REST_TOKEN

---

## Section B — Add credentials to Vercel with Sensitive flag

For EACH credential above:

1. Go to **https://vercel.com** → your project → **Settings** → **Environment Variables**.
2. Find the existing variable (or click **Add New** if missing).
3. **Edit** the value → paste the NEW rotated value.
4. **CHECK THE "Sensitive" CHECKBOX** (this is the critical step — it was
   missed in the original setup).
5. Set the environment: **Production** + **Preview** + **Development**.
6. Click **Save**.

| Variable | Sensitive? | Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Contains DB password |
| `GMAIL_USER` | ❌ No | Just an email address (not secret) |
| `GMAIL_APP_PASSWORD` | ✅ Yes | 16-char app password |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ❌ No | Public by design (but restricted via HTTP referrer) |
| `SLACK_BOT_TOKEN` | ✅ Yes | `xoxb-...` |
| `SLACK_SIGNING_SECRET` | ✅ Yes | Used to verify Slack webhooks |
| `OPENAI_API_KEY` | ✅ Yes | `sk-proj-...` |
| `PAYSTACK_SECRET_KEY` | ✅ Yes | `sk_live_...` |
| `PAYSTACK_PUBLIC_KEY` | ❌ No | `pk_live_...` (public by design) |
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | Bot token from @BotFather |
| `UPSTASH_REDIS_REST_URL` | ❌ No | URL is not secret (token is) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Yes | REST API token |

- [ ] All `✅ Yes` variables have the Sensitive checkbox CHECKED
- [ ] All `❌ No` variables are correctly NOT sensitive (and are safe to expose)

---

## Section C — Redeploy the app

1. In Vercel, go to **Deployments**.
2. Click the most recent deployment → **Redeploy**.
3. Wait for the build to complete (~2-3 minutes).
4. Confirm the deployment is "Ready" with no errors.

- [ ] App redeployed successfully
- [ ] No build errors in Vercel logs

---

## Section D — Verify each service works

Test each integration AFTER the redeploy:

### D1. Database (Neon)
- [ ] Visit the app → sign in (or register) → confirm user data loads
- [ ] Check `/api/admin/stats` (admin login) → returns real user counts

### D2. Gmail SMTP
- [ ] Trigger a password reset email → confirm it arrives in inbox
- [ ] Check email headers show the new app password was used

### D3. Firebase Auth
- [ ] Sign in with Google → confirms Firebase API key works
- [ ] Check browser console for Firebase errors

### D4. Slack
- [ ] Send a test message to the Slack bot → confirm it responds
- [ ] Check Slack app logs for webhook delivery

### D5. OpenAI / Pollinations
- [ ] Send a chat message → confirms AI response streams
- [ ] Generate an image via `/imagine` → confirms image renders

### D6. Paystack
- [ ] Initiate a test payment (use a small plan like Pro KSh 499)
- [ ] Confirm webhook receives the payment event
- [ ] Check `/api/admin/billing` → shows the transaction

### D7. Telegram
- [ ] Run `POST /api/telegram/set-webhook` with the new token
- [ ] Message the bot on Telegram → confirms it responds

### D8. Upstash Redis
- [ ] Send 20+ rapid chat requests → confirm rate limiting kicks in
- [ ] Check Upstash console → confirms Redis keys are being written

---

## Section E — Monitor audit logs for unauthorized access

For the next 7 days, monitor:

1. **Vercel logs** → filter for 401/403 responses (unauthorized access attempts)
2. **Neon console** → check for unexpected query spikes
3. **Gmail account** → check for suspicious login alerts
4. **Firebase console** → check for unusual auth activity
5. **Slack app logs** → check for unexpected webhook calls
6. **OpenAI usage** → check for unexpected API calls
7. **Paystack dashboard** → check for unauthorized transactions
8. **Telegram bot** → check for messages from unknown users
9. **Upstash console** → check for unexpected Redis traffic

- [ ] Set up Vercel log alerts for 401/403 spikes
- [ ] Set up Neon usage alerts
- [ ] Set up Gmail login alerts (already on by default)
- [ ] Set up Paystack transaction alerts
- [ ] Reviewed audit logs at 24h, 72h, and 7d post-rotation

---

## Sign-off

- [ ] All credentials rotated (Section A)
- [ ] All sensitive credentials marked Sensitive in Vercel (Section B)
- [ ] App redeployed (Section C)
- [ ] All services verified working (Section D)
- [ ] Monitoring in place for 7 days (Section E)

**Completed by:** ______________________  **Date:** ___________
**Reviewed by:** ______________________  **Date:** ___________
