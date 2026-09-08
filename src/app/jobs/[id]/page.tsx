import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { fetchJobResult } from "@/lib/jobs";
import { jobPostingJsonLd } from "@/lib/jobLd";
import JobDetailScreen from "@/screens/JobDetailScreen";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.recruitkr.com";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id || "";
  const canonicalUrl = `${SITE_URL}/jobs/${id}`;

  const { job } = await fetchJobResult(id);
  if (!job) {
    const baseMeta = buildMetadata({
      title: "Job",
      description: "View this job opening on RecruitKr.",
      path: `/jobs/${id}`,
      noindex: true,
    });

    return {
      ...baseMeta,
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const baseMeta = buildMetadata({
    title: `${job.title} at ${job.company}`,
    description: `${job.title} (${job.type}, ${job.workMode}) in ${job.location}. ${job.experience} experience. Apply now on RecruitKr.`,
    path: `/jobs/${id}`,
    keywords: [job.title, job.company, job.sector, ...job.skills],
  });

  return {
    ...baseMeta,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id || "";
  const { job, live } = await fetchJobResult(id);

  if (!job && live) notFound();

  return (
    <>
      {job && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)) }}
        />
      )}
      <JobDetailScreen initialJob={job} />
    </>
  );
}
