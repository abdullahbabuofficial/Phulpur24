/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid broken webpack vendor chunks for Supabase on the server (RSC / Route Handlers).
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
