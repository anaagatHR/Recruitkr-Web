import type { MetadataRoute } from "next";
import { fetchJobs } from "@/lib/jobs";
import { fetchBlogPosts } from "@/lib/blog";
import { CITIES, citySlug } from "@/lib/locations";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/jobs", priority: 0.95, changeFrequency: "hourly" },
  { path: "/services", priority: 0.8, changeFrequency: "weekly" },
  { path: "/sectors", priority: 0.7, changeFrequency: "weekly" },
  { path: "/process", priority: 0.6, changeFrequency: "monthly" },
  { path: "/why-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/goal", priority: 0.6, changeFrequency: "monthly" },
  { path: "/success-stories", priority: 0.7, changeFrequency: "weekly" },
  { path: "/our-team", priority: 0.5, changeFrequency: "monthly" },
  { path: "/internship", priority: 0.6, changeFrequency: "weekly" },
  { path: "/faqs", priority: 0.5, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
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

  // Individual blog posts — so each article gets crawled and indexed.
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchBlogPosts();
    blogRoutes = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt || now),
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    /* no blog posts available at build time — the rest of the sitemap ships */
  }

  return [...base, ...cityRoutes, ...jobRoutes, ...blogRoutes];
}
