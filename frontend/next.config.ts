import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/python/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // Set to whatever size you need (e.g., '10mb', '500kb')
    },
  },
};

export default nextConfig;
