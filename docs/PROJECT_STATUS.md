# SPYRO V1 — Project Status

**A complete picture of what's been built, what's running, and what's next.**
Last updated: 2025

---

## What is SPYRO V1?

SPYRO V1 is a **dragon-powered AI chat assistant**. Under the hood it uses the
free [Pollination AI](https://pollinations.ai) text API, but every response is
rebranded as coming from the "SPYRO V1" model via an injected system prompt.

The project ships as **three delivery surfaces** from a single repo:

| Surface | Folder | Status | Tech |
|---|---|---|---|
| **Web app** | `/` (repo root) | ✅ Live | Next.js 16 + Tailwind 4 + shadcn/ui |
| **PWA** (installable web app) | `/src/app/manifest.ts` + `/public/sw.js` | ✅ Live | Next.js PWA |
| **Native mobile app** | `/spyro-mobile/` | ✅ MVP (Phase 0+1+2+5) | React Native + Expo SDK 53 |

All three call the **same backend** (`/api/chat`) — one SPYRO V1 persona,
one streaming endpoint, three front-ends.

---

## Repository map

```
slackbot/
├── src/                          # Next.js web app (the backend + web frontend)
│   ├── app/
│   │   ├── api/chat/route.ts     # ← THE SPYRO V1 ENDPOINT (all front-ends call this)
│   │   ├── page.tsx              # Web chat UI
│   │   ├── privacy/page.tsx      # Privacy policy (referenced by store listings)
│   │   ├── manifest.ts           # PWA manifest
│   │   └── globals.css           # Dragon/fire theme
│   ├── components/spyro/         # Web UI components
│   ├── store/chat-store.ts       # Web Zustand store
│   └── hooks/use-spyro-chat.ts   # Web streaming hook
│
├── spyro-mobile/                 # React Native + Expo mobile app
│   ├── app/                      # Expo Router screens
│   ├── src/                      # Components, hooks, stores, lib
│   ├── scripts/generate-icons.ts # Icon generator
│   ├── store-metadata/           # App Store + Play Store listing copy
│   ├── SETUP_GUIDE.md            # ← READ THIS FIRST to run the mobile app
│   ├── app.config.ts             # Expo config (set apiUrl here!)
│   ├── eas.json                  # Build profiles
│   └── package.json              # SDK 53 deps
│
├── docs/
│   ├── PROJECT_STATUS.md         # ← You are here
│   ├── NATIVE_APP_PLAN.md        # Full 24-section architecture spec
│   └── ...
│
├── .github/workflows/
│   └── mobile.yml                # CI: typecheck + lint + OTA + cloud build
│
├── public/sw.js                  # PWA service worker
└── README.md
```

---

## What's done

### ✅ Backend (shared by all three front-ends)
- **`/api/chat`** — Edge-runtime streaming endpoint
- Injects the SPYRO V1 persona system prompt
- Proxies the free Pollination AI OpenAI-compatible endpoint
- Streams SSE deltas back as plain text (token-by-token)
- Handles client disconnects cleanly (no uncaught exceptions)
- Response header `x-spyro-model: SPYRO-V1`
- No API key required

### ✅ Web app (Next.js 16)
- Dragon/fire ember theme (dark + light, no indigo/blue)
- Streaming chat with live cursor
- Rich Markdown (headings, tables, code blocks w/ copy, lists)
- Conversation history (localStorage) — rename, delete, regenerate, clear
- Stop generation mid-stream
- Welcome screen with 4 suggestion cards
- Responsive (desktop sidebar + mobile sheet)
- Ambient ember particle background
- Framer Motion animations

### ✅ PWA layer
- Web manifest (`/manifest.webmanifest`) — standalone display, theme color, icons
- Service worker (`/public/sw.js`) — network-first with offline fallback
- Installable on iPhone (Safari → Add to Home Screen) + Android (Chrome → Install)
- "Install app" button in sidebar + how-to popover
- App icons (192, 512, maskable, apple-touch, favicon)

### ✅ Native mobile app (Phase 0 + 1 + 2 + 5)
Built with **React Native 0.79 + Expo SDK 53 + Expo Router v5**.

**Phase 0 — Scaffold & navigation**
- Tab navigator (Chat / History / Settings) with ember-themed bar
- First-launch onboarding (3 slides)
- Splash + StatusBar + SafeArea + GestureHandler providers
- Streaming polyfills (ReadableStream on React Native)

**Phase 1 — Core chat**
- `streamChat()` client calling the deployed backend
- `useSpyroChat` hook — send / stop / regenerate
- Chat store (Zustand + AsyncStorage) — same shape as web
- MessageBubble with streaming cursor, copy-on-long-press, regenerate
- ChatInput (auto-growing multiline, Send/Stop toggle)
- TypingIndicator (Reanimated flame-flicker)
- Markdown renderer (ember-themed, copy-able code blocks)
- Welcome screen with suggestion cards
- History tab (rename, delete, new, auto-titled)
- Settings tab (theme, haptics, privacy, about)
- Dragon/fire theme ported 1:1 from web (dark + light)

**Phase 2 — Native features**
- 🔐 Biometric lock (Face ID / Touch ID / fingerprint) — re-arms on background
- 🔔 Push notifications — local "response ready" alert when app is backgrounded
- 📤 Export & share — single conversation as Markdown, all as JSON via native share sheet

**Phase 5 — CI/CD + store readiness**
- GitHub Actions CI (`.github/workflows/mobile.yml`): typecheck + lint on PR, auto OTA on main, manual cloud production build
- Store listing copy (`spyro-mobile/store-metadata/STORE_LISTING.md`) — App Store + Play Store, including Apple AI content-moderation checklist
- Privacy policy hosted at `/privacy` on the Next.js backend
- EAS Build + Submit config (`eas.json`)

### ✅ Documentation
- `docs/NATIVE_APP_PLAN.md` — 24-section architecture spec (644 lines)
- `spyro-mobile/SETUP_GUIDE.md` — definitive setup guide for Windows/Mac/Linux
- `spyro-mobile/README.md` — mobile app overview
- `spyro-mobile/store-metadata/STORE_LISTING.md` — store listing copy
- This file — project status overview

---

## Current versions

| Component | Version |
|---|---|
| Next.js (web) | 16 |
| Expo SDK (mobile) | **53** (upgraded from 52) |
| React Native | 0.79.2 |
| React | 19.0.0 |
| TypeScript | 5 |
| Tailwind CSS (web) | 4 |
| Zustand | 5 |

---

## How the three surfaces connect

```
                    ┌─────────────────────────────────────┐
                    │   Next.js backend (Vercel, HTTPS)   │
                    │   /api/chat  ← SPYRO V1 persona     │
                    │                Pollinations AI      │
                    └──────────┬──────────────┬───────────┘
                               │              │
                ┌──────────────┘              └──────────────┐
                ▼                                            ▼
   ┌────────────────────────┐                  ┌────────────────────────┐
   │  Web app + PWA          │                  │  Mobile app            │
   │  (browser / installed)  │                  │  (Expo Go / store)     │
   │  Next.js 16             │                  │  React Native 0.79     │
   └────────────────────────┘                  └────────────────────────┘
```

All three front-ends call the **same** `POST /api/chat` endpoint with
`{ messages: [...] }` and read back a streamed text response.

---

## What's NOT done yet (the roadmap)

### Phase 3 — Polish (optional for v1)
- [ ] Animated ember particle background (port from web)
- [ ] Micro-transitions between screens
- [ ] Pull-to-refresh on History
- [ ] Message search

### Phase 4 — Extra native features (optional for v1)
- [ ] iOS home-screen widget (quick-prompt)
- [ ] Share-to-app (send selected text from other apps into SPYRO V1)
- [ ] Siri shortcuts
- [ ] Dynamic Type / larger text accessibility pass

### Phase 6 — Production hardening
- [ ] Sentry crash reporting integration
- [ ] Remote push (server-sent, not just local) — requires a push server
- [ ] In-app "Report message" action (Apple AI content-moderation requirement)
- [ ] Content moderation filter (optional)
- [ ] A/B testing infrastructure

### Operational
- [ ] Revoke the exposed GitHub token (classic PAT used during development — should be revoked + replaced with a fine-grained token)
- [ ] Set `EXPO_TOKEN` GitHub secret for CI/CD
- [ ] First Vercel deployment of the backend
- [ ] First EAS Build + store submission

---

## Quick start (TL;DR)

### Run the web app
The web app runs in development at `http://localhost:3000` (Next.js dev server).

### Run the mobile app
See **[`spyro-mobile/SETUP_GUIDE.md`](spyro-mobile/SETUP_GUIDE.md)** for the
full guide. The short version:

```bash
git clone https://github.com/meshmusic2836-lab/slackbot
cd slackbot/spyro-mobile
npm install
npm install --save-dev sharp tsx
npm run gen:icons
# Set apiUrl in app.config.ts to your Vercel deployment
npx expo start
# Scan the QR with Expo Go on your phone
```

---

## Security note

A classic GitHub Personal Access Token (`ghp_…`) was used during development
to push to the repo. **It should be revoked** at
https://github.com/settings/tokens and replaced with a fine-grained token
scoped to just this repository.

---

Built with fire by SPYRO Labs. 🐉🔥
