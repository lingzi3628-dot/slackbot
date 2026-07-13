# SPYRO V1 — App Store & Play Store Metadata

Copy-paste-ready listing copy for submitting SPYRO V1 to the App Store
and Google Play. Keep this file in sync with the actual app behavior.

---

## App name (30 chars)
```
SPYRO V1
```

## Subtitle / short description (80 chars)
```
Dragon-powered AI chat assistant
```

## Description (≤ 4000 chars)
```
Meet SPYRO V1 — the dragon-powered AI assistant that breathes fire on hard
problems and answers in a flash.

SPYRO V1 is a bold, witty, and genuinely helpful AI chat companion. Ask it to
write code, brainstorm ideas, explain tricky concepts, draft messages, or just
think through a problem with you. Answers stream in live, fully formatted with
Markdown — headings, lists, tables, and copy-able code blocks.

WHAT MAKES SPYRO V1 DIFFERENT
• Dragon-fast streaming — answers appear token-by-token, no waiting.
• Rich Markdown — clean headings, tables, lists, syntax-styled code.
• Conversation history — every chat is saved on your device, auto-titled,
  searchable, renameable, deletable.
• Stop & regenerate — cancel a reply mid-stream or ask SPYRO to try again.
• Biometric lock — keep your chats private with Face ID / Touch ID.
• Works offline-ish — your history is always available, even without signal.
• Dark & light — a warm ember palette (fire on charcoal) that's easy on the
  eyes, with a true system-following mode.
• Private by default — your conversations live on your device. Only your
  prompts are sent to the SPYRO V1 engine to generate a reply.

USE IT FOR
• Writing and debugging code
• Brainstorming product, name, and content ideas
• Explaining complex topics in plain language
• Drafting emails, messages, release notes, and posts
• Thinking through decisions with a sharp second opinion

SPYRO V1 is free to use. No account required.

Built with fire by SPYRO Labs.
```

## Keywords (iOS, ≤ 100 chars, comma-separated)
```
spyro,ai,chat,assistant,chatbot,dragon,writing,code,brainstorm,help
```

## Promotional text (iOS, ≤ 170 chars)
```
The dragon-powered AI assistant. Stream answers, write code, brainstorm — all with a fiery, witty companion.
```

## Categories
- **iOS Primary:** Productivity
- **iOS Secondary:** Utilities
- **Android:** Productivity (App type: Applications)

## Content rating
- **iOS:** 17+ (Unrestricted Web Content — AI-generated text)
- **Android:** Mature 17+ (User-generated content; AI chat)

## What's new (release notes) — v1.0.0
```
🐉 SPYRO V1 has hatched!

• Real-time streaming chat with the SPYRO V1 dragon engine
• Full Markdown rendering — code blocks, tables, lists
• Conversation history saved on-device (rename, delete, export)
• Stop & regenerate responses
• Biometric lock with Face ID / Touch ID
• Push notifications when backgrounded replies finish
• Dark + light themes with a warm ember palette
• First-launch onboarding

More fire coming soon. 🔥
```

## Privacy policy URL
```
https://<your-vercel-domain>/privacy
```
(The privacy policy page ships in the Next.js app in this repo at
`src/app/privacy/page.tsx`.)

## Support URL
```
https://github.com/meshmusic2836-lab/slackbot/issues
```

## Marketing URL
```
https://github.com/meshmusic2836-lab/slackbot
```

## Copyright
```
© 2025 SPYRO Labs
```

---

## Screenshots needed
Generate from a simulator/emulator or Figma. Required sizes:

- **iPhone 6.7"** (1290 × 2796) — 3 to 10 screenshots
- **iPhone 6.5"** (1242 × 2688) — 3 to 10 screenshots
- **iPad 12.9"** (2048 × 2732) — 3 to 10 screenshots
- **Android phone** (1080 × 1920+) — 3 to 8 screenshots
- **Android 7" tablet** (1200 × 1920) — optional

Suggested shots:
1. Welcome empty-state with the dragon logo + suggestion cards
2. Mid-stream reply with Markdown (code block visible)
3. History tab with several auto-titled conversations
4. Settings tab showing theme + biometric toggles
5. Dark mode chat in full flow

## App review notes
```
SPYRO V1 is an AI chat client. Sign-in is NOT required — the app is fully
functional on first launch. Conversations are stored locally on the device.
Prompts are sent to our backend (https://<your-vercel-domain>/api/chat) to
generate streamed AI replies. We do not collect personal data. The biometric
lock is optional and uses the device's local Face ID / Touch ID only — no
biometric data leaves the device.

Demo account: not required (no auth).
```

## Apple AI content policy checklist
Apple requires apps with user-generated / AI-generated content to:
- ✅ Provide a content-moderation mechanism (Phase 2+ will add an in-app
  "Report" action on each message)
- ✅ Provide a way to block users (N/A — no user accounts)
- ✅ Include contact info for reporting (the support URL above)
- ✅ Enforce age rating of 17+ (set above)

Until the in-app Report action ships, mention in review notes that
reporting is handled via the support URL.
