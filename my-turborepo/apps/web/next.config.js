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
    ],
  },
  ...nextConfig,
};

export default config;
