/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ["*"] } },
  eslint: { ignoreDuringBuilds: true },
  // Build-based dev workflow: use static export for reliability
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};
export default nextConfig;

