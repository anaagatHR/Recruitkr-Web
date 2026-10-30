import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/reset-password",
        "/forgot-password",
        "/api/",
      ],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/jobs-sitemap.xml`],
    host: SITE_URL,
  };
}