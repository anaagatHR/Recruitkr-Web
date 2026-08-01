import type { MetadataRoute } from "next";
import { fetchAllJobs } from "@/lib/jobs";
import { fetchBlogPosts } from "@/lib/blog";
import { CITIES, citySlug } from "@/lib/locations";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

/**
 * Rebuild the sitemap an hour after it is first requested, then again an hour
 * after that, for as long as crawlers keep asking for it.
 *
 * Without this, Next renders /sitemap.xml once at build time and serves that
 * same file forever — a job posted after a deploy would stay out of the sitemap
 * until the next deploy. An hour is well inside Google's recrawl cadence and
 * costs at most 24 job-list fetches a day.
 */
export const revalidate = 3600;

const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  // `/` is deliberately absent: it 307s to /jobs, and listing a redirecting
  // URL in a sitemap just makes crawlers follow a hop to reach the page below.
  { path: "/jobs", priority: 1.0, changeFrequency: "hourly" },
  { path: "/home", priority: 0.9, changeFrequency: "weekly" },
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

/**
 * A `<lastmod>` Next can serialise, or null.
 *
 * `new Date(undefined)` and `new Date("")` produce an Invalid Date, and calling
 * `.toISOString()` on one throws while the sitemap is being written — one job
 * row with a missing timestamp would take the whole file down.
 */
function safeDate(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

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
  // Every live listing, paged, not just the first 50: a job that never makes
  // the sitemap is a job Google may never find.
  let jobRoutes: MetadataRoute.Sitemap = [];
  try {
    const { jobs, live } = await fetchAllJobs();
    // `live: false` means the API was unreachable and these are the fictional
    // seed listings. Publishing /jobs/j1…j8 would hand Google eight URLs that
    // 404 in production — worse than shipping no job URLs at all.
    if (live) {
      jobRoutes = jobs.map((job) => ({
        url: `${SITE_URL}/jobs/${job.id}`,
        lastModified: safeDate(job.postedAt) ?? now,
        changeFrequency: "daily",
        priority: 0.85,
      }));
    }
  } catch {
    /* no jobs available at build time — static + city routes still ship */
  }

  // Individual blog posts — so each article gets crawled and indexed.
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const posts = await fetchBlogPosts();
    blogRoutes = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: safeDate(post.updatedAt) ?? safeDate(post.publishedAt) ?? now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
  } catch {
    /* no blog posts available at build time — the rest of the sitemap ships */
  }

  return [...base, ...cityRoutes, ...jobRoutes, ...blogRoutes];
}
