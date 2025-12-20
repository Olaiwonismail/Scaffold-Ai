import type { NextConfig } from "next";

const nextConfig: NextConfig = {
experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Set to whatever size you need (e.g., '10mb', '500kb')
    },
  },
};

export default nextConfig;
