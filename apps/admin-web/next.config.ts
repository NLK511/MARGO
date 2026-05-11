import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@margo/core', '@margo/modules', '@margo/ui'],
};

export default nextConfig;
