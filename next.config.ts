import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { SECURITY_HEADERS } from "./lib/security-headers";

const nextConfig: NextConfig = {
  // ESLint now runs during `next build` so lint errors surface in CI.
  experimental: {
    // The repo currently pins TypeScript 7. Next.js requires this flag to
    // delegate type checking to the TypeScript CLI until its compiler API is
    // supported by the framework build worker.
    useTypeScriptCli: true,
  },

  // Image optimization configuration to control image budgets, modern formats,
  // responsive breakpoints, and cache lifespan.
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 20, 24, 32, 40, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Apply the security policy to every route so the deployed preview and
  // production serve identical protection.
  headers: async () => [
    {
      source: "/(.*)",
      headers: [...SECURITY_HEADERS] as { key: string; value: string }[],
    },
  ],
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
