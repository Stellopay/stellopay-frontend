import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESLint now runs during `next build` so lint errors surface in CI.
  // Remove ignoreDuringBuilds so the build gate is meaningful.
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
