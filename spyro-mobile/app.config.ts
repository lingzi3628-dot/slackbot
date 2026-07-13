/// <reference types="expo/types" />

// NOTE: before running, fill in `extra.eas.projectId` with your Expo project ID
// (shown when you run `eas init`), and point `extra.apiUrl` at your deployed
// SPYRO V1 backend on Vercel (the Next.js app in the repo root).
export default {
  name: "SPYRO V1",
  slug: "spyro-v1",
  scheme: "spyro",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  runtimeVersion: { policy: "appVersion" },
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#16110d",
  },
  ios: {
    bundleIdentifier: "com.spyrolabs.spyrov1",
    supportsTablet: true,
    infoPlist: {
      NSFaceIDUsageDescription:
        "SPYRO V1 can use Face ID to lock access to your conversations.",
    },
  },
  android: {
    package: "com.spyrolabs.spyrov1",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#16110d",
    },
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-local-authentication",
    "expo-clipboard",
    "expo-file-system",
    "expo-sharing",
    [
      "expo-notifications",
      {
        icons: [
          {
            icon: "./assets/icon.png",
            color: "#16110d",
          },
        ],
      },
    ],
    [
      "expo-updates",
      { username: "spyrolabs" },
    ],
  ],
  experiments: {
    tsconfigPaths: true,
  },
  extra: {
    eas: {
      projectId: "REPLACE_WITH_YOUR_EAS_PROJECT_ID",
    },
    // The deployed SPYRO V1 Next.js backend (the /api/chat endpoint).
    apiUrl: "https://your-spyro-v1-backend.vercel.app",
  },
};
