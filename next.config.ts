import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // Standalone mode for Electron production
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
