import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { fetchJobsPage } from "@/lib/jobs";
import JobsScreen from "@/screens/JobsScreen";

export const metadata: Metadata = buildMetadata({
  title: "Browse Jobs | Find Verified Jobs Across India | RecruitKr",
  description:
    "Browse verified job openings across India. Search jobs by role, location, salary, experience, and work mode. Apply online for free with RecruitKr.",
  path: "/jobs",
  keywords: [
    "jobs in India",
    "latest jobs",
    "job search",
    "find jobs online",
    "verified jobs",
    "remote jobs",
    "work from home jobs",
    "fresher jobs",
    "IT jobs",
    "full time jobs"
  ],
});
// Re-fetch the listing at most once a minute; pages render from cache in between.
export const revalidate = 60;

export default async function Page() {
  // Only the first page is server-rendered; the rest stream in via infinite
  // scroll on the client, so the initial payload stays small.
  const { jobs, hasMore, live } = await fetchJobsPage(1, 12);
  return <JobsScreen initialJobs={jobs} initialHasMore={live && hasMore} />;
}
