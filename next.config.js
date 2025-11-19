// next.config.js
const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    remotePatterns: [
      // Realtor.ca CDN (general)
      { protocol: 'https', hostname: 'realtor.ca', pathname: '/**' },
      // Add common subdomains for MLS photo sources:
      { protocol: 'https', hostname: 'ddfcdn.realtor.ca', pathname: '/**' }, // <—
      { protocol: 'https', hostname: 'cdn.realtor.ca', pathname: '/**' },
    ],
  },
  // Optional: helpful dev settings
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

module.exports = nextConfig;