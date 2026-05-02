/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid broken webpack vendor chunks for Supabase on the server (RSC / Route Handlers).
  serverExternalPackages: ['@supabase/supabase-js'],
  // Don't leak the Next.js version via the X-Powered-By header.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async headers() {
    // Baseline headers applied to every response (admin pages get stricter
    // headers in middleware.ts on top of these).
    const baseline = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
    ];

    return [
      {
        source: '/:path*',
        headers: baseline,
      },
    ];
  },
};

export default nextConfig;
