import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import {
  fetchAllJobs,
  fetchJobsPage,
  isOpen,
  JOB_TYPES,
  JOBS_PAGE_SIZE,
  parseFilterList,
  WORK_MODES,
  type Job,
} from "@/lib/jobs";
import { CITIES, cityHeading, cityPath, matchCity } from "@/lib/locations";
import JobsScreen from "@/screens/JobsScreen";
import EmptyJobFilter from "@/screens/EmptyJobFilter";

type SearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams: Promise<SearchParams> | SearchParams };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const pageOf = (sp: SearchParams) => {
  const n = Number(one(sp.page));
  return Number.isInteger(n) && n > 1 ? n : 1;
};

/** The ?type= / ?mode= filter in canonical form, or null when there is none. */
const filterOf = (sp: SearchParams) => {
  const types = parseFilterList(one(sp.type), JOB_TYPES);
  const modes = parseFilterList(one(sp.mode), WORK_MODES);
  if (!types.length && !modes.length) return null;
  const query = [types.length ? `type=${types.join(",")}` : "", modes.length ? `mode=${modes.join(",")}` : ""]
    .filter(Boolean)
    .join("&");
  return { types, modes, path: `/jobs?${query}`, label: [...types, ...modes].join(" · ") };
};

const matches = (job: Job, types: string[], modes: string[]) =>
  (!types.length || types.includes(job.type)) && (!modes.length || modes.includes(job.workMode));

/** All open jobs, once per request (metadata and page both need them). */
const loadOpenJobs = cache(async () => {
  const { jobs, live } = await fetchAllJobs();
  return { jobs: live ? jobs.filter(isOpen) : jobs, live };
});

const DESCRIPTION =
  "Browse verified job openings across India. Search jobs by role, location, salary, experience, and work mode. Apply online for free with RecruitKr.";
const KEYWORDS = ["jobs in India", "latest jobs", "job search", "verified jobs", "remote jobs", "fresher jobs", "full time jobs"];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await Promise.resolve(searchParams);
  const filter = filterOf(sp);
  const extraParams = Object.keys(sp).some((key) => !["type", "mode", "page"].includes(key));

  if (filter && !extraParams) {
    // A filter is its own listing: indexable while it has openings, and
    // `noindex, follow` while empty — so it flips automatically as jobs arrive.
    const { jobs, live } = await loadOpenJobs();
    const count = jobs.filter((job) => matches(job, filter.types, filter.modes)).length;
    return buildMetadata({
      title: `${filter.label} Jobs`,
      description: `${filter.label} job openings on RecruitKr. Apply free with verified employers across India.`,
      path: filter.path,
      noindex: !live || count === 0,
    });
  }

  const page = pageOf(sp);
  // Searches (?search=) and unrecognised params are not separate pages:
  // noindex them and point at /jobs. ?page=N self-canonicalises.
  const other = Boolean(filter) || extraParams;
  return buildMetadata({
    // No "| RecruitKr" here — the root layout's title template appends it.
    title: page > 1 ? `Browse Jobs – Page ${page}` : "Browse Jobs | Find Verified Jobs Across India",
    description: DESCRIPTION,
    path: !other && page > 1 ? `/jobs?page=${page}` : "/jobs",
    noindex: other,
    keywords: KEYWORDS,
  });
}

export default async function Page({ searchParams }: Props) {
  const sp = await Promise.resolve(searchParams);
  const filter = filterOf(sp);

  if (filter) {
    const { jobs, live } = await loadOpenJobs();
    const found = jobs.filter((job) => matches(job, filter.types, filter.modes));
    if (found.length || !live) {
      return <JobsScreen initialJobs={found} initialHasMore={false} initialTotal={found.length} />;
    }
    // Empty filter: 200 with a real empty state (the homepage links here).
    const count = (types: string[], modes: string[]) => jobs.filter((job) => matches(job, types, modes)).length;
    const filters = [
      ...JOB_TYPES.map((t) => ({ label: t, href: `/jobs?type=${t}`, count: count([t], []) })),
      ...WORK_MODES.map((m) => ({ label: m, href: `/jobs?mode=${m}`, count: count([], [m]) })),
    ]
      .filter((f) => f.count > 0 && f.href !== filter.path)
      // "Remote" is both a job type and a work mode; show one chip.
      .filter((f, i, all) => all.findIndex((o) => o.label === f.label) === i);
    const cities = CITIES.map((city) => ({ label: cityHeading(city), href: cityPath(city.slug), count: matchCity(jobs, city).length }))
      .filter((c) => c.count > 0);
    return <EmptyJobFilter label={filter.label} filters={filters} cities={cities} />;
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
