/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Don't fail production builds on ESLint formatting/unused var warnings
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
