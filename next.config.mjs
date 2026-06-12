/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Don't block production builds on lint; we run lint separately.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // The original Vite build did not type-check; some legacy files rely on
    // loose typing. Keep editor type-checking but don't fail the build on
    // pre-existing type quirks. Run `tsc --noEmit` separately to audit.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "www.recruitkr.com" },
    ],
  },
  async rewrites() {
    // Allow same-origin /api/v1 calls to be proxied to the Express backend in dev.
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
    const root = backend.replace(/\/api\/v\d+\/?$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${root}/api/v1/:path*`,
      },
      {
        // Clean public URL for the city SEO landing pages.
        source: "/jobs-in-:city",
        destination: "/jobs/location/:city",
      },
    ];
  },
};

export default nextConfig;
