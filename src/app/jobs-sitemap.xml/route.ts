import { NextResponse } from "next/server";
import { fetchAllJobs, isIndexableJob, jobPath } from "@/lib/jobs";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

// It used to be a hard-coded list of 66 ObjectIds that went stale as jobs
// closed; it now lists exactly the live, indexable job pages at their
// canonical slug URLs. Rendered per request (the CDN caches it for an hour via
// Cache-Control) so a backend outage during a build can't bake in a 503.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const xmlEscape = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function GET() {
  const { jobs, live } = await fetchAllJobs().catch(() => ({ jobs: [], live: false }));

  // Backend unreachable: say "try later" instead of serving an empty sitemap,
  // which Google would read as every job having been removed.
  if (!live) {
    return new NextResponse("Job listings temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "3600" },
    });
  }

  // Only pages that render `index`: open jobs with a real description.
  const urls = jobs
    .filter(isIndexableJob)
    .map((job) => {
      const lastmod = new Date(job.postedAt);
      return `  <url>
    <loc>${xmlEscape(`${SITE_URL}${jobPath(job)}`)}</loc>${
      Number.isNaN(lastmod.getTime()) ? "" : `\n    <lastmod>${lastmod.toISOString()}</lastmod>`
    }
  </url>`;
    })
    .join("\n");

  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`,
    {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
