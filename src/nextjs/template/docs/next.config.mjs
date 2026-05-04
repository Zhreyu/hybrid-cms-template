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
};

export default nextConfig;
