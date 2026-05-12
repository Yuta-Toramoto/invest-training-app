import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@invest-training/ui',
    '@invest-training/core',
    '@invest-training/types',
    '@invest-training/db',
  ],
};

export default nextConfig;
