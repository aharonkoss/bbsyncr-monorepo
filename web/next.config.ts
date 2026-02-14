import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  staticPageGenerationTimeout: 180,
  transpilePackages: ['shared'],
};

export default nextConfig;
