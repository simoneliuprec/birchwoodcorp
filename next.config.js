// next.config.js
const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    remotePatterns: [
      // Realtor.ca CDN (general)
      { protocol: 'https', hostname: 'realtor.ca' },
      // Add common subdomains for MLS photo sources:
      { protocol: 'https', hostname: 'ddfcdn.realtor.ca' }, // <—
      { protocol: 'https', hostname: 'cdn.realtor.ca' },
      { protocol: 'https', hostname: 'media.realtor.ca' },
      { protocol: 'https', hostname: 'ap.rdcpix.com' },
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