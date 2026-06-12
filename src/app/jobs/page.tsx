import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { fetchJobs } from "@/lib/jobs";
import JobsScreen from "@/screens/JobsScreen";

export const metadata: Metadata = buildMetadata({
  title: "Browse Jobs",
  description:
    "Search and filter thousands of verified jobs across India by role, location, salary and work mode. Apply free on RecruitKr.",
  path: "/jobs",
  keywords: ["jobs in India", "latest jobs", "apply jobs online", "remote jobs", "fresher jobs"],
});

// Re-fetch the listing at most once a minute; pages render from cache in between.
export const revalidate = 60;

export default async function Page() {
  const { jobs } = await fetchJobs();
  return <JobsScreen initialJobs={jobs} />;
}
