import type { NextConfig } from 'next';
import { execSync } from 'child_process';

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '0.4.0',
    NEXT_PUBLIC_GIT_COMMIT: (() => {
      try {
        return execSync('git rev-parse --short HEAD').toString().trim();
      } catch {
        return 'unknown';
      }
    })(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
