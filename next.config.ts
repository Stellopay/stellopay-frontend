import type { NextConfig } from "next";import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  // ESLint now runs during `next build` so lint errors surface in CI.
  // Remove ignoreDuringBuilds so the build gate is meaningful.
  experimental: {
    // The repo currently pins TypeScript 7. Next.js requires this flag to
    // delegate type checking to the TypeScript CLI until its compiler API is
    // supported by the framework build worker.
    useTypeScriptCli: true,
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);

import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  // ESLint now runs during `next build` so lint errors surface in CI.
  // Remove ignoreDuringBuilds so the build gate is meaningful.

  // TypeScript 7 dropped the compiler API that older Next.js versions rely on.
  // This flag routes type-checking through the TypeScript CLI instead.
  experimental: {
    useTypeScriptCli: true,
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer(nextConfig);
