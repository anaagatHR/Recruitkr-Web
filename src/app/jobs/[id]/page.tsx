import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { fetchJob } from "@/lib/jobs";
import { jobPostingJsonLd } from "@/lib/jobLd";
import JobDetailScreen from "@/screens/JobDetailScreen";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const job = await fetchJob(params.id);
  if (!job) {
    return buildMetadata({ title: "Job", description: "View this job opening on RecruitKr.", path: `/jobs/${params.id}` });
  }
  return buildMetadata({
    title: `${job.title} at ${job.company}`,
    description: `${job.title} (${job.type}, ${job.workMode}) in ${job.location}. ${job.experience} experience. Apply now on RecruitKr.`,
    path: `/jobs/${params.id}`,
    keywords: [job.title, job.company, job.sector, ...job.skills],
  });
}

export default async function Page({ params }: { params: { id: string } }) {
  const job = await fetchJob(params.id);
  return (
    <>
      {job && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)) }}
        />
      )}
      <JobDetailScreen />
    </>
  );
}
