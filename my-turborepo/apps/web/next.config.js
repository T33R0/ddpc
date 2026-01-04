/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  transpilePackages: ["@repo/assets"],
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // Disable static optimization for pages that use authentication
  generateBuildId: async () => {
    return 'build-cache-invalidation-' + Date.now()
  },
  async redirects() {
    return [
      {
        source: '/careers',
        destination: '/join',
        permanent: true,
      },
    ];
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
      // Common image hosting domains
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
      },
      {
        protocol: 'https',
        hostname: 'imgbb.com',
      },
      {
        protocol: 'https',
        hostname: 'ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'imagebam.com',
      },
      {
        protocol: 'https',
        hostname: 'imageshack.com',
      },
      {
        protocol: 'https',
        hostname: 'photobucket.com',
      },
      {
        protocol: 'https',
        hostname: 'flickr.com',
      },
      {
        protocol: 'https',
        hostname: 'staticflickr.com',
      },
      {
        protocol: 'https',
        hostname: 'pinterest.com',
      },
      {
        protocol: 'https',
        hostname: 'pinimg.com',
      },
      // Allow localhost for development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  ...nextConfig,
};

export default withPWA(config);
