import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // CI/build environments shouldn't fail just because eslint isn't installed.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
