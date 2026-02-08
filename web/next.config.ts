import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['shared'],
    // Explicitly configure to use webpack for builds (Turbopack not needed in production)
  turbopack: {},
   // Disable Turbopack to avoid OneDrive sync issues
  webpack: (config) => {
    return config;
  },
    async rewrites() {
    // Only use rewrites in production (when deployed to Vercel)
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/api/:path*',
          destination: 'https://api.bbsynr.com/api/:path*',
        },
      ];
    }
    // In development, no rewrites needed (direct to localhost:3001)
    return [];
  },
};

export default nextConfig;

