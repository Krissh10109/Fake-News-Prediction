/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  typescript: {
    // Skip type checking during build (handled by IDE)
    ignoreBuildErrors: true,
  },

  eslint: {
    // Skip ESLint during build
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
  },

  // Environment variables available at build time
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  },
}

export default nextConfig
