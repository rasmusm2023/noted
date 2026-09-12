import type { NextConfig } from "next";

function envValue(name: string): string | undefined {
  const raw =
    process.env[`NEXT_PUBLIC_${name}`] || process.env[`VITE_${name}`];
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, "").trim();
}

function publicEnv() {
  const keys = [
    "FIREBASE_API_KEY",
    "FIREBASE_AUTH_DOMAIN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_STORAGE_BUCKET",
    "FIREBASE_MESSAGING_SENDER_ID",
    "FIREBASE_APP_ID",
    "FIREBASE_MEASUREMENT_ID",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "OPENWEATHER_API_KEY",
  ] as const;

  const env: Record<string, string> = {};
  for (const key of keys) {
    const value = envValue(key);
    if (value) {
      env[`NEXT_PUBLIC_${key}`] = value;
    }
  }
  return env;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: publicEnv(),
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      type: "asset/resource",
    });
    return config;
  },
};

export default nextConfig;
