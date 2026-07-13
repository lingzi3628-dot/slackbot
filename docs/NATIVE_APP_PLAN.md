# SPYRO V1 — Native Mobile App
### Full Specification & Build Plan (React Native + Expo)

> **Status:** Planning spec
> **Target:** Real installable iOS & Android apps, distributed via the App Store and Google Play (not a PWA).
> **Backend:** Reuses the existing SPYRO V1 streaming endpoint (`/api/chat`) already shipped in this repo.

---

## 1. Executive Summary

SPYRO V1 is currently a Next.js web app + PWA. This document specifies how to
ship it as a **real native mobile app** — a binary you download from the App
Store or Play Store, that launches from the home screen with its own icon,
runs full-screen, and can use native device capabilities (haptics, biometrics,
push notifications, sharing).

We will build it with **React Native + Expo** from a single TypeScript
codebase, reusing the existing dragon/fire design language and the existing
SPYRO V1 backend (the persona + Pollinations AI streaming proxy). No rewrite
of the backend is required.

**Why this stack:**
- One codebase → both App Store and Play Store binaries.
- Expo's managed workflow + EAS Build means **no local Xcode/Android Studio** is
  required for day-to-day development; cloud builds handle signing.
- Expo Router gives file-based routing identical in spirit to Next.js App
  Router — the team's existing mental model transfers directly.
- The existing `/api/chat` endpoint and SPYRO V1 persona are reused as-is.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **React Native 0.76+** (New Architecture / Fabric) | Industry standard, mature |
| Tooling | **Expo SDK 52+** (managed) | Cloud builds, OTA updates, no native fiddling |
| Language | **TypeScript 5** | Match the web app |
| Routing | **Expo Router v4** (file-based) | Familiar to Next.js devs |
| State | **Zustand 5** + **react-native-mmkv** persistence | Same store shape as web; MMKV is sync + fast |
| Streaming HTTP | `expo-fetch` + `react-native-fetch-api` polyfill + `text-event-stream` parser | RN's fetch doesn't stream natively; polyfill restores ReadableStream |
| Markdown | **react-native-markdown-display** | RN-native renderer w/ custom rules |
| Animations | **react-native-reanimated 3** + **react-native-gesture-handler** | UI-thread animations, 60fps |
| Lists | **@shopify/flash-list** | Virtualized message list, recycles cells |
| Icons | **@expo/vector-icons** (Ionicons) + **react-native-svg** for the dragon mark | Crisp at any DPI |
| Theming | Custom tokens + `useColorScheme()` + Zustand override | Dark-first, ember palette |
| Haptics | **expo-haptics** | Send/stop/regenerate feedback |
| Secure storage | **expo-secure-store** | For future auth tokens / biometric secrets |
| Filesystem | **expo-file-system** + **expo-sharing** | Export & share conversations |
| Biometrics | **expo-local-authentication** | Face ID / fingerprint lock |
| Notifications | **expo-notifications** | Optional push for "response ready" |
| OTA updates | **expo-updates** | Ship JS-only fixes without store review |
| Status bar / system UI | **expo-status-bar**, **expo-system-ui**, **expo-navigation-bar** | Edge-to-edge, themed bars |
| Build / Ship | **EAS Build** + **EAS Submit** + **EAS Update** | Cloud builds + store submission |
| Crash reporting | **@sentry/react-native** | Production crashes |
| Analytics (optional) | **posthog-react-native** | Product analytics, self-hostable |

---

## 3. Architecture

```
┌─────────────────────┐        HTTPS (streaming SSE)         ┌──────────────────────┐
│  SPYRO V1 Mobile    │  ─────────────────────────────────▶  │  SPYRO V1 Backend    │
│  (React Native)     │                                       │  (Next.js on Vercel) │
│                     │  ◀─────────────────────────────────  │  /api/chat           │
│  Expo Router        │        token-by-token text            │  (persona + proxy)   │
│  Zustand + MMKV     │                                       └─────────┬────────────┘
└─────────────────────┘                                                  │
                                                                         ▼
                                                          ┌──────────────────────────┐
                                                          │  Pollinations AI (free)  │
                                                          │  text.pollinations.ai    │
                                                          └──────────────────────────┘
```

**Key decision:** The mobile app calls the **existing** `/api/chat` endpoint
deployed on Vercel — the same one the web app uses. This keeps the SPYRO V1
persona, prompt injection, and streaming logic in **one place**. The mobile
client only needs to:

1. POST `{ messages: [...] }` to `https://<your-vercel>/api/chat`.
2. Read the streamed text response token-by-token.
3. Render it.

> **Alternative (not recommended):** call `text.pollinations.ai` directly from
> the app. This duplicates the persona prompt on the client, exposes the
> upstream URL, and makes future model swaps harder. Avoid.

---

## 4. Project Structure

```
spyro-mobile/
├── app/                              # Expo Router (file-based screens)
│   ├── _layout.tsx                   # Root: providers, splash, theme
│   ├── (tabs)/
│   │   ├── _layout.tsx               # Tab navigator (Chat / History / Settings)
│   │   ├── index.tsx                 # Chat tab (active conversation)
│   │   ├── history.tsx               # Conversation list
│   │   └── settings.tsx              # Theme, haptics, about
│   ├── conversation/[id].tsx         # Open a specific conversation
│   ├── onboarding.tsx                # First-launch intro
│   └── +not-found.tsx
│
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── Markdown.tsx
│   │   │   └── WelcomeEmpty.tsx
│   │   ├── SpyroLogo.tsx             # SVG dragon-flame mark
│   │   ├── ModelBadge.tsx
│   │   ├── ConversationRow.tsx
│   │   ├── SuggestionCard.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Sheet.tsx             # Bottom sheet (iOS-native feel)
│   │       └── Toast.tsx
│   ├── hooks/
│   │   ├── useSpyroChat.ts           # send / stop / regenerate (streaming)
│   │   ├── useHaptics.ts             # wrap expo-haptics
│   │   └── useBiometricLock.ts
│   ├── store/
│   │   ├── chat-store.ts             # conversations, messages (Zustand + MMKV)
│   │   └── settings-store.ts         # theme, haptics, biometrics toggles
│   ├── lib/
│   │   ├── api.ts                    # streamChat() — SSE client
│   │   ├── theme.ts                  # ember color tokens (port from web)
│   │   ├── markdown-theme.ts         # styles for react-native-markdown-display
│   │   └── constants.ts              # API base URL, model name, etc.
│   └── assets/
│       └── dragon-flame.svg
│
├── app.config.ts                     # Expo config: id, name, icon, splash, permissions
├── eas.json                          # Build profiles: development / preview / production
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## 5. Screen Inventory

### 5.1 Chat tab — `app/(tabs)/index.tsx`
- **Purpose:** the primary screen. Shows the active conversation (or the welcome
  empty-state) plus the message input.
- **Components:** `WelcomeEmpty` (when no messages), `FlashList` of
  `MessageBubble`, `ChatInput` docked above the keyboard.
- **Behaviors:** send / stop / regenerate; auto-scroll to latest; tap a message
  to copy; long-press for actions (copy, regenerate, delete).
- **Keyboard:** `KeyboardAvoidingView` (iOS) + `softwareKeyboardLayout`
  handling so the input never hides behind the keyboard.

### 5.2 History tab — `app/(tabs)/history.tsx`
- **Purpose:** list all conversations, search, rename, delete, start new.
- **Components:** `FlashList` of `ConversationRow`, search bar, "New chat" FAB.
- **Actions:** swipe-to-delete (iOS) / long-press menu (Android); tap to open.

### 5.3 Settings tab — `app/(tabs)/settings.tsx`
- **Purpose:** preferences + about.
- **Sections:**
  - Appearance → theme (system / dark / light)
  - Haptics → on/off + intensity
  - Privacy → biometric lock on/off, clear all conversations
  - About → model ("SPYRO V1"), version, GitHub link, privacy policy
- **Persistence:** `settings-store` (MMKV).

### 5.4 Conversation detail — `app/conversation/[id].tsx`
- Deep-linked screen for opening a specific conversation (used by push
  notifications and the History tab).

### 5.5 Onboarding — `app/onboarding.tsx`
- Shown once on first launch (`hasOnboarded` flag in settings-store).
- 3 slides: welcome → "Meet SPYRO V1" → privacy.
- Ends by creating the first conversation.

### 5.6 Splash
- `expo-splash-screen` controlled hide after fonts + MMKV hydrate.
- Dragon-flame logo on the warm-charcoal background.

---

## 6. Component Library

Each component is a direct port of the web equivalent, adapted to RN primitives.

| Component | RN primitives used | Notes |
|---|---|---|
| `SpyroLogo` | `react-native-svg` | Same path data as the web SVG |
| `ModelBadge` | `View` + `Text` + `SpyroLogo` | |
| `MessageBubble` | `View`, `Text`, `Pressable`, `Reanimated` | Animated enter, long-press menu |
| `ChatInput` | `TextInput` (multiline) + auto-grow | `KeyboardAvoidingView` aware |
| `TypingIndicator` | 3 `View` dots + Reanimated | Flame-flicker loop |
| `Markdown` | `react-native-markdown-display` | Custom rules for code blocks w/ copy |
| `WelcomeEmpty` | `ScrollView` + `SuggestionCard`s | |
| `ConversationRow` | `Pressable` + swipe actions | |
| `Sheet` | `@gorhom/bottom-sheet` | Rename / delete confirmations |

---

## 7. Navigation Map

```
Root (_layout.tsx)
├── Onboarding (modal, first launch)
└── (tabs) _layout.tsx
    ├── Chat            → index.tsx
    ├── History         → history.tsx  ──▶ conversation/[id].tsx (stack)
    └── Settings        → settings.tsx
```

- **Tab bar:** custom, fire-themed. Active tab indicator uses the ember gradient.
- **Modal stack:** onboarding, biometric lock, "about" sheet.

---

## 8. State Management

Identical shape to the web app (so logic ports directly). Two stores:

### `chat-store.ts`
```ts
interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  isGenerating: boolean;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setActive: (id: string) => void;
  addMessage: (convoId, msg) => string;
  appendToMessage: (id, chunk) => void;
  setMessage: (id, patch) => void;
  setGenerating: (v: boolean) => void;
}
```
Persisted to **MMKV** (`react-native-mmkv` storage adapter) — synchronous, so
no hydration flash on launch.

### `settings-store.ts`
```ts
interface SettingsState {
  theme: 'system' | 'dark' | 'light';
  hapticsEnabled: boolean;
  hapticIntensity: 'light' | 'medium' | 'heavy';
  biometricLock: boolean;
  hasOnboarded: boolean;
}
```

---

## 9. Data Persistence

- **Engine:** `react-native-mmkv` (sync, encrypted option available).
- **Schema:** unchanged from the web app — `Conversation` and `Message` types
  are shared (a future `packages/shared` could hold them).
- **Export/import:** settings screen exposes "Export conversations" → writes
  JSON to `FileSystem.documentDirectory` → opens `expo-sharing` sheet.
- **Migration:** a version key in storage; bump + migrate function on schema
  changes.

---

## 10. Theming

Port the web's ember palette to RN tokens. Dark is the default.

```ts
// src/lib/theme.ts
export const darkTheme = {
  background: '#16110d',   // warm charcoal
  surface:   '#211410',    // card
  surfaceElevated: '#2b1c15',
  primary:   '#ff7a1a',    // ember orange
  primaryForeground: '#16110d',
  text:      '#f5ecd9',
  textMuted: '#a99c87',
  border:    'rgba(255,255,255,0.09)',
  destructive: '#e85a3c',
};
export const lightTheme = { /* ...warm parchment... */ };
```

- `useColorScheme()` for system preference, overridable via `settings-store`.
- `StatusBar` + `expo-system-ui` set the bar style to match.
- Android: `expo-navigation-bar` tints the nav bar to `background`.

---

## 11. API Layer (Streaming)

```ts
// src/lib/api.ts
import {BASE_URL} from './constants';

export interface ChatMessage { role: 'user'|'assistant'|'system'; content: string; }

export function streamChat(
  messages: ChatMessage[],
  handlers: { onToken: (t: string)=>void; onDone: ()=>void; onError: (e: Error)=>void; },
  signal?: AbortSignal,
): Promise<void> {
  return fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {'content-type':'application/json'},
    body: JSON.stringify({ messages }),
    signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) throw new Error(`SPYRO V1 error ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      handlers.onToken(decoder.decode(value, {stream:true}));
    }
    handlers.onDone();
  }).catch(handlers.onError);
}
```

> RN's `fetch` needs `react-native-fetch-api` polyfill (with `textStreaming`
> enabled) for `res.body` to be a ReadableStream. This is the single most
> important polyfill in the project — call it out in the README.

---

## 12. Native Features (the "real app" wins over PWA)

| Feature | Library | Where used |
|---|---|---|
| **Haptics** | `expo-haptics` | send, stop, regenerate, long-press |
| **Biometric lock** | `expo-local-authentication` | optional app-start lock |
| **Share conversation** | `expo-sharing` + `expo-file-system` | settings / long-press menu |
| **Push notifications** | `expo-notifications` | "response ready" when app is backgrounded (Phase 2) |
| **App icon & splash** | `expo-image`, `react-native-svg` | launcher, launch screen |
| **Edge-to-edge** | `expo-system-ui`, `react-native-safe-area-context` | notch / nav bar theming |
| **Dynamic type** | RN `allowFontScaling` + `PixelRatio` | accessibility |
| **OTA updates** | `expo-updates` | ship JS-only fixes instantly, no review |
| **iOS widget** (Phase 3) | native WidgetKit via Expo module | quick-prompt from home screen |

---

## 13. Performance Budget

- **Hermes engine** (default in Expo 52) — fast startup, low memory.
- **FlashList** for messages — recycles cells, handles 10k+ messages smoothly.
- **Reanimated 3** — animations run on the UI thread; no JS bridge blocking.
- **Memoize** `MessageBubble` with `React.memo` + stable ids.
- **Image assets** → served via `expo-asset` and pre-cached on splash.
- **Target:** cold start < 1.5s on a mid-tier Android; 60fps scroll.

---

## 14. Accessibility

- Every `Pressable` has an `accessibilityLabel` and `accessibilityRole`.
- `accessibilityHint` on icon-only buttons (send, stop, theme toggle).
- Respect `AccessibilityInfo.isReduceMotionEnabled()` — disable ember particles.
- Dynamic Type: `allowFontScaling={true}`, test at max size.
- VoiceOver/TalkBack order verified per screen.
- Color contrast ≥ AA on all text.

---

## 15. Build & Release

### 15.1 EAS Build profiles (`eas.json`)
```jsonc
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":      { "distribution": "internal", "ios": {"simulator": true} },
    "production":   { "autoIncrement": true }
  },
  "submit": {
    "production": {
      "ios":     { "appleId": "...", "ascAppId": "...", "appleTeamId": "..." },
      "android": { "serviceAccountKeyPath": "./play-key.json", "track": "internal" }
    }
  }
}
```

### 15.2 Build commands
```bash
# Local dev client
eas build --profile development --platform ios
eas build --profile development --platform android

# Production binaries for stores
eas build --profile production --platform ios
eas build --profile production --platform android

# Submit
eas submit --profile production --platform ios
eas submit --profile production --platform android

# OTA JS-only update (no review)
eas update --branch production --message "fix: ..."
```

### 15.3 Signing
- **iOS:** Apple Developer account ($99/yr). EAS manages certs +
  provisioning profiles automatically via `eas credentials`.
- **Android:** Generate an upload keystore once; store in EAS credentials.
  Play app signing enforces it.

### 15.4 Versioning
- `app.config.ts`: `version: "1.0.0"`, bump per release.
- `runtimeVersion` for `expo-updates` → tie to native version so OTA updates
  only target compatible native shells.

---

## 16. CI/CD (GitHub Actions)

```yaml
# .github/workflows/mobile.yml
on:
  push:
    branches: [main]
    paths: ['spyro-mobile/**']
jobs:
  qa:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd spyro-mobile && bun install
      - run: cd spyro-mobile && bunx tsc --noEmit
      - run: cd spyro-mobile && bunx eslint .
  update:
    needs: qa
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with: { expo-version: latest, eas-version: latest, token: ${{ secrets.EXPO_TOKEN }} }
      - run: cd spyro-mobile && eas update --auto --non-interactive
```

- Tag pushes (`v*`) trigger `eas build --profile production` + `eas submit`.

---

## 17. Analytics & Crash Reporting

- **Sentry** (`@sentry/react-native`) — crashes, ANRs, performance traces.
  Release-track source maps uploaded by EAS Build post-publish hook.
- **PostHog** (optional, self-hostable) — funnel analytics. Respect iOS ATT
  prompt; default OFF until user opts in.
- **No PII** logged. Conversation content never leaves the device except to
  the SPYRO V1 backend.

---

## 18. App Store Metadata

| Field | Value |
|---|---|
| App name | SPYRO V1 |
| Subtitle (iOS) | Dragon-powered AI chat |
| Category (iOS) | Productivity |
| Category (Android) | Productivity / AI |
| Keywords | spyro, ai, chatbot, assistant, dragon, chat |
| Content rating | 17+ (unrestricted web content — AI chat) |
| Privacy policy URL | `https://<your-domain>/privacy` (host on the Vercel site) |
| Primary language | English |
| Screenshots | 6.7" iPhone, 6.5" iPhone, iPad 12.9", Android phone, Android 7" tablet |

> ⚠️ **App Store AI policy:** Apple requires apps with AI-generated content to
> include a content-moderation mechanism and report harmful content. Phase 2
> adds an optional profanity filter + an in-app "report" action.

---

## 19. Cost Estimate (annual)

| Item | Cost |
|---|---|
| Apple Developer Program | $99 / yr |
| Google Play Console | $25 one-time |
| Vercel (backend hosting) | $0 (Hobby) — upgrade if traffic grows |
| EAS Build | $0 (free tier, 30 builds/mo) → $19/mo Pro if exceeded |
| Sentry | $0 (developer tier) |
| Domain (privacy policy) | ~$12 / yr |
| **Year 1 total** | **~$140** + optional EAS Pro |

---

## 20. Development Roadmap

| Phase | Scope | Est. |
|---|---|---|
| **0. Scaffold** | Expo project, EAS config, theme tokens, splash, navigation shell | 1 day |
| **1. Core chat** | API streaming client, `useSpyroChat`, `MessageBubble`, `ChatInput`, `Markdown`, welcome screen, send/stop/regenerate | 3 days |
| **2. History & persistence** | `chat-store` + MMKV, History tab, rename/delete, conversation detail | 2 days |
| **3. Polish** | Reanimated enter animations, ember particles (skipped if reduced-motion), haptics, theme toggle, settings tab | 2 days |
| **4. Native features** | Biometric lock, share/export, edge-to-edge, dynamic type, VoiceOver pass | 2 days |
| **5. Build & submit** | EAS Build production iOS+Android, store metadata, screenshots, privacy policy, TestFlight internal + external, store review | 3–7 days (review time) |
| **6. Post-launch** | Push notifications, OTA pipeline, Sentry alerts, optional iOS widget | ongoing |

**MVP (Phases 0–3) → ~8 working days.** Shippable to TestFlight + Play
Internal in ~10 days; public release ~2 weeks after submission.

---

## 21. File-by-File Implementation Guide

### `app.config.ts`
```ts
export default {
  name: 'SPYRO V1',
  slug: 'spyro-v1',
  scheme: 'spyro',                      // deep linking
  version: '1.0.0',
  runtimeVersion: { policy: 'appVersion' },
  icon: './assets/icon.png',
  splash: { image: './assets/splash.png', backgroundColor: '#16110d', resizeMode: 'contain' },
  android: { package: 'com.spyrolabs.spyrov1', adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#16110d' } },
  ios: { bundleIdentifier: 'com.spyrolabs.spyrov1', supportsTablet: true },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-local-authentication',
    ['expo-updates', { url: 'https://u.expo.dev/<project-id>' }],
  ],
  extra: { eas: { projectId: '<project-id>' } },
};
```

### `src/store/chat-store.ts`
Direct port of `src/store/chat-store.ts` from the web app, swapping the
`persist` storage from `localStorage` to MMKV:
```ts
import { MMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';
const mmkv = new MMKV({ id: 'spyro-v1' });
const storage = createJSONStorage(() => ({
  getItem: (k) => mmkv.getString(k) ?? null,
  setItem: (k, v) => mmkv.set(k, v),
  removeItem: (k) => mmkv.delete(k),
}));
// ... same store definition as web, { name:'spyro-v1-chat', storage }
```

### `src/hooks/useSpyroChat.ts`
Direct port — only the streaming call swaps from `fetch('/api/chat')` to
`streamChat(messages, handlers, signal)` from `src/lib/api.ts` (which targets
the deployed Vercel URL).

### `app/(tabs)/index.tsx` (chat screen)
```tsx
export default function ChatScreen() {
  const { send, stop, regenerate } = useSpyroChat();
  const active = useChatStore(s => s.conversations.find(c => c.id === s.activeId));
  const ref = useRef<FlashList<Message>>(null);

  return (
    <SafeAreaView edges={['top']} style={{flex:1, backgroundColor: theme.background}}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
        {!active || active.messages.length===0
          ? <WelcomeEmpty onPick={send} />
          : <FlashList
              ref={ref}
              data={active.messages}
              keyExtractor={m => m.id}
              renderItem={({item, index}) => (
                <MessageBubble
                  message={item}
                  isLast={index === active.messages.length-1}
                  onRegenerate={regenerate}
                />
              )}
              estimatedItemSize={120}
              contentContainerStyle={{padding: 12, gap: 16}}
            />}
        <ChatInput onSend={send} onStop={stop} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
```

### `src/components/chat/ChatInput.tsx`
- `TextInput` multiline, auto-grow via `onContentSizeChange`.
- Send button → `expo-haptics.impactAsync(ImpactFeedbackStyle.Medium)`.
- Stop button replaces send while generating (Reanimated crossfade).

---

## 22. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| RN `fetch` doesn't stream out of the box | `react-native-fetch-api` polyfill + enable `textStreaming`; documented in README |
| App Store rejects AI apps without moderation | Phase 2 adds profanity filter + in-app report; metadata declares content-moderation policy |
| Pollinations rate-limits / downtime | Backend already handles 502s gracefully; surface a friendly "dragon's resting" toast |
| Keyboard covers input on Android | `KeyboardAvoidingView` + `softwareKeyboardLayout` config in `app.config.ts` |
| MMKV encryption overhead | Optional; off by default, on only if biometric lock enabled |
| OTA update ships broken JS | `expo-updates` rollback + staged rollout (EAS Update channels) |
| Apple review cycles (3–7 days) | Use OTA for hotfixes; reserve binary releases for major versions |

---

## 23. Deliverables Checklist

- [ ] `spyro-mobile/` Expo project (Phases 0–4)
- [ ] EAS Build + Submit configured (`eas.json`, credentials)
- [ ] App Store Connect + Play Console entries created
- [ ] Privacy policy page hosted on the Vercel site
- [ ] 6.7" + 6.5" + iPad + Android screenshots
- [ ] TestFlight internal + external beta
- [ ] Play Internal + Closed testing
- [ ] Production submission
- [ ] Sentry project + source-map upload on build
- [ ] OTA update channel (`production`) configured

---

## 24. Next Actions (to start)

1. Create `spyro-mobile/` Expo project: `npx create-expo-app@latest spyro-mobile --template tabs`.
2. Install the stack (Section 2).
3. Port `src/lib/theme.ts`, `src/store/chat-store.ts`, `src/hooks/useSpyroChat.ts`, `src/lib/api.ts` from this repo.
4. Port components one-by-one (`SpyroLogo` first — the rest depend on it).
5. Wire `app/(tabs)/index.tsx` chat screen.
6. `eas build --profile development --platform ios` → install on a device.
7. Iterate. Ship.

---

**Built with fire by SPYRO Labs.** 🐉🔥
