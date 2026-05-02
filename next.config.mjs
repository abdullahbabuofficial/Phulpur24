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
    // Baseline Content-Security-Policy. Permissive enough that Next.js's
    // inline hydration scripts and Tailwind's inline critical CSS still work,
    // but explicit about which third-party origins the app is allowed to
    // talk to. `frame-ancestors 'none'` prevents the entire site from being
    // iframed (defends against clickjacking on top of X-Frame-Options).
    //
    // Migrate `'unsafe-inline'` -> a per-request nonce later if you want a
    // truly strict CSP; doing so requires emitting the nonce from middleware
    // and threading it through Next's <Script> nonce prop.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data: blob: https://images.unsplash.com https://*.supabase.co https://*.googleusercontent.com https://*.googlesyndication.com https://*.doubleclick.net",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://*.googletagservices.com https://*.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://*.google-analytics.com https://*.googlesyndication.com",
      "frame-src 'self' https://googleads.g.doubleclick.net https://*.youtube.com https://www.google.com",
      "media-src 'self' blob: https://*.supabase.co",
      "manifest-src 'self'",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; ');

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
      { key: 'Content-Security-Policy', value: csp },
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
