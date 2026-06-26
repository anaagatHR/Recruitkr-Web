/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework (reduces fingerprinting) and never ship
  // browser source maps in production (keeps original client source private).
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
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
    // Default to 127.0.0.1 (not "localhost"): on Windows "localhost" resolves to
    // IPv6 ::1 first, but the Express server listens on IPv4 only, which causes
    // intermittent "ECONNREFUSED ::1:5000" proxy failures.
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
    const root = backend.replace(/\/api\/v\d+\/?$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${root}/api/v1/:path*`,
      },
      {
        // Blog posts are served by the backend at the un-versioned /api/blogposts
        // mount (see backend app.js). Proxy them so the public blog renders.
        // The bare path (list endpoint, hit as /api/blogposts?published=true) is
        // matched explicitly so it proxies even though it has no trailing segment.
        source: "/api/blogposts",
        destination: `${root}/api/blogposts`,
      },
      {
        source: "/api/blogposts/:path*",
        destination: `${root}/api/blogposts/:path*`,
      },
      {
        // Team members are served at the un-versioned /api/team mount.
        source: "/api/team",
        destination: `${root}/api/team`,
      },
      {
        source: "/api/team/:path*",
        destination: `${root}/api/team/:path*`,
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
