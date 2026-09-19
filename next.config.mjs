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
    // AVIF first, WebP as the fallback. Next only emits WebP by default; AVIF
    // is meaningfully smaller for the logo/photographic assets and every
    // browser that matters now decodes it.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "ik.imagekit.io" },
      { protocol: "https", hostname: "www.recruitkr.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/internship", destination: "/jobs?type=Internship", permanent: true },
      { source: "/register/candidate", destination: "/signup", permanent: true },
      { source: "/intern-login", destination: "/login", permanent: true },
      { source: "/services", destination: "/home", permanent: true },
      { source: "/services/:id", destination: "/home", permanent: true },
      { source: "/sectors", destination: "/home", permanent: true },

      // --- 404 Dead Job Postings Redirect to Jobs Board ---
      { source: "/jobs/6a45f9efafb720ea6a4f5484", destination: "/jobs", permanent: true },
      { source: "/jobs/6a45f9efafb720ea6a4f52e9", destination: "/jobs", permanent: true },
      { source: "/jobs/6a45f9efafb720ea6a4f5373", destination: "/jobs", permanent: true },
      { source: "/jobs/6a45f9f1afb720ea6a4f58ce", destination: "/jobs", permanent: true },
      { source: "/jobs/6a45f9efafb720ea6a4f5186", destination: "/jobs", permanent: true },
    ];
  },
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
    const root = backend.replace(/\/api\/v\d+\/?$/, "");
    const crmAssetBase = (process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:8080").replace(/\/$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${root}/api/v1/:path*`,
      },
      {
        source: "/api/blogposts",
        destination: `${root}/api/blogposts`,
      },
      {
        source: "/api/blogposts/:path*",
        destination: `${root}/api/blogposts/:path*`,
      },
      {
        source: "/api/team",
        destination: `${root}/api/team`,
      },
      {
        source: "/api/team/:path*",
        destination: `${root}/api/team/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${crmAssetBase}/uploads/:path*`,
      },
      {
        source: "/jobs-in-:city",
        destination: "/jobs/location/:city",
      },
    ];
  },
};

export default nextConfig;
