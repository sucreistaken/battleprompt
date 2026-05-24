/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  }
};

module.exports = nextConfig;
