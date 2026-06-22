import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  // Workspace packages ship raw TS source with NodeNext '.js' import specifiers.
  transpilePackages: [
    '@mawsim/core',
    '@mawsim/db',
    '@mawsim/marketplace',
    '@mawsim/pricing',
    '@mawsim/logistics',
    '@mawsim/payments',
    '@mawsim/verification',
    '@mawsim/notifications',
  ],
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub.mawsim.ma',
      },
    ],
  },
  webpack: (config) => {
    // Resolve NodeNext '.js' specifiers (e.g. './money.js') to their '.ts' source.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
