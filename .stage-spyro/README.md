# SPYRO V1 — Dragon-Powered AI Chat 🔥🐉

A blazing-fast, beautifully designed AI chat assistant. **SPYRO V1** is a
dragon-themed chatbot powered under the hood by the free
[Pollination AI](https://pollinations.ai) text API, fully rebranded as the
SPYRO V1 model.

![SPYRO V1](https://img.shields.io/badge/model-SPYRO%20V1-ff6b1a?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge)

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
- **Atmospheric UI** — animated ember particles, fire-gradient logo, glass
  panels, and framer-motion transitions.
- **Privacy** — `referrer` + `private` flags sent to the upstream API.

## 🚀 Quick start

```bash
bun install
bun run dev
```

Open http://localhost:3000.

### Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Start the dev server on port 3000 |
| `bun run lint` | Run ESLint |
| `bun run build` | Production build |
| `bun run db:push` | Push Prisma schema (optional — not used by the chat) |

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
│   ├── globals.css           # Dragon/fire theme
│   ├── layout.tsx
│   └── page.tsx              # Main chat shell
├── components/spyro/
│   ├── spyro-logo.tsx        # SVG dragon-flame mark
│   ├── model-badge.tsx
│   ├── chat-header.tsx
│   ├── chat-sidebar.tsx      # Conversation list (rename/delete/new)
│   ├── chat-messages.tsx     # Auto-scroll + jump-to-bottom
│   ├── chat-input.tsx        # Auto-resizing textarea, send/stop
│   ├── message-bubble.tsx    # User/assistant bubbles + actions
│   ├── markdown.tsx          # Styled renderer w/ copy-able code blocks
│   ├── typing-indicator.tsx  # Flame-flicker dots
│   ├── welcome-screen.tsx    # Empty state + suggestion cards
│   └── theme-toggle.tsx
├── hooks/use-spyro-chat.ts   # send / stop / regenerate streaming logic
├── store/chat-store.ts       # Zustand + localStorage persistence
└── lib/utils.ts
```

## 🛠️ Tech stack

- **Next.js 16** (App Router) + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (New York)
- **Framer Motion** for animation
- **Zustand** for client state (persisted)
- **react-markdown** + **remark-gfm**
- **next-themes** for dark/light mode

## 🔒 Notes

- This app calls the free Pollination AI text endpoint server-side only.
  No API key is required.
- `z-ai-web-dev-sdk` is available but not used; the SPYRO V1 persona is
  served entirely via the free Pollination AI API.

---

Built with fire by SPYRO Labs. 🐉🔥
