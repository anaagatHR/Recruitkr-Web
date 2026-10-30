import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { fetchAllJobs, fetchJobsPage, JOB_TYPES, JOBS_PAGE_SIZE, parseFilterList, WORK_MODES } from "@/lib/jobs";
import JobsScreen from "@/screens/JobsScreen";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SearchParams> | SearchParams };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const pageOf = (sp: SearchParams) => {
  const n = Number(one(sp.page));
  return Number.isInteger(n) && n > 1 ? n : 1;
};

const DESCRIPTION =
  "Browse verified job openings across India. Search jobs by role, location, salary, experience, and work mode. Apply online for free with RecruitKr.";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await Promise.resolve(searchParams);
  const page = pageOf(sp);
  // Filtered and searched views (?type=, ?mode=, ?search=) are not separate
  // pages: noindex them and point at /jobs. Only ?page=N self-canonicalises,
  // since each page lists a different set of jobs.
  const filtered = Object.keys(sp).some((key) => key !== "page");
  return buildMetadata({
    // No "| RecruitKr" here — the root layout's title template appends it.
    title: page > 1 ? `Browse Jobs – Page ${page}` : "Browse Jobs | Find Verified Jobs Across India",
    description: DESCRIPTION,
    path: !filtered && page > 1 ? `/jobs?page=${page}` : "/jobs",
    noindex: filtered,
    keywords: ["jobs in India", "latest jobs", "job search", "verified jobs", "remote jobs", "fresher jobs", "full time jobs"],
  });
}

export default async function Page({ searchParams }: Props) {
  const sp = await Promise.resolve(searchParams);
  const types = parseFilterList(one(sp.type), JOB_TYPES);
  const modes = parseFilterList(one(sp.mode), WORK_MODES);

  if (types.length || modes.length) {
    // Server-side so an empty filter is a real 404, not a 200 "no results"
    // page (Google's soft 404, e.g. /internship → /jobs?type=Internship).
    const { jobs, live } = await fetchAllJobs();
    const matches = jobs.filter(
      (job) => (!types.length || types.includes(job.type)) && (!modes.length || modes.includes(job.workMode)),
    );
    if (live && matches.length === 0) notFound();
    return <JobsScreen initialJobs={matches} initialHasMore={false} initialTotal={matches.length} />;
  }

  const page = pageOf(sp);
  const { jobs, hasMore, live, total } = await fetchJobsPage(page, JOBS_PAGE_SIZE);
  if (live && page > 1 && jobs.length === 0) notFound();
  return (
    <JobsScreen
      initialJobs={jobs}
      initialHasMore={live && hasMore}
      initialTotal={live ? total : jobs.length}
      initialPage={page}
      totalPages={live ? Math.max(1, Math.ceil(total / JOBS_PAGE_SIZE)) : 1}
    />
  );
}
