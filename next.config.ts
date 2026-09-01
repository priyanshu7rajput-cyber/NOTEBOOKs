import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    // Verified with npx tsc --noEmit (0 errors)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
