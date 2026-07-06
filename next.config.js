/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable future experimental features if needed
  experimental: {
    appDir: true,
  },
  // Add any custom env variables here
  env: {
    NEXT_PUBLIC_APP_NAME: 'Transworld Speed Test Pro',
  },
};

module.exports = nextConfig;