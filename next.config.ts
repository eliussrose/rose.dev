import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // Enable standalone mode for Electron
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
