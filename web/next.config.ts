import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['shared'],
    // Explicitly configure to use webpack for builds (Turbopack not needed in production)
  turbopack: {},
   // Disable Turbopack to avoid OneDrive sync issues
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;

