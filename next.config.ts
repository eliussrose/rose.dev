import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  trailingSlash: false,
  // Empty turbopack config to silence warning
  turbopack: {},
  // Server external packages
  serverExternalPackages: ['child_process'],
};

export default nextConfig;
