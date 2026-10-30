// Where the browser is allowed to talk. Kept explicit so a new third party is
// a deliberate one-line change here, not something that silently works.
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1").origin;
  } catch {
    return "";
  }
})();
const CRM_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_CRM_URL || "http://localhost:8080").origin;
  } catch {
    return "";
  }
})();
const wsOrigin = (origin) => origin.replace(/^http/, "ws");

/**
 * Content-Security-Policy. 'unsafe-inline' for scripts is required by Next's
 * own bootstrap scripts and the JSON-LD blocks without a nonce pipeline;
 * everything else is a named origin. frame-ancestors 'none' is the modern
 * X-Frame-Options: DENY. No 'unsafe-eval' in production.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  `connect-src 'self' ${API_ORIGIN} ${API_ORIGIN ? wsOrigin(API_ORIGIN) : ""} ${CRM_ORIGIN} https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://upload.imagekit.io https://challenges.cloudflare.com`,
  "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
]
  .map((directive) => directive.replace(/\s+/g, " ").trim())
  .join("; ");

const securityHeaders = [
  // Two years, subdomains, preload-list eligible.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

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
  async headers() {
    return [
      {
        // Every route, including the proxied /api/v1 rewrites.
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Static assets are content-addressed; cache them for a year.
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    // statusCode 301 rather than `permanent: true` (308): same meaning to
    // Google, but 301 is what Search Console and most SEO tools expect to see.
    // Every destination is a final 200 page, so no chain is longer than one hop.
    // Expired jobs are deliberately NOT redirected to /jobs: Google treats that
    // as a soft 404, and a plain 404 is the honest answer for a closed listing.
    return [
      { source: "/home", destination: "/", statusCode: 301 },
      { source: "/internship", destination: "/jobs?type=Internship", statusCode: 301 },
      { source: "/register/candidate", destination: "/signup", statusCode: 301 },
      { source: "/register/client", destination: "/signup/employer", statusCode: 301 },
      { source: "/intern-login", destination: "/login", statusCode: 301 },
      // /jobs-in-<city> is the canonical city URL (rewritten below to this route).
      { source: "/jobs/location/:city", destination: "/jobs-in-:city", statusCode: 301 },
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
