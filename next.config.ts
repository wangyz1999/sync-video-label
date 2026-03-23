import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Allow longer execution times for API routes
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
