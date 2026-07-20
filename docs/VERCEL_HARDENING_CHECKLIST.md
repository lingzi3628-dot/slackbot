# VERCEL-SPECIFIC HARDENING CHECKLIST

> **#8 (hardening):** Vercel deployment protection, firewall, security headers,
> and sensitive env vars. Complete this after deploying the code changes.

---

## 1. Deployment Protection (Preview Access Control)

Prevent unauthenticated users from accessing preview deployments.

1. Go to **https://vercel.com** → your project → **Settings** → **Deployment Protection**.
2. Set **Vercel Authentication** to **"Password Protection"** or **"Vercel Authentication"** (Pro plan).
3. If using Password Protection: set a strong password (different from any user password).
4. Set **Production Deployment Protection** to **"Only Production Branch"** — the production
   deployment at `slackbot-seven.vercel.app` stays public, but ALL preview deployments
   require authentication.
5. Click **Save**.

- [ ] Deployment Protection enabled
- [ ] Preview deployments require authentication
- [ ] Production deployment remains public (only the `main` branch)

---

## 2. Vercel Firewall (if available on your plan)

Block traffic from known malicious IPs and apply rate limits at the edge.

1. Go to **Settings** → **Firewall** (if available — Pro/Enterprise plan).
2. **Add a rate limit rule:**
   - Path: `/api/*`
   - Limit: 100 requests per minute per IP
   - Action: Block (429)
3. **Add a blocklist rule** (optional):
   - Block IPs from known attack ranges (update based on threat intel).
4. **Add a bot challenge:**
   - Enable "Bot Filter" to block known bot user agents.
5. Click **Save**.

- [ ] Firewall enabled (if on Pro/Enterprise plan)
- [ ] Rate limit rule for /api/* (100/min/IP)
- [ ] Bot filter enabled

---

## 3. Security Headers (Vercel-level backup)

Even though `next.config.ts` and `middleware.ts` already set security headers,
enable Vercel's built-in headers as a backup.

1. Go to **Settings** → **Security Headers**.
2. Add the following headers:

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'` |

3. Click **Save**.

- [ ] All 6 security headers added at the Vercel level
- [ ] HSTS includes `preload` directive
- [ ] CSP header set (restricts script/style/img/font/connect sources)

---

## 4. Environment Variables — Mark ALL as Sensitive

Every secret MUST have the "Sensitive" checkbox checked in Vercel.

1. Go to **Settings** → **Environment Variables**.
2. For EACH variable, click **Edit** → check the **"Sensitive"** checkbox → **Save**.

| Variable | Sensitive? | Why |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | Contains Neon DB password |
| `GMAIL_USER` | ❌ No | Just an email (not secret) |
| `GMAIL_APP_PASSWORD` | ✅ Yes | Gmail app password |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ❌ No | Public by design (restricted via referrer) |
| `SLACK_BOT_TOKEN` | ✅ Yes | `xoxb-...` token |
| `SLACK_SIGNING_SECRET` | ✅ Yes | Webhook signing secret |
| `OPENAI_API_KEY` | ✅ Yes | `sk-...` key |
| `PAYSTACK_SECRET_KEY` | ✅ Yes | `sk_live_...` key |
| `PAYSTACK_PUBLIC_KEY` | ❌ No | `pk_live_...` (public by design) |
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | Bot token |
| `UPSTASH_REDIS_REST_URL` | ❌ No | URL only (token is the secret) |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Yes | Redis REST token |
| `TURNSTILE_SECRET_KEY` | ✅ Yes | Cloudflare Turnstile secret |
| `EMAIL_VERIFICATION_SECRET` | ✅ Yes | HMAC signing secret for email tokens |
| `ENABLE_API_DOCS` | ❌ No | Boolean toggle (not secret) |
| `CORS_ORIGINS` | ❌ No | Comma-separated origin list (not secret) |

- [ ] ALL `✅ Yes` variables have the Sensitive checkbox CHECKED
- [ ] Verified no secret appears in build logs or runtime logs

---

## 5. DDoS Protection (Vercel Built-in)

Vercel provides automatic DDoS protection on all plans.

1. Go to **Settings** → **DDoS Protection** (if visible).
2. Verify it's **Enabled** (should be on by default).
3. For advanced protection, upgrade to **Pro** for custom rules.

- [ ] DDoS protection enabled (default)
- [ ] (Optional) Upgraded to Pro for custom DDoS rules

---

## 6. Function Timeout + Memory

Prevent resource exhaustion attacks.

1. Go to **Settings** → **Functions**.
2. Set **Max Duration** to **60 seconds** (default is 10). Our `god-mode` route
   overrides this to 300s via `export const maxDuration = 300`.
3. Set **Memory** to **1024 MB** (default is 1024). Image processing (sharp)
   needs at least 512 MB.

- [ ] Max Duration: 60s (god-mode overrides to 300s)
- [ ] Memory: 1024 MB

---

## 7. Log Drain (Optional — for security monitoring)

Send Vercel logs to an external SIEM for real-time alerting.

1. Go to **Settings** → **Log Drains**.
2. Connect to your log provider (Datadog, New Relic, Logflare, etc.).
3. Set up alerts for:
   - 401/403 spikes (potential brute force)
   - 429 spikes (rate limit abuse)
   - 500 errors (application errors)
   - `audit` log entries with `type: "error"` (security events)

- [ ] Log drain connected
- [ ] Alerts configured for 401/403/429/500 spikes
- [ ] Alerts configured for audit log `type: "error"` entries

---

## 8. Deploy Hooks + Webhook Security

If using deploy hooks (e.g., from GitHub Actions):

1. Go to **Settings** → **Deploy Hooks**.
2. Verify each hook has a secure, random URL (not guessable).
3. Rotate hook URLs if any were exposed.

- [ ] Deploy hook URLs are random and not exposed
- [ ] (Optional) Rotate deploy hook URLs

---

## Sign-off

- [ ] Deployment Protection enabled
- [ ] Vercel Firewall configured (if on Pro/Enterprise)
- [ ] Security Headers set at Vercel level (backup)
- [ ] ALL sensitive env vars marked "Sensitive"
- [ ] DDoS protection verified
- [ ] Function timeout + memory configured
- [ ] Log drain connected (optional)
- [ ] Deploy hooks secured

**Completed by:** ______________________  **Date:** ___________
