/**
 * Runtime configuration. Reads from Expo Constants (app.config.ts → extra).
 */
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiUrl?: string;
};

export const API_BASE_URL: string =
  extra.apiUrl && extra.apiUrl.length > 0
    ? extra.apiUrl.replace(/\/$/, "")
    : "https://your-spyro-v1-backend.vercel.app";

export const MODEL_NAME = "SPYRO V1";
export const STORAGE_VERSION = 1;
