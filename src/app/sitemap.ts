import type { MetadataRoute } from "next";
import { fetchAllJobs, type Job } from "@/lib/jobs";
import { fetchBlogPosts } from "@/lib/blog";
import { CITIES, citySlug, matchCity } from "@/lib/locations";

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

/**
 * Building the sitemap means paging the whole job board plus the blog, so it is
 * far slower than a normal page render. Vercel's default function timeout (10s)
 * is within reach once the board holds a few thousand listings, and a timeout
 * here serves Google a broken sitemap rather than a short one.
 */
export const maxDuration = 60;

const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  // `/` is deliberately absent: it 307s to /jobs, and listing a redirecting
  // URL in a sitemap just makes crawlers follow a hop to reach the page below.
  { path: "/jobs", priority: 1.0, changeFrequency: "hourly" },
  { path: "/home", priority: 0.9, changeFrequency: "weekly" },
  { path: "/candidates", priority: 0.8, changeFrequency: "monthly" },
  { path: "/employers", priority: 0.8, changeFrequency: "monthly" },
  { path: "/process", priority: 0.6, changeFrequency: "monthly" },
  { path: "/why-us", priority: 0.6, changeFrequency: "monthly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/goal", priority: 0.6, changeFrequency: "monthly" },
  { path: "/success-stories", priority: 0.7, changeFrequency: "weekly" },
  { path: "/training", priority: 0.6, changeFrequency: "monthly" },
  { path: "/assessment", priority: 0.6, changeFrequency: "monthly" },
  { path: "/partners", priority: 0.5, changeFrequency: "monthly" },
  { path: "/our-team", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faqs", priority: 0.5, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
];

/**
 * Pages whose `<lastmod>` is a real, derived timestamp rather than "whenever
 * this sitemap happened to be regenerated". Everything not listed here ships
 * without a `<lastmod>` at all — see below.
 */
const DERIVED_LASTMOD: Record<string, "jobs" | "blog"> = {
  "/jobs": "jobs",
  "/blog": "blog",
};

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

/** The most recent of a set of possibly-missing dates, or null if there are none. */
function newest(dates: Array<Date | null>): Date | null {
  let best: Date | null = null;
  for (const date of dates) {
    if (date && (!best || date > best)) best = date;
  }
  return best;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Individual job pages — so Google can crawl and index each JobPosting.
  // Every live listing, paged, not just the first 50: a job that never makes
  // the sitemap is a job Google may never find.
  let jobRoutes: MetadataRoute.Sitemap = [];
  let liveJobs: Job[] | null = null;
  let jobsLastMod: Date | null = null;
  try {
    const { jobs, live } = await fetchAllJobs();
    // `live: false` means the API was unreachable and these are the fictional
    // seed listings. Publishing /jobs/j1…j8 would hand Google eight URLs that
    // 404 in production — worse than shipping no job URLs at all.
    if (live) {
      liveJobs = jobs;
      jobRoutes = jobs.map((job) => ({
        url: `${SITE_URL}/jobs/${job.id}`,
        // No `?? now` fallback: a job row with an unparseable timestamp ships
        // without a <lastmod> (which is optional) rather than claiming it
        // changed this minute. See the note on the static routes below.
        lastModified: safeDate(job.postedAt) ?? undefined,
        changeFrequency: "daily",
        priority: 0.85,
      }));
      jobsLastMod = newest(jobs.map((job) => safeDate(job.postedAt)));
    }
  } catch {
    /* no jobs available at build time — static + city routes still ship */
  }

  /**
   * "Jobs in <city>" SEO landing pages — but only the ones that actually have
   * openings. Jobs are currently posted in Jaipur only, so the other eleven
   * cities render an identical empty shell; submitting them asks Google to
   * index eleven doorway pages, which costs more in site-wide quality signals
   * than the pages could ever return. They stay out of the sitemap (and carry
   * `noindex`) until a job exists there.
   *
   * When the job list is unavailable we fall back to publishing every city, so
   * a backend outage cannot quietly empty this section of the sitemap.
   */
  const cityRoutes: MetadataRoute.Sitemap = CITIES.filter(
    (city) => !liveJobs || matchCity(liveJobs, city).length > 0,
  ).map((city) => ({
    url: `${SITE_URL}/jobs-in-${citySlug(city)}`,
    // The page is a filtered view of the board, so it last changed when its
    // newest matching job was posted.
    lastModified: liveJobs
      ? newest(matchCity(liveJobs, city).map((job) => safeDate(job.postedAt))) ?? undefined
      : undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // Individual blog posts — so each article gets crawled and indexed.
  let blogRoutes: MetadataRoute.Sitemap = [];
  let blogLastMod: Date | null = null;
  try {
    const posts = await fetchBlogPosts();
    blogRoutes = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: safeDate(post.updatedAt) ?? safeDate(post.publishedAt) ?? undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    blogLastMod = newest(
      posts.map((post) => safeDate(post.updatedAt) ?? safeDate(post.publishedAt)),
    );
  } catch {
    /* no blog posts available at build time — the rest of the sitemap ships */
  }

  /**
   * `<lastmod>` on the fixed pages.
   *
   * The index and blog index are derived from the freshest thing they list, so
   * they update on their own as jobs and posts come in. The evergreen marketing
   * pages get no `<lastmod>` at all — the tag is optional, and stamping every
   * page with the current time (which is what a regenerating sitemap does if you
   * write `new Date()`) tells Google the whole site changes hourly. Google
   * ignores a `<lastmod>` it catches lying, so the honest signal on /jobs is
   * worth more than a fake one on twelve static pages.
   */
  const derived = { jobs: jobsLastMod, blog: blogLastMod };

  const base: MetadataRoute.Sitemap = staticRoutes.map((route) => {
    const source = DERIVED_LASTMOD[route.path];
    return {
      url: `${SITE_URL}${route.path}`,
      lastModified: (source ? derived[source] : null) ?? undefined,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };
  });

  return [...base, ...cityRoutes, ...jobRoutes, ...blogRoutes];
}
