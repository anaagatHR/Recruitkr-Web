import type { Metadata } from "next";
import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import {
  displayCompany,
  fetchAllJobs,
  fetchJobResult,
  formatExperience,
  isIndexableJob,
  jobIdFromParam,
  jobPath,
  jobSlug,
  PLACEHOLDER_LOCATION,
  relatedJobs,
} from "@/lib/jobs";
import { jobPostingJsonLd } from "@/lib/jobLd";
import JobDetailScreen from "@/screens/JobDetailScreen";

export const revalidate = 600;

type Props = { params: Promise<{ id: string }> | { id: string } };

const paramOf = async (params: Props["params"]) => (await Promise.resolve(params))?.id || "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const param = await paramOf(params);
  const { job } = await fetchJobResult(jobIdFromParam(param));
  if (!job) {
    return buildMetadata({
      title: "Job",
      description: "View this job opening on RecruitKr.",
      path: `/jobs/${param}`,
      noindex: true,
    });
  }

  // Title template: "{title} – {company | Confidential} | Jobs in {city}".
  const company = displayCompany(job);
  const city = job.location && job.location !== PLACEHOLDER_LOCATION ? job.location : "India";
  const experience = formatExperience(job.experience);
  return buildMetadata({
    title: `${job.title} – ${company} | Jobs in ${city}`,
    description: `${job.title} (${job.type}, ${job.workMode}) in ${city}.${experience ? ` ${experience}.` : ""} Apply now on RecruitKr.`,
    path: jobPath(job),
    keywords: [job.title, ...(job.company ? [job.company] : []), job.sector, ...job.skills],
    // Closed listings, and postings with neither a description nor enough real
    // detail, stay reachable (and crawlable) but out of the index;
    // jobs-sitemap.xml applies the same rule.
    noindex: !isIndexableJob(job),
  });
}

/** The whole board, once per request, for related roles. */
const loadAllJobs = cache(() => fetchAllJobs().catch(() => ({ jobs: [], live: false })));

export default async function Page({ params }: Props) {
  const param = await paramOf(params);
  const { job, live } = await fetchJobResult(jobIdFromParam(param));

  if (!job && live) notFound();
  // Old /jobs/<objectid> URLs (and slugs from a since-renamed title) move
  // permanently to the readable slug, so links Google already found keep
  // their history. Only on a live answer: seed fallback data has no real URL.
  if (job && live && param !== jobSlug(job)) permanentRedirect(jobPath(job));

  const related = job && live ? relatedJobs(job, (await loadAllJobs()).jobs) : [];

  return (
    <>
      {job && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)) }}
        />
      )}
      <JobDetailScreen initialJob={job} related={related} />
    </>
  );
}
