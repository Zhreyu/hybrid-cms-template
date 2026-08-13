/** @type {import('next').NextConfig} */
const nextConfig = {
  // md4w resolves its WASM asset relative to its installed package path on the server.
  serverExternalPackages: ['md4w'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.tryprofound.com https://*.vercel.app",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
