import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['shared'],
   // Disable Turbopack to avoid OneDrive sync issues
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;

