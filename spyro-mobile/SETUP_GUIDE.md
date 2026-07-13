# SPYRO V1 Mobile — Setup Guide

**The single source of truth for getting the app running on your machine.**

This guide covers every gotcha you'll hit on Windows, macOS, and Linux.
Follow it top-to-bottom and you'll have the SPYRO V1 app on your phone in
~20 minutes.

> **Stack:** Expo SDK 53 · React Native 0.79 · React 19 · TypeScript 5
> **Works with:** Node 20 LTS **and** Node 22

---

## Table of contents

1. [Prerequisites](#1-prerequisites)
2. [Install Node 20 (or 22)](#2-install-node)
3. [Clone & install dependencies](#3-clone--install)
4. [Deploy the backend](#4-deploy-the-backend)
5. [Point the app at the backend](#5-point-the-app-at-the-backend)
6. [Generate app icons](#6-generate-app-icons)
7. [Run on your phone](#7-run-on-your-phone)
8. [Building for the App Store / Play Store](#8-building-for-stores)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

| Thing | Why | Where to get it |
|---|---|---|
| **Node 20 LTS** (or Node 22) | Runs the Expo CLI + Metro bundler | https://nodejs.org |
| **A package manager** — `npm` (ships with Node) or `bun` | Installs dependencies | npm is easiest on Windows |
| **Expo Go** app on your phone | Runs the app during development (no build step) | App Store / Play Store (free) |
| **A GitHub account** | To clone the repo | github.com |
| **A Vercel account** (free) | Hosts the backend with HTTPS | vercel.com |
| **iPhone or Android** | The phone you'll test on | — |

> **You do NOT need:** Xcode, Android Studio, CocoaPods, or a Mac. Expo Go
> handles all of that. You only need those tools later, when building for
> the stores (Section 8).

---

## 2. Install Node

**This is the #1 blocker people hit.** Expo SDK 53 needs Node 20 or 22.
If you have an older Node (18 or below) or a newer one (23+), upgrade.

### Check your version
```bash
node --version
```
- ✅ `v20.x.x` → you're good
- ✅ `v22.x.x` → you're good (SDK 53 supports it)
- ❌ `v18.x.x` or lower → upgrade
- ❌ `v23.x.x` or higher → downgrade to 22

### Windows
1. Go to https://nodejs.org → download the **20.x LTS** Windows Installer (.msi)
2. Run it — it replaces your old Node
3. **Close ALL terminals**, open a new PowerShell, run `node --version` to confirm
4. If it still shows the old version: Settings → Apps → uninstall the old Node → reinstall

**Prefer nvm-windows?** Install from https://github.com/coreybutler/nvm-windows/releases, then:
```powershell
nvm install 22.11.0
nvm use 22.11.0
```

### macOS
```bash
# Option A: official installer
# Download from https://nodejs.org → run the .pkg

# Option B: Homebrew (recommended)
brew install node@22
brew link --overwrite node@22

# Option C: nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22
```

### Linux
```bash
# Using nvm (works on most distros)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22
```

---

## 3. Clone & install

```bash
git clone https://github.com/meshmusic2836-lab/slackbot
cd slackbot/spyro-mobile
```

### Install dependencies

**On Windows — use `npm`** (Bun has a known EPERM bug on Windows):
```powershell
npm install
```

**On macOS / Linux — `bun` is faster:**
```bash
bun install
```

> **If you see `npm error ERESOLVE`** about peer dependencies: the repo
> ships a `.npmrc` with `legacy-peer-deps=true` that handles this
> automatically. If you still see it, run
> `npm install --legacy-peer-deps`.

### Install the dev tools (for icon generation)
```bash
npm install --save-dev sharp tsx      # npm
# or
bun add -d sharp tsx                   # bun
```

This takes ~2 minutes. When it's done, you should see a `node_modules/`
folder with ~1000 packages.

---

## 4. Deploy the backend

The mobile app needs an **HTTPS** backend (phones can't reach `localhost`).
The backend is the **Next.js app in the repo root** (not `spyro-mobile/`).

### Deploy to Vercel (free, ~2 minutes)

1. Go to https://vercel.com/new
2. Sign in with GitHub
3. **Import** the `meshmusic2836-lab/slackbot` repository
4. **Important settings:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (the repo root — NOT `spyro-mobile`)
   - **Build Command:** leave default
   - **Install Command:** leave default
5. Click **Deploy**
6. Wait ~1 minute for the build to finish
7. Copy your deployment URL — it looks like `https://slackbot-xxx.vercel.app`

### Verify the backend works

Open this URL in your browser (replace with your URL):
```
https://slackbot-xxx.vercel.app/api/chat
```
You should see:
```json
{"model":"SPYRO V1","status":"online","description":"Dragon-powered AI chat. POST { messages: [{role, content}] } to stream a response."}
```
If you see that, your backend is live. ✅

---

## 5. Point the app at the backend

Open `spyro-mobile/app.config.ts` in any text editor (VS Code, Notepad, etc.).

Find this line (near the bottom, in the `extra` block):
```ts
apiUrl: "https://your-spyro-v1-backend.vercel.app",
```

Replace it with your actual Vercel URL:
```ts
apiUrl: "https://slackbot-xxx.vercel.app",
```

Save the file.

---

## 6. Generate app icons

The app needs `icon.png`, `splash.png`, etc. in the `assets/` folder.
A script generates them from the dragon SVG:

```bash
npm run gen:icons      # npm
# or
bun run scripts/generate-icons.ts   # bun
```

You should see:
```
✓ assets/icon.png (1024x1024)
✓ assets/adaptive-icon.png
✓ assets/splash.png (1242x2436)
✓ assets/favicon.png (48x48)

Done. Make sure assets/ is referenced in app.config.ts.
```

> **If you get `Top-level await is not supported`:** you're on an old version
> of the script. `git pull` to get the fix (it's wrapped in an async IIFE
> now).

---

## 7. Run on your phone

### Start the dev server
```bash
npx expo start
```

You'll see a QR code in your terminal + a URL like
`exp://192.168.x.x:8081` or `https://u.expo.dev/...`.

### Open on your phone

**iPhone:**
1. Install **Expo Go** from the App Store
2. Open the **Camera** app
3. Point it at the QR code in your terminal
4. Tap the notification that appears

**Android:**
1. Install **Expo Go** from the Play Store
2. Open Expo Go
3. Tap **Scan QR code**
4. Scan the QR code in your terminal

The SPYRO V1 app loads. Tap a suggestion card or type a message —
SPYRO V1 will stream a reply. 🐉🔥

### If your phone can't connect

The most common cause: your phone and computer aren't on the same WiFi, OR
your computer's firewall is blocking port 8081. Two fixes:

**Fix A — use Expo's tunnel (works over any network):**
```bash
npx expo start --tunnel
```
This gives you a public URL. Scan the new QR code.

**Fix B — press `s` in the terminal** to switch to Expo Go development mode.

---

## 8. Building for stores

When you're ready to ship a real installable binary to the App Store / Play
Store (not Expo Go), you'll use **EAS Build** (cloud builds — no local
Xcode/Android Studio needed for the build itself).

### One-time setup
```bash
npm install -g eas-cli
eas login                       # create a free expo.dev account
eas init                        # creates a project ID — paste into app.config.ts extra.eas.projectId
```

### Build a development client (for testing native modules)
```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Build production binaries
```bash
eas build --profile production --platform ios
eas build --profile production --platform android
```

### Submit to stores
Fill in your Apple ID + Play service account in `eas.json`, then:
```bash
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

### OTA updates (JS-only fixes, no store review)
```bash
eas update --branch production --message "fix: ..."
```

Full store listing copy is in `spyro-mobile/store-metadata/STORE_LISTING.md`.

---

## 9. Troubleshooting

### `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`
**Cause:** You're on Node 22+ with Expo SDK 52 (the old version).
**Fix:** Either install Node 20, OR `git pull` to get the SDK 53 upgrade
(SDK 53 supports Node 22). Then `rm -rf node_modules && npm install`.

### `npm error ERESOLVE unable to resolve dependency tree`
**Cause:** React Native peer-dependency conflicts.
**Fix:** The repo's `.npmrc` sets `legacy-peer-deps=true` automatically. If
you still see it: `npm install --legacy-peer-deps`.

### `EPERM: Operation not permitted` (Bun on Windows)
**Cause:** Bun's cache file-moving trips on Windows Defender.
**Fix:** Use `npm install` instead of `bun install` on Windows. Or add the
project folder to Windows Defender's exclusion list.

### `Top-level await is currently not supported with the "cjs" output format`
**Cause:** Old version of `scripts/generate-icons.ts`.
**Fix:** `git pull` — the script is now wrapped in an async IIFE.

### `Remove-Item: IOException` when deleting `node_modules` (PowerShell)
**Cause:** React Native's deep folder paths exceed Windows limits.
**Fix:** Use cmd's `rmdir` instead of PowerShell's `Remove-Item`:
```cmd
rmdir /s /q node_modules
```

### The app loads but every message says "SPYRO V1 lost its fire"
**Cause:** The app can't reach the backend. Either:
- You didn't set `apiUrl` in `app.config.ts` (Section 5)
- Your backend URL isn't HTTPS (phones require HTTPS)
- Your Vercel deployment failed

### QR code shows but Expo Go says "could not connect"
**Cause:** Phone and computer aren't on the same network, or firewall blocks port 8081.
**Fix:** `npx expo start --tunnel` (Section 7).

### `Unable to load script. Make sure you're running Metro`
**Cause:** Metro bundler crashed. Press `r` in the terminal to restart, or
`Ctrl+C` and run `npx expo start` again.

### The app crashes on launch
**Cause:** Most likely a native module Expo Go can't load.
**Fix:** This repo uses only Expo Go–compatible modules (no MMKV). If you
added a native module, you need a development build:
`eas build --profile development`.

---

## Need more help?

- **Full architecture & roadmap:** [`docs/NATIVE_APP_PLAN.md`](../docs/NATIVE_APP_PLAN.md)
- **Project status (what's built):** [`docs/PROJECT_STATUS.md`](../docs/PROJECT_STATUS.md)
- **Store listing copy:** [`spyro-mobile/store-metadata/STORE_LISTING.md`](store-metadata/STORE_LISTING.md)
- **Privacy policy:** hosted at `/privacy` on your Vercel deployment
- **Issues:** https://github.com/meshmusic2836-lab/slackbot/issues

Built with fire by SPYRO Labs. 🐉🔥
