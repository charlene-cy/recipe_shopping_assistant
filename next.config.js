/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'img08.weeecdn.net', 'imgproxy.icook.network'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img08.weeecdn.net',
      },
      {
        protocol: 'https',
        hostname: 'imgproxy.icook.network',
      },
    ],
  },
}

module.exports = nextConfig
