/** @type {import('next').NextConfig} */
const nextConfig = {
  // Türkçe karakter ve SVG desteği
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig
