import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    } as any,
  },
};

export default nextConfig;