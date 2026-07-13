# SPYRO V1 — Dragon-Powered AI Chat 🔥🐉

A blazing-fast, beautifully designed AI chat assistant. **SPYRO V1** is a
dragon-themed chatbot powered under the hood by the free
[Pollination AI](https://pollinations.ai) text API, fully rebranded as the
SPYRO V1 model. Installable as a phone app (PWA) on iOS & Android.

![model](https://img.shields.io/badge/model-SPYRO%20V1-ff6b1a?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-installable-5a0dfa?style=for-the-badge)

## ✨ Features

- **Streaming responses** — answers stream in token-by-token with a live cursor.
- **Rich Markdown** — headings, tables, lists, and code blocks (with one-click
  copy) via `react-markdown` + `remark-gfm`.
- **In-character persona** — SPYRO V1 answers as a bold, witty, fire-breathing
  dragon assistant (injected as a system prompt).
- **Conversation history** — multiple chats, auto-titled, persisted to
  `localStorage`. Rename, delete, clear, and regenerate replies.
- **Stop generation** — cancel a streaming reply mid-flight.
- **Dark / light theme** — warm ember palette (amber → orange → red) on a deep
  charcoal base. No blue/indigo.
- **Responsive** — desktop sidebar collapses into a mobile sheet on small
  screens.
- **PWA** — installable on iPhone & Android with a home-screen icon, full-screen,
  and offline shell. See [Install as a phone app](#-install-as-a-phone-app-pwa).
- **Atmospheric UI** — animated ember particles, fire-gradient logo, glass
  panels, and framer-motion transitions.
- **Privacy** — `referrer` + `private` flags sent to the upstream API.

## 🚀 Quick start

```bash
bun install
bun run dev
```

Open http://localhost:3000.

### Generate app icons (optional)

Icons are pre-generated in `public/icons/`. To regenerate from the SVG source:

```bash
bun run scripts/generate-icons.ts
```

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run build` | Production build |
| `bun run scripts/generate-icons.ts` | Regenerate PWA icons |

## 📱 Install as a phone app (PWA)

SPYRO V1 is a **Progressive Web App** — installable on iPhone & Android with
its own home-screen icon, full-screen, no browser chrome. No app store needed.

### Deploy it first
Push the repo to any HTTPS host (Vercel, Netlify, GitHub Pages, Cloudflare
Pages…). PWAs require HTTPS.

### iPhone (Safari)
1. Open the deployed URL in **Safari**.
2. Tap the **Share** icon (square with up arrow).
3. Tap **Add to Home Screen** → **Add**.

### Android (Chrome)
1. Open the deployed URL in **Chrome**.
2. Tap the **menu (⋮)** → **Install app** (or **Add to Home screen**).

On desktop Chrome/Edge, click the **Install** icon in the address bar.

The app also shows an **"Install app"** button in the sidebar when the browser
fires `beforeinstallprompt`, and an **"Install on phone"** hint popover with
these same steps.

> Want it in the **App Store / Play Store**? Wrap the same web app with
> [Capacitor](https://capacitorjs.com): `npm i @capacitor/core @capacitor/cli`,
> `npx cap init`, `npx cap add ios` / `android`, then build the native binary
> with Xcode / Android Studio. No code changes required — it's the same app.

## 🧠 How it works

```
Browser  →  POST /api/chat  →  text.pollinations.ai/openai  (OpenAI-compatible)
                              (SPYRO V1 persona injected as system prompt)
         ←  streamed SSE deltas re-emitted as plain text
```

The route lives in [`src/app/api/chat/route.ts`](src/app/api/chat/route.ts)
(edge runtime). It:

1. Prepends a SPYRO V1 persona system prompt.
2. Forwards the conversation (last 20 turns) to the free Pollination AI text
   endpoint.
3. Decodes the upstream SSE stream and re-emits each `delta.content` token as
   plain text so the client renders it live.

Every response carries the header `x-spyro-model: SPYRO-V1`.

## 📁 Project structure

```
src/
├── app/
│   ├── api/chat/route.ts     # SPYRO V1 streaming endpoint
│   ├── manifest.ts           # PWA manifest
│   ├── globals.css           # Dragon/fire theme
│   ├── layout.tsx            # PWA metadata + SW registrar
│   └── page.tsx              # Main chat shell
├── components/spyro/
│   ├── spyro-logo.tsx        # SVG dragon-flame mark
│   ├── pwa-manager.tsx       # Registers the service worker
│   ├── model-badge.tsx
│   ├── chat-header.tsx
│   ├── chat-sidebar.tsx      # Conversation list + Install button
│   ├── chat-messages.tsx     # Auto-scroll + jump-to-bottom
│   ├── chat-input.tsx        # Auto-resizing textarea, send/stop
│   ├── message-bubble.tsx    # User/assistant bubbles + actions
│   ├── markdown.tsx          # Styled renderer w/ copy-able code blocks
│   ├── typing-indicator.tsx  # Flame-flicker dots
│   ├── welcome-screen.tsx    # Empty state + suggestion cards
│   └── theme-toggle.tsx
├── hooks/
│   ├── use-spyro-chat.ts     # send / stop / regenerate streaming logic
│   └── use-pwa-install.ts    # beforeinstallprompt handling
├── store/chat-store.ts       # Zustand + localStorage persistence
└── lib/utils.ts
public/
├── sw.js                     # Service worker (installability + offline shell)
└── icons/                    # PWA icons (192, 512, maskable, apple-touch, favicon)
scripts/
└── generate-icons.ts         # Regenerate icons from SVG via sharp
```

## 🛠️ Tech stack

- **Next.js 16** (App Router) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York)
- **Framer Motion** for animation
- **Zustand** for client state (persisted)
- **react-markdown** + **remark-gfm**
- **next-themes** for dark/light mode
- **sharp** for icon generation

## 🔒 Notes

- This app calls the free Pollination AI text endpoint server-side only.
  No API key is required.
- `z-ai-web-dev-sdk` is available but not used; the SPYRO V1 persona is
  served entirely via the free Pollination AI API.

---

Built with fire by SPYRO Labs. 🐉🔥
