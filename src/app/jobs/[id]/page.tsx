import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { fetchJobResult } from "@/lib/jobs";
import { jobPostingJsonLd } from "@/lib/jobLd";
import JobDetailScreen from "@/screens/JobDetailScreen";

/**
 * Re-fetch a job at most every 10 minutes; crawler hits in between are served
 * from cache. Job rows change rarely once posted, and Googlebot requesting a
 * few thousand job URLs should not mean a few thousand backend round-trips.
 */
export const revalidate = 600;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { job } = await fetchJobResult(params.id);
  if (!job) {
    // Reached only while the backend is unreachable (a genuine miss 404s in the
    // page below). Mark it noindex so an outage can't get an empty shell
    // indexed as a thin page under a real job URL.
    return buildMetadata({
      title: "Job",
      description: "View this job opening on RecruitKr.",
      path: `/jobs/${params.id}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: `${job.title} at ${job.company}`,
    description: `${job.title} (${job.type}, ${job.workMode}) in ${job.location}. ${job.experience} experience. Apply now on RecruitKr.`,
    path: `/jobs/${params.id}`,
    keywords: [job.title, job.company, job.sector, ...job.skills],
  });
}

export default async function Page({ params }: { params: { id: string } }) {
  const { job, live } = await fetchJobResult(params.id);

  // The backend answered and has no such job: return a real 404 so Google drops
  // the URL instead of recording a 200-with-no-content soft 404.
  if (!job && live) notFound();

  return (
    <>
      {job && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)) }}
        />
      )}
      {/* `initialJob` puts the title, description, salary and skills in the
          server HTML. Without it the page shipped a loading skeleton and filled
          in on the client, so Google saw JobPosting structured data with no
          matching visible content — which Google Jobs rejects. */}
      <JobDetailScreen initialJob={job} />
    </>
  );
}
