/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['cms-renderer'],
  // md4w resolves its WASM asset relative to its installed package path.
  serverExternalPackages: ['md4w'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms-profound.b-cdn.net',
      },
    ],
  },
};

export default nextConfig;
