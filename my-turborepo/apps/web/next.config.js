/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/assets"],
  // Disable static optimization for pages that use authentication
  generateBuildId: async () => {
    return 'build-cache-invalidation-' + Date.now()
  },
};

const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'media.ed.edmunds-media.com',
      },
      {
        protocol: 'https',
        hostname: 'www.edmunds.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.edmundsapps.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'commons.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Allow localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  ...nextConfig,
};

export default config;
