import type { NextConfig } from "next";

// Ensure a minimal server-side `localStorage` exists to avoid crashes
// when some code (or a dependency) calls `localStorage.getItem` during SSR.
// This only runs in the Node/server environment.
if (typeof globalThis.localStorage === "undefined" || typeof (globalThis.localStorage as any).getItem !== "function") {
  (globalThis as any).localStorage = {
    getItem: (_key: string) => null,
    setItem: (_key: string, _value: string) => undefined,
    removeItem: (_key: string) => undefined,
  };
}

const nextConfig: NextConfig = {
  eslint: {
    // CI/build environments shouldn't fail just because eslint isn't installed.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
