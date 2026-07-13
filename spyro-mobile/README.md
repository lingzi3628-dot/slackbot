# SPYRO V1 — Mobile App (React Native + Expo)

The native iOS & Android app for **SPYRO V1**, the dragon-powered AI chat
assistant. One TypeScript codebase → both the App Store and Google Play.

This app reuses the **existing SPYRO V1 backend** (the Next.js app in the repo
root) — specifically its `/api/chat` streaming endpoint that proxies the free
Pollination AI text API and rebrands responses as SPYRO V1.

> 📖 For the full architecture & roadmap, see
> [`docs/NATIVE_APP_PLAN.md`](../docs/NATIVE_APP_PLAN.md).

---

## ✨ What's implemented (Phase 0 + 1 + 2 + 5) — Expo SDK 53

This is a **store-ready MVP** running on Expo SDK 53 (React Native 0.79, React 19):

- ✅ Expo Router tab navigation (Chat / History / Settings)
- ✅ First-launch onboarding flow
- ✅ Streaming chat — real token-by-token responses from the SPYRO V1 backend
- ✅ Markdown rendering (headings, lists, code blocks, tables) with copy-on-long-press
- ✅ Conversation history persisted to device (MMKV) — rename, delete, clear all
- ✅ Stop generation mid-stream
- ✅ Regenerate last response
- ✅ Dragon/fire ember theme, dark + light, system override
- ✅ Haptic feedback (send, stop, regenerate, long-press)
- ✅ Welcome screen with suggestion cards
- ✅ Keyboard-aware input with auto-grow
- ✅ **Biometric lock** — Face ID / Touch ID / fingerprint on app launch + background (Phase 2)
- ✅ **Push notifications** — local "response ready" alert when the app is backgrounded (Phase 2)
- ✅ **Export & share** — single conversation as Markdown, or all conversations as JSON (Phase 2)
- ✅ **GitHub Actions CI** — typecheck + lint on every PR, auto OTA update on main, manual production build (Phase 5)
- ✅ **Store metadata** — copy-paste App Store + Play Store listing in `store-metadata/STORE_LISTING.md` (Phase 5)
- ✅ **Privacy policy** — hosted at `/privacy` on the Next.js backend (Phase 5)
- ✅ FlashList virtualized messages

### Not yet (Phase 3+)
- Polish pass (animated ember particles, transitions)
- iOS home-screen widget
- Sentry crash reporting integration
- Remote push (server-sent, not just local) — requires a push server

---

## 🔁 CI/CD (GitHub Actions)

A workflow is included at `.github/workflows/mobile.yml` (in the repo root).
It runs on every push/PR that touches `spyro-mobile/`:

1. **Typecheck** — `bun run typecheck`
2. **Lint** — `bun run lint`
3. **OTA update** (on merges to `main`) — ships a JS-only update to the
   `production` EAS Update channel via `eas update --auto`. No store review.
4. **Production build** (manual `workflow_dispatch`) — runs
   `eas build --profile production` for iOS + Android in the cloud, then
   auto-submits to the stores.

**Required GitHub secret:** `EXPO_TOKEN` — create at
https://expo.dev/accounts/[you]/settings/access-tokens, then add it as a
repository secret (Settings → Secrets and variables → Actions → New).

---

## 📖 Full setup guide

**👉 See [`SETUP_GUIDE.md`](./SETUP_GUIDE.md) for the complete step-by-step
guide** — covers Node installation, dependency install on Windows/Mac/Linux,
backend deployment, icon generation, troubleshooting, and store builds.

The short version (for macOS/Linux with Node 20+ already installed):

```bash
git clone https://github.com/meshmusic2836-lab/slackbot
cd slackbot/spyro-mobile
npm install
npm install --save-dev sharp tsx
npm run gen:icons
# edit app.config.ts → set extra.apiUrl to your Vercel deployment
npx expo start
# scan the QR with Expo Go on your phone
```

> **Requires Node 20 or 22.** Node 18 or Node 23+ will not work with Expo SDK 53.

---

## 🚀 Quick start (summary)

### Prerequisites
- **Node 20 LTS** or **Node 22** (NOT 18, NOT 23+) — see [SETUP_GUIDE.md](./SETUP_GUIDE.md) Section 2
- **npm** (ships with Node) — recommended on Windows
- **Expo Go** app on your phone (free, from App Store / Play Store)
- The **SPYRO V1 backend deployed to HTTPS** — see [SETUP_GUIDE.md](./SETUP_GUIDE.md) Section 4

### 1. Install
```bash
cd spyro-mobile
bun install          # or: npm install
```

### 2. Configure the backend URL
Edit `app.config.ts` → set `extra.apiUrl` to your deployed backend:
```ts
extra: {
  eas: { projectId: "REPLACE_WITH_YOUR_EAS_PROJECT_ID" },
  apiUrl: "https://your-spyro-v1-backend.vercel.app",
}
```

### 3. Generate app icons (optional but recommended)
```bash
bun add -d sharp
bun run scripts/generate-icons.ts
```
This creates `assets/icon.png`, `adaptive-icon.png`, `splash.png`,
`favicon.png`.

### 4. Run
```bash
bun run start        # or: npx expo start
```
Then:
- **On your phone:** scan the QR code with the **Expo Go** app.
- **iOS simulator:** press `i` in the terminal.
- **Android emulator:** press `a` in the terminal.

---

## 📁 Project structure

```
spyro-mobile/
├── app/                          # Expo Router (file-based screens)
│   ├── _layout.tsx               # Root: polyfills, providers, splash
│   ├── onboarding.tsx            # First-launch intro (3 slides)
│   ├── +not-found.tsx
│   └── (tabs)/
│       ├── _layout.tsx           # Tab navigator
│       ├── index.tsx             # Chat tab
│       ├── history.tsx           # Conversation list
│       └── settings.tsx          # Preferences + about
├── src/
│   ├── components/
│   │   ├── SpyroLogo.tsx         # SVG dragon-flame mark
│   │   ├── ModelBadge.tsx
│   │   ├── LinearGradient.tsx    # expo-linear-gradient wrapper
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── Markdown.tsx
│   │   │   └── WelcomeEmpty.tsx
│   ├── hooks/
│   │   ├── useSpyroChat.ts       # send / stop / regenerate (streaming)
│   │   ├── useHaptics.ts
│   │   └── useTheme.ts
│   ├── store/
│   │   ├── chat-store.ts         # Zustand + MMKV (same shape as web)
│   │   └── settings-store.ts
│   ├── lib/
│   │   ├── api.ts                # streamChat() — SSE client
│   │   ├── theme.ts              # ember/fire tokens (dark + light)
│   │   ├── markdown-theme.ts
│   │   ├── constants.ts          # API base URL, model name
│   │   └── polyfills.ts          # RN fetch streaming polyfills
│   └── assets/
├── scripts/
│   └── generate-icons.ts         # sharp → PNG icons from SVG
├── app.config.ts                 # Expo config (id, icon, permissions)
├── eas.json                      # Build profiles
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## 🔌 How streaming works (important!)

React Native's bundled `fetch` does **not** expose a `ReadableStream` body by
default. This project installs polyfills at app entry
(`src/lib/polyfills.ts`, imported first in `app/_layout.tsx`):

```ts
import "react-native-polyfill-globals/auto";
import { polyfill as fetchPolyfill } from "react-native-fetch-api";
fetchPolyfill({ enableTextStreaming: true });
```

This makes `res.body.getReader()` work on-device, so `src/lib/api.ts` can
stream tokens from the SPYRO V1 backend exactly like the web app does.

---

## 📦 Building for the stores

### Prerequisites
- **Apple Developer account** ($99/yr) — for App Store
- **Google Play Console** ($25 one-time) — for Play Store
- **Expo account** (free) — for EAS Build

### 1. Log in & init EAS
```bash
bun add -g eas-cli
eas login
eas init          # creates a project ID — paste into app.config.ts extra.eas.projectId
```

### 2. Build a development client (for testing on a real device)
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### 3. Build production binaries
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### 4. Submit to stores
```bash
# Fill in eas.json → submit.production with your Apple ID / Play service key
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

### 5. OTA updates (JS-only fixes, no review)
```bash
eas update --branch production --message "fix: ..."
```

---

## 🎨 Theming

The ember/fire palette is ported 1:1 from the web app (`src/lib/theme.ts`).
Dark is the default. Toggle in Settings → Appearance.

| Token | Dark | Light |
|---|---|---|
| background | `#16110d` | `#fcf7ee` |
| surface | `#211410` | `#ffffff` |
| primary (ember) | `#ff7a1a` | `#e8651a` |
| text | `#f5ecd9` | `#3a2a1a` |
| gradient | `#ffe9a8 → #ff9a3c → #e8421b` | `#ffd27a → #ee8a2e → #d8421b` |

---

## 🛠️ Tech stack

- **React Native 0.79** (New Architecture)
- **Expo SDK 53** (managed workflow — supports Node 20 AND 22)
- **Expo Router v5** (file-based routing)
- **TypeScript 5**
- **Zustand 5** + **AsyncStorage** (Expo Go–compatible persistence; swap to MMKV for production)
- **@shopify/flash-list** (virtualized messages)
- **react-native-reanimated 3** (UI-thread animations)
- **react-native-markdown-display**
- **expo-haptics**, **expo-linear-gradient**, **expo-splash-screen**
- **EAS Build / Submit / Update**

---

## 🔄 Production storage (optional upgrade)

This app uses **AsyncStorage** so it runs in **Expo Go** out of the box
(scan a QR, no native build needed). For a production store build, you can
swap to **react-native-mmkv** for synchronous + encrypted storage:

```bash
bun add react-native-mmkv
```

Then in `src/store/chat-store.ts` and `src/store/settings-store.ts`, replace
the AsyncStorage import + storage adapter with the MMKV variant (see the
doc comment at the top of each file). MMKV requires a **development build**
(`eas build --profile development`), not Expo Go.

---

## ⚠️ Notes

- App icons must be generated with `bun run scripts/generate-icons.ts`
  before a store build (the repo doesn't commit binary PNGs).
- The backend must be deployed to **HTTPS** — mobile apps can't call plain
  HTTP. Deploy the Next.js app (repo root) to Vercel/Netlify and paste the
  URL into `app.config.ts → extra.apiUrl`.
- Requires **Node 20 or 22** (Node 18 or 23+ won't work with Expo SDK 53).

---

## 📝 License & credits

Built with fire by SPYRO Labs. 🐉🔥
Powered under the hood by the free [Pollination AI](https://pollinations.ai) text
API, rebranded as SPYRO V1.
