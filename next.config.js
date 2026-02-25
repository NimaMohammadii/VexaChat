const r2Endpoint = process.env.R2_ENDPOINT;

let r2Pattern = null;

if (r2Endpoint) {
  try {
    const { protocol, hostname } = new URL(r2Endpoint);

    if (hostname) {
      r2Pattern = {
        protocol: protocol.replace(":", "") || "https",
        hostname,
        pathname: '/**',
      };
    }
  } catch {
    // Ignore invalid R2_ENDPOINT values and continue without an R2 pattern.
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
      ...(r2Pattern ? [r2Pattern] : []),
    ],
  },
};

module.exports = nextConfig;
