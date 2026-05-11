import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@margo/core', '@margo/themes', '@margo/ui'],
};

export default nextConfig;
