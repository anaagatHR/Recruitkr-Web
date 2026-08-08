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
    // The Services and Sectors pages were removed. Permanent redirects keep
    // previously indexed / bookmarked URLs from 404ing.
    //
    // They target /home rather than /: `/` now forwards to the job board, so
    // sending them there would chain two redirects and land a visitor looking
    // for a services page on a list of vacancies.
    return [
      // The site opens on the job board. This has to be a routing-layer
      // redirect, not `redirect("/jobs")` in a `/` page component: a
      // statically prerendered App Router page that calls redirect() builds an
      // artifact with `status: 307` but no `location` header, so a hard GET of
      // `/` returned a 307 that pointed nowhere and browsers rendered the
      // __next_error__ body instead of navigating. The marketing home page it
      // used to render lives at /home.
      //
      // Temporary (307), not permanent (308), on purpose: browsers and CDNs
      // cache a 308 indefinitely, so a visitor who loaded `/` once could never
      // see a different `/` again without clearing their cache. Flip
      // `permanent` to true only once this is settled.
      { source: "/", destination: "/jobs", permanent: false },
      // The intern portal was removed; /internship and the CRM's /intern-login
      // entry point were indexed and bookmarked, so they redirect rather than
      // 404. Internship *jobs* still exist — they're a type on the board.
      { source: "/internship", destination: "/jobs?type=Internship", permanent: true },
      { source: "/intern-login", destination: "/login", permanent: true },
      { source: "/services", destination: "/home", permanent: true },
      { source: "/services/:id", destination: "/home", permanent: true },
      { source: "/sectors", destination: "/home", permanent: true },
    ];
  },
  async rewrites() {
    // Allow same-origin /api/v1 calls to be proxied to the Express backend in dev.
    // Default to 127.0.0.1 (not "localhost"): on Windows "localhost" resolves to
    // IPv6 ::1 first, but the Express server listens on IPv4 only, which causes
    // intermittent "ECONNREFUSED ::1:5000" proxy failures.
    const backend = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
    const root = backend.replace(/\/api\/v\d+\/?$/, "");
    // Blog images authored in the CRM are stored as relative /uploads/... paths
    // and served by the CRM app (not this frontend or the API backend). Default
    // to the local CRM on :8080; set NEXT_PUBLIC_CRM_URL to the CRM's public URL
    // in production so the live blog can load those images.
    const crmAssetBase = (process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:8080").replace(/\/$/, "");
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
        // Blog cover/content images are stored as relative /uploads/... paths
        // served by the CRM. Proxy them so the public blog renders the images
        // instead of 404ing against this app's own origin.
        source: "/uploads/:path*",
        destination: `${crmAssetBase}/uploads/:path*`,
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
