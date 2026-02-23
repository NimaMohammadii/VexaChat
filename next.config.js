const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

let supabaseStoragePattern = null;

if (supabaseUrl) {
  try {
    const { hostname } = new URL(supabaseUrl);

    if (hostname) {
      supabaseStoragePattern = {
        protocol: 'https',
        hostname,
        pathname: '/storage/v1/object/public/**',
      };
    }
  } catch {
    // Ignore invalid NEXT_PUBLIC_SUPABASE_URL values and continue without Supabase pattern.
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      ...(supabaseStoragePattern ? [supabaseStoragePattern] : []),
    ],
  },
};

module.exports = nextConfig;
