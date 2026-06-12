import type { MetadataRoute } from "next";
import { fetchJobs } from "@/lib/jobs";
import { CITIES, citySlug } from "@/lib/locations";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/jobs", priority: 0.95, changeFrequency: "hourly" },
  { path: "/companies", priority: 0.9, changeFrequency: "daily" },
  { path: "/services", priority: 0.8, changeFrequency: "weekly" },
  { path: "/sectors", priority: 0.7, changeFrequency: "weekly" },
  { path: "/process", priority: 0.6, changeFrequency: "monthly" },
  { path: "/why-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/our-team", priority: 0.5, changeFrequency: "monthly" },
  { path: "/internship", priority: 0.6, changeFrequency: "weekly" },
  { path: "/faqs", priority: 0.5, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.6, changeFrequency: "monthly" },
  { path: "/login", priority: 0.4, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const base: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // "Jobs in <city>" SEO landing pages.
  const cityRoutes: MetadataRoute.Sitemap = CITIES.map((city) => ({
    url: `${SITE_URL}/jobs-in-${citySlug(city)}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Individual job pages — so Google can crawl and index each JobPosting.
  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const { jobs } = await fetchJobs();
    jobRoutes = jobs.map((job) => ({
      url: `${SITE_URL}/jobs/${job.id}`,
      lastModified: new Date(job.postedAt),
      changeFrequency: "daily",
      priority: 0.85,
    }));
  } catch {
    /* no jobs available at build time — static + city routes still ship */
  }

  return [...base, ...cityRoutes, ...jobRoutes];
}
