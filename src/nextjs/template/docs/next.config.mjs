/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid `transpilePackages: ['cms-renderer']` with Turbopack — it re-bundles `dist/`
  // and breaks `serverExternalPackages` for `md4w`. cms-renderer ships compiled ESM.
  serverExternalPackages: ['md4w'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms-profound.b-cdn.net',
      },
    ],
  },
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
