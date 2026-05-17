import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@margo/core', '@margo/modules', '@margo/ui'],
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
