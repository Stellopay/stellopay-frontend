import type { NextConfig } from "next";
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
