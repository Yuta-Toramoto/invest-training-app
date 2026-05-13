import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@invest-training/ui',
    '@invest-training/core',
    '@invest-training/types',
    '@invest-training/db',
  ],
};

export default withSentryConfig(nextConfig, {
  org: process.env['SENTRY_ORG'],
  project: process.env['SENTRY_PROJECT'],
  silent: true,
  telemetry: false,
});
