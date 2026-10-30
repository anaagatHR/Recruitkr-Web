import { apiGet, apiPost } from "@/lib/api";
import { salaryLabel } from "@/lib/format";

/**
 * Apply to a job, safely re-sendable. The Idempotency-Key is derived from the
 * job (the server scopes it per candidate), so a candidate who re-clicks after a
 * lost response gets the original 201 back instead of a 409 — and since it is
 * deterministic, no retry can ever "forget" it. Never retried automatically.
 */
/** Listing placeholder from the API that must not be shown or offered as a filter. */
export const PLACEHOLDER_LOCATION = "Location not shared";

const matchWords = (value?: string) =>
  (value || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length > 1);

/**
 * "Best match" ranking for the candidate dashboard (audit §6.5): words of the
 * preferred role in the job title (3 each), the preferred location (2), and
 * each overlapping skill (1). Pure; higher is better, 0 means no signal.
 */
export const scoreJobMatch = (
  job: { jobTitle?: string; jobLocation?: string; skills?: string[] },
  prefs: { preferredRole?: string; preferredLocation?: string; skills?: string[] },
) => {
  const title = new Set(matchWords(job.jobTitle));
  let score = matchWords(prefs.preferredRole).filter((word) => title.has(word)).length * 3;
  const location = (prefs.preferredLocation || "").trim().toLowerCase();
  if (location && (job.jobLocation || "").toLowerCase().includes(location)) score += 2;
  const mine = new Set((prefs.skills || []).map((skill) => skill.trim().toLowerCase()).filter(Boolean));
  score += (job.skills || []).filter((skill) => mine.has(String(skill).trim().toLowerCase())).length;
  return score;
};

export const applyToJobRequest = (
  jobId: string,
  extras: { note?: string; declarationAccepted?: true } = {},
) =>
  apiPost(
    "/jobs/apply",
    { jobId, ...(extras.note?.trim() ? { note: extras.note.trim() } : {}), ...(extras.declarationAccepted ? { declarationAccepted: true } : {}) },
    { auth: true, headers: { "Idempotency-Key": `apply:${jobId}` } },
  );

export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship" | "Remote";

export type Job = {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  companyLogo?: string;
  location: string;
  type: JobType;
  workMode: "On-site" | "Hybrid" | "Remote";
  salaryMin?: number;
  salaryMax?: number;
  experience: string;
  sector: string;
  skills: string[];
  description: string;
  /** Bullet lists and qualification from the posting form; often empty. */
  responsibilities?: string[];
  requirements?: string[];
  qualification?: string;
  /** False when the API had no usable value and `type` / `workMode` are defaults. */
  typeKnown?: boolean;
  workModeKnown?: boolean;
  postedAt: string; // ISO
  applicants: number;
  openings: number;
  featured?: boolean;
  companyRating?: number;
  /** ISO date after which the employer no longer accepts applications. */
  applicationDeadline?: string;
  /** Backend verdict on whether the Apply button should be live. */
  canApply?: boolean;
  /**
   * True when the listing carries the minimum a candidate needs to decide:
   * a real company name and a description. Incomplete listings are kept on
   * the full board but hidden from the homepage strips so the first thing a
   * visitor sees is never "Company · Not disclosed · Not specified".
   */
  isComplete: boolean;
};

/** Label shown wherever a job has no employer name. Never "Company". */
export const CONFIDENTIAL_EMPLOYER = "Confidential Employer";

/** Employer name for display: the real one, or an honest placeholder. */
export const displayCompany = (job: Pick<Job, "company">) => job.company?.trim() || CONFIDENTIAL_EMPLOYER;

/**
 * Readable job URL segment: "chief-general-technician-spiny-<id>". The full id
 * stays at the end (after the last "-"), so no lookup table is needed and a
 * renamed job keeps working: /jobs/[id] 301s any stale slug to the current one.
 */
export const jobSlug = (job: Pick<Job, "id" | "title" | "company">) => {
  const words = `${job.title} ${job.company ?? ""}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
  return words ? `${words}-${job.id}` : job.id;
};

export const jobPath = (job: Pick<Job, "id" | "title" | "company">) => `/jobs/${jobSlug(job)}`;

/** The job id inside a /jobs/<segment> URL: a bare id, or whatever follows the slug's last "-". */
export const jobIdFromParam = (param: string) => param.slice(param.lastIndexOf("-") + 1);

/** Days until the deadline (negative when past); undefined when none is set. */
export const daysUntilDeadline = (job: Pick<Job, "applicationDeadline">): number | undefined => {
  if (!job.applicationDeadline) return undefined;
  const ts = Date.parse(job.applicationDeadline);
  if (!Number.isFinite(ts)) return undefined;
  return Math.ceil((ts - Date.now()) / 86_400_000);
};

export const isExpired = (job: Pick<Job, "applicationDeadline">) => {
  const days = daysUntilDeadline(job);
  return days !== undefined && days < 0;
};

/** Still taking applications. */
export const isOpen = (job: Job) => !isExpired(job) && job.canApply !== false;

/** Above 200 LPA (₹2 crore) is a data-entry error, e.g. a monthly ₹25,000 typed into the LPA field. */
export const MAX_PLAUSIBLE_LPA = 200;
const plausibleLpa = (lpa?: number) => (lpa != null && lpa > 0 && lpa <= MAX_PLAUSIBLE_LPA ? lpa : undefined);
export const plausibleSalary = (job: Pick<Job, "salaryMin" | "salaryMax">) => ({
  min: plausibleLpa(job.salaryMin),
  max: plausibleLpa(job.salaryMax),
});

const postedDate = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : // Fixed zone so the server render and the browser agree on the day.
      date.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
};

/**
 * The posting's real facts as [label, value]. Placeholders ("Location not
 * shared") and values the normaliser defaulted (type/work mode the employer
 * never chose) are left out, so nothing here is invented.
 */
export const jobFacts = (job: Job): Array<[string, string]> => {
  const salary = plausibleSalary(job);
  const facts: Array<[string, string | undefined]> = [
    ["Company", job.company?.trim()],
    ["Location", job.location !== PLACEHOLDER_LOCATION ? job.location : undefined],
    ["Employment type", job.typeKnown === false ? undefined : job.type],
    ["Work mode", job.workModeKnown === false ? undefined : job.workMode],
    ["Experience", formatExperience(job.experience)],
    ["Qualification", job.qualification],
    ["Department", job.sector !== "General" ? job.sector : undefined],
    ["Openings", job.openings > 1 ? String(job.openings) : undefined],
    ["Salary", salary.min || salary.max ? salaryLabel(salary.min, salary.max) : undefined],
    ["Posted", postedDate(job.postedAt)],
  ];
  return facts.filter((fact): fact is [string, string] => Boolean(fact[1]));
};

const countWords = (parts: Array<string | undefined>) => parts.join(" ").split(/\s+/).filter(Boolean).length;

/** A description shorter than this counts as no description ("Jaipur" is not one). */
export const MIN_DESCRIPTION_WORDS = 30;
/** Posting-specific words needed for a description-less job page to be indexed. */
export const MIN_INDEXABLE_CONTENT_WORDS = 150;

export const hasDescription = (job: Pick<Job, "description">) => countWords([job.description]) >= MIN_DESCRIPTION_WORDS;

/**
 * Words of content specific to this posting: its title, facts, description,
 * responsibilities, requirements and skills. Deliberately excludes the
 * generated overview, the apply steps and related roles — those appear on
 * every job page and say nothing new about this one.
 */
export const jobContentWords = (job: Job) =>
  countWords([
    job.title,
    ...jobFacts(job).map(([, value]) => value),
    job.description,
    ...(job.responsibilities ?? []),
    ...(job.requirements ?? []),
    ...job.skills,
  ]);

/**
 * Indexable job page: open, and either described or carrying enough real
 * structured detail. Page metadata and jobs-sitemap.xml both use this.
 */
export const isIndexableJob = (job: Job) =>
  isOpen(job) && (hasDescription(job) || jobContentWords(job) >= MIN_INDEXABLE_CONTENT_WORDS);

/** Other open roles, same location first, then same department, then newest. */
export const relatedJobs = (job: Job, all: Job[], limit = 6) => {
  const location = job.location !== PLACEHOLDER_LOCATION ? job.location.toLowerCase() : "";
  const score = (other: Job) =>
    (location && other.location.toLowerCase() === location ? 2 : 0) +
    (job.sector !== "General" && other.sector === job.sector ? 1 : 0);
  return all
    .filter((other) => other.id !== job.id && isOpen(other))
    .map((other, index) => ({ other, index, rank: score(other) }))
    .sort((a, b) => b.rank - a.rank || a.index - b.index)
    .slice(0, limit)
    .map(({ other }) => other);
};

/**
 * "2-4" → "2–4 years experience", "Fresher" → "Fresher", "Not specified" → "".
 * The meta description used to read "2-4 experience" with the unit missing.
 */
export const formatExperience = (experience: string | undefined): string => {
  const raw = (experience ?? "").trim();
  if (!raw || /^not specified$/i.test(raw)) return "";
  if (/fresher|entry/i.test(raw)) return raw;
  if (/year|yr/i.test(raw)) return raw.replace(/\s*yrs?\b/i, " years").replace(/-/g, "–") + (/experience/i.test(raw) ? "" : " experience");
  const range = raw.match(/^(\d+)\s*(?:-|–|to)\s*(\d+)\+?$/);
  if (range) return `${range[1]}–${range[2]} years experience`;
  const single = raw.match(/^(\d+)\+?$/);
  if (single) return `${single[1]}+ years experience`;
  return raw;
};

/** "1 opening" / "3 openings" — never "1 openings". */
export const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count.toLocaleString("en-IN")} ${count === 1 ? singular : plural}`;

export type Company = {
  id: string;
  name: string;
  logo?: string;
  sector: string;
  location: string;
  rating: number;
  reviews: number;
  openJobs: number;
  description: string;
  verified?: boolean;
};

/** Board page size, shared by the server-rendered /jobs?page=N and the client infinite scroll. */
export const JOBS_PAGE_SIZE = 12;

export const JOB_TYPES: JobType[] = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
export const WORK_MODES: Job["workMode"][] = ["On-site", "Hybrid", "Remote"];

/** "internship,remote" → ["Internship", "Remote"]; unknown values are dropped. */
export const parseFilterList = <T extends string>(raw: string | null | undefined, allowed: readonly T[]): T[] =>
  (raw ?? "")
    .split(",")
    .map((value) => allowed.find((option) => option.toLowerCase() === value.trim().toLowerCase()))
    .filter((value): value is T => Boolean(value));

const asString = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value.trim();
  if (value == null) return fallback;
  return String(value).trim();
};

const asNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const isSeedJob = (job: unknown): job is Job =>
  Boolean(
    job &&
      typeof job === "object" &&
      typeof (job as Job).id === "string" &&
      typeof (job as Job).title === "string" &&
      typeof (job as Job).company === "string",
  );

const normalizeJobType = (value: unknown): JobType => {
  const raw = asString(value, "Full-time");
  return JOB_TYPES.find((type) => type.toLowerCase() === raw.toLowerCase()) ?? "Full-time";
};

const normalizeWorkMode = (value: unknown, workModes?: unknown): Job["workMode"] => {
  const modes = Array.isArray(workModes) ? workModes.map((mode) => asString(mode).toLowerCase()) : [];
  if (modes.includes("remote")) return "Remote";
  if (modes.includes("hybrid")) return "Hybrid";

  const raw = asString(value).toLowerCase();
  if (raw.includes("remote")) return "Remote";
  if (raw.includes("hybrid")) return "Hybrid";

  return WORK_MODES.find((mode) => mode.toLowerCase() === raw) ?? "On-site";
};

/** Maps Express /jobs payloads (jobTitle, companyName, _id, …) to the UI Job shape. */
export function normalizeApiJob(raw: unknown): Job | null {
  if (!raw || typeof raw !== "object") return null;
  if (isSeedJob(raw)) return { ...raw, isComplete: raw.isComplete ?? true };

  const record = raw as Record<string, unknown>;
  const salary = record.salary && typeof record.salary === "object" ? (record.salary as Record<string, unknown>) : null;

  const id = asString(record.id ?? record._id);
  const title = asString(record.title ?? record.jobTitle);
  if (!id || !title) return null;

  const salaryMin = asNumber(record.salaryMin ?? record.minCtcLpa ?? salary?.min);
  const salaryMax = asNumber(record.salaryMax ?? record.maxCtcLpa ?? salary?.max);
  const createdAt = asString(record.postedAt ?? record.createdAt, new Date().toISOString());
  // Legacy records had the literal placeholder "Company" saved as a name.
  const rawCompany = asString(record.company ?? record.companyName);
  const company = /^company$/i.test(rawCompany) ? "" : rawCompany;
  const description = asString(record.description ?? record.jobDescription, "");
  const list = (value: unknown) => (Array.isArray(value) ? value.map((item) => asString(item)).filter(Boolean) : []);
  const deadline = asString(record.applicationDeadline);
  const isComplete =
    typeof record.isComplete === "boolean" ? record.isComplete : Boolean(company) && description.length >= 40;

  return {
    id,
    // Titles were saved with trailing spaces ("store manager "), which showed
    // up in <title> and in the URL slug.
    title: title.replace(/\s+/g, " ").trim(),
    company,
    companyId: asString(record.companyId) || undefined,
    companyLogo: asString(record.companyLogo) || undefined,
    location: asString(record.location ?? record.jobLocation, "Location not shared") || "Location not shared",
    type: normalizeJobType(record.type ?? record.employmentType),
    workMode: normalizeWorkMode(record.workMode, record.workModes),
    typeKnown: JOB_TYPES.some((t) => t.toLowerCase() === asString(record.type ?? record.employmentType).toLowerCase()),
    workModeKnown:
      (Array.isArray(record.workModes) && record.workModes.length > 0) ||
      WORK_MODES.some((m) => asString(record.workMode).toLowerCase().includes(m.toLowerCase())),
    salaryMin: salaryMin && salaryMin > 0 ? salaryMin : undefined,
    salaryMax: salaryMax && salaryMax > 0 ? salaryMax : undefined,
    experience: asString(record.experience ?? record.experienceRequired, "Not specified") || "Not specified",
    sector: asString(record.sector ?? record.department ?? record.category, "General") || "General",
    skills: Array.isArray(record.skills)
      ? record.skills.map((skill) => asString(skill)).filter(Boolean)
      : [],
    description,
    responsibilities: list(record.responsibilities),
    requirements: list(record.requirements),
    qualification: asString(record.qualification) || undefined,
    postedAt: createdAt,
    applicants: asNumber(record.applicants) ?? 0,
    openings: Math.max(1, asNumber(record.openings) ?? 1),
    featured: Boolean(record.featured),
    companyRating: asNumber(record.companyRating),
    applicationDeadline: deadline && Number.isFinite(Date.parse(deadline)) ? deadline : undefined,
    canApply: typeof record.canApply === "boolean" ? record.canApply : undefined,
    isComplete,
  };
};

const isSeedCompany = (company: unknown): company is Company =>
  Boolean(
    company &&
      typeof company === "object" &&
      typeof (company as Company).id === "string" &&
      typeof (company as Company).name === "string",
  );

export function normalizeApiCompany(raw: unknown): Company | null {
  if (!raw || typeof raw !== "object") return null;
  if (isSeedCompany(raw)) return raw;

  const record = raw as Record<string, unknown>;
  const id = asString(record.id ?? record._id);
  const name = asString(record.name ?? record.companyName);
  if (!id || !name) return null;

  return {
    id,
    name,
    logo: asString(record.logo) || undefined,
    sector: asString(record.sector ?? record.industry, "General") || "General",
    location: asString(record.location ?? record.city, "India") || "India",
    rating: asNumber(record.rating) ?? 0,
    reviews: asNumber(record.reviews) ?? 0,
    openJobs: Math.max(0, asNumber(record.openJobs) ?? 0),
    description: asString(record.description, ""),
    verified: Boolean(record.verified),
  };
};

/**
 * Seed data is used as a graceful fallback when the Express backend hasn't yet
 * exposed /jobs and /companies. Once those endpoints exist, the live data wins.
 */
const seedCompanies: Company[] = [
  { id: "c1", name: "Nimbus Technologies", sector: "Information Technology", location: "Bengaluru", rating: 4.6, reviews: 1280, openJobs: 14, verified: true, description: "Cloud and SaaS products for global enterprises." },
  { id: "c2", name: "MediCare Health", sector: "Healthcare", location: "Mumbai", rating: 4.3, reviews: 845, openJobs: 9, verified: true, description: "A fast-growing chain of multi-speciality hospitals." },
  { id: "c3", name: "FinEdge Capital", sector: "Banking & Finance", location: "Gurugram", rating: 4.1, reviews: 612, openJobs: 7, verified: true, description: "Digital lending and wealth-management solutions." },
  { id: "c4", name: "RetailNova", sector: "Retail", location: "Delhi", rating: 3.9, reviews: 430, openJobs: 11, description: "Omnichannel retail and quick-commerce." },
  { id: "c5", name: "BuildWorks Manufacturing", sector: "Manufacturing", location: "Pune", rating: 4.0, reviews: 320, openJobs: 6, verified: true, description: "Precision components for automotive and aerospace." },
  { id: "c6", name: "SwiftLogix", sector: "Logistics", location: "Hyderabad", rating: 4.2, reviews: 510, openJobs: 8, description: "Tech-driven supply chain and last-mile delivery." },
];

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

const seedJobs: Job[] = [
  { id: "j1", title: "Corporate Jobs", company: "Nimbus Technologies", companyId: "c1", location: "Bengaluru", type: "Full-time", workMode: "Hybrid", salaryMin: 18, salaryMax: 32, experience: "4-7 yrs", sector: "Information Technology", skills: ["React", "TypeScript", "Next.js"], description: "Build delightful, high-performance web apps used by millions.", postedAt: hoursAgo(3), applicants: 47, openings: 2, featured: true, companyRating: 4.6, isComplete: true },
  { id: "j2", title: "Staff Nurse - ICU", company: "MediCare Health", companyId: "c2", location: "Mumbai", type: "Full-time", workMode: "On-site", salaryMin: 4, salaryMax: 7, experience: "2-5 yrs", sector: "Healthcare", skills: ["Critical Care", "Patient Care"], description: "Provide compassionate, expert care in our ICU.", postedAt: hoursAgo(8), applicants: 31, openings: 5, companyRating: 4.3, isComplete: true },
  { id: "j3", title: "Internship", company: "FinEdge Capital", companyId: "c3", location: "Gurugram", type: "Full-time", workMode: "On-site", salaryMin: 9, salaryMax: 15, experience: "3-6 yrs", sector: "Banking & Finance", skills: ["Risk", "SQL", "Excel"], description: "Own credit-risk models for our digital lending book.", postedAt: hoursAgo(20), applicants: 18, openings: 1, featured: true, companyRating: 4.1, isComplete: true },
  { id: "j4", title: "Store Manager", company: "RetailNova", companyId: "c4", location: "Delhi", type: "Full-time", workMode: "On-site", salaryMin: 5, salaryMax: 9, experience: "3-8 yrs", sector: "Retail", skills: ["Operations", "Team Lead"], description: "Run a flagship store and lead a 20-person team.", postedAt: hoursAgo(30), applicants: 64, openings: 3, companyRating: 3.9, isComplete: true },
  { id: "j5", title: "Production Engineer", company: "BuildWorks Manufacturing", companyId: "c5", location: "Pune", type: "Full-time", workMode: "On-site", salaryMin: 6, salaryMax: 11, experience: "2-5 yrs", sector: "Manufacturing", skills: ["CNC", "Lean", "Quality"], description: "Optimise precision manufacturing lines.", postedAt: hoursAgo(46), applicants: 12, openings: 4, companyRating: 4.0, isComplete: true },
  { id: "j6", title: "Logistics Coordinator", company: "SwiftLogix", companyId: "c6", location: "Hyderabad", type: "Full-time", workMode: "Hybrid", salaryMin: 4, salaryMax: 8, experience: "1-4 yrs", sector: "Logistics", skills: ["Supply Chain", "ERP"], description: "Coordinate last-mile delivery across the south zone.", postedAt: hoursAgo(5), applicants: 22, openings: 6, companyRating: 4.2, isComplete: true },
  { id: "j7", title: "Workfrom Home", company: "Nimbus Technologies", companyId: "c1", location: "Remote", type: "Internship", workMode: "Remote", salaryMin: 0.3, salaryMax: 0.5, experience: "0-1 yrs", sector: "Information Technology", skills: ["Content", "SEO"], description: "Learn product marketing with a world-class team.", postedAt: hoursAgo(2), applicants: 88, openings: 2, featured: true, companyRating: 4.6, isComplete: true },
  { id: "j8", title: "Backend Engineer (Node.js)", company: "SwiftLogix", companyId: "c6", location: "Hyderabad", type: "Full-time", workMode: "Remote", salaryMin: 14, salaryMax: 26, experience: "3-6 yrs", sector: "Information Technology", skills: ["Node.js", "Postgres", "AWS"], description: "Scale our delivery platform to 10x volume.", postedAt: hoursAgo(11), applicants: 39, openings: 3, companyRating: 4.2, isComplete: true },
];

type JobsResponse = { success?: boolean; data?: unknown[] | { jobs?: unknown[] } };
type CompaniesResponse = { success?: boolean; data?: unknown[] | { companies?: unknown[] } };

const unwrap = (payload: unknown, key: string): unknown[] | null => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const data = (payload as Record<string, unknown>).data ?? payload;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)[key])) {
      return (data as Record<string, unknown>)[key] as unknown[];
    }
  }
  return null;
};

const normalizeJobs = (rawJobs: unknown[] | null): Job[] =>
  (rawJobs ?? []).map(normalizeApiJob).filter((job): job is Job => Boolean(job));

const normalizeCompanies = (rawCompanies: unknown[] | null): Company[] =>
  (rawCompanies ?? []).map(normalizeApiCompany).filter((company): company is Company => Boolean(company));

export type JobsPage = { jobs: Job[]; total: number; hasMore: boolean; live: boolean };

/**
 * Paged fetch for infinite scrolling. The backend `/jobs` endpoint paginates via
 * `page`/`limit` and reports `meta.totalPages`, so each scroll step only loads
 * one small page instead of the whole list.
 */
export async function fetchJobsPage(page = 1, limit = 12): Promise<JobsPage> {
  try {
    const res = await apiGet<JobsResponse & { meta?: { page?: number; total?: number; totalPages?: number } }>(
      `/jobs?page=${page}&limit=${limit}`,
      { retries: 0 },
    );
    const jobs = normalizeJobs(unwrap(res, "jobs"));
    const meta = res && typeof res === "object" ? res.meta : undefined;
    if (jobs.length || page > 1) {
      const currentPage = Number(meta?.page) || page;
      const totalPages = Number(meta?.totalPages) || currentPage;
      return {
        jobs,
        total: Number(meta?.total) || jobs.length,
        hasMore: currentPage < totalPages,
        live: true,
      };
    }
  } catch {
    /* fall through to seed */
  }
  return page === 1
    ? { jobs: seedJobs, total: seedJobs.length, hasMore: false, live: false }
    : { jobs: [], total: 0, hasMore: false, live: true };
}

/**
 * The home page has several sections that each need "the jobs" (latest strip,
 * companies-hiring grid, FOMO ticker). Without this they each fired their own
 * `/jobs?limit=50` on mount — the audit saw the identical request twice in the
 * network tab. One in-flight promise is shared and the result is kept for a
 * short window, so a page renders from a single request.
 */
const JOBS_MEMO_TTL_MS = 60_000;
let jobsMemo: { promise: Promise<{ jobs: Job[]; live: boolean }>; expiresAt: number } | null = null;

async function loadJobsUncached(): Promise<{ jobs: Job[]; live: boolean }> {
  try {
    const res = await apiGet<JobsResponse>("/jobs?limit=50", { retries: 0 });
    const jobs = normalizeJobs(unwrap(res, "jobs"));
    if (jobs.length) return { jobs, live: true };
  } catch {
    /* fall through to seed */
  }
  return { jobs: seedJobs, live: false };
}

export async function fetchJobs(): Promise<{ jobs: Job[]; live: boolean }> {
  const now = Date.now();
  if (jobsMemo && now < jobsMemo.expiresAt) return jobsMemo.promise;

  const promise = loadJobsUncached().then((result) => {
    // A failed request (seed fallback) must not be memoised for a minute —
    // the next section to mount should get a fresh attempt.
    if (!result.live) jobsMemo = null;
    return result;
  });
  jobsMemo = { promise, expiresAt: now + JOBS_MEMO_TTL_MS };
  return promise;
}

/** Drop the memoised list — call after anything that changes the board. */
export function invalidateJobsMemo() {
  jobsMemo = null;
}

/** Jobs fit to headline the homepage: complete, live, not past deadline. */
export const homepageEligible = (job: Job) => job.isComplete && !isExpired(job) && job.canApply !== false;

/**
 * Every live job, paged until the backend says there are no more.
 *
 * `fetchJobs()` asks for one page of 50 and is right for a home-page strip, but
 * the sitemap has to list *all* of them or the roles past the 50th never get
 * crawled. `live` is false when the first page failed and the seed listings
 * came back instead — callers that publish URLs must check it, because those
 * eight jobs are fictional and their detail pages don't exist.
 *
 * PAGE_SIZE must not exceed the backend's cap. `listJobsQuerySchema` declares
 * `limit: …max(50)` (backend/src/schemas/job.schema.js), so asking for 100
 * fails validation with a 400 — which this module treats as "API unreachable"
 * and answers with seed data. That silently emptied the sitemap of every job
 * URL, because the sitemap skips job routes whenever `live` is false.
 *
 * PAGE_CAP is a runaway guard, not a business limit: raise it if the board ever
 * grows past 5,000 live listings.
 */
export async function fetchAllJobs(): Promise<{ jobs: Job[]; live: boolean }> {
  const PAGE_SIZE = 50;
  const PAGE_CAP = 100;
  const CONCURRENCY = 5;

  const first = await fetchJobsPage(1, PAGE_SIZE);
  if (!first.live) return { jobs: first.jobs, live: false };
  if (!first.hasMore) return { jobs: first.jobs, live: true };

  const all = [...first.jobs];

  /**
   * The API reports `meta.total`, so the page count is known after one request
   * and the rest can be fetched concurrently. This matters at scale: a board of
   * 2,000 listings is 40 pages, and fetching those one at a time is 40 serial
   * round-trips — around ten seconds, against a serverless time budget the
   * sitemap route shares. In batches of five it is closer to one.
   *
   * `total` is only trusted when it exceeds the first page; a backend that
   * omits `meta.total` reports it as the page length, which would silently
   * truncate the sitemap to 50 jobs. In that case we walk pages instead.
   */
  const knownTotal = first.total > first.jobs.length ? first.total : 0;

  if (knownTotal) {
    const lastPage = Math.min(Math.ceil(knownTotal / PAGE_SIZE), PAGE_CAP);
    const pages: number[] = [];
    for (let page = 2; page <= lastPage; page += 1) pages.push(page);

    for (let i = 0; i < pages.length; i += CONCURRENCY) {
      const batch = await Promise.all(
        pages.slice(i, i + CONCURRENCY).map((page) => fetchJobsPage(page, PAGE_SIZE)),
      );
      batch.forEach((result) => all.push(...result.jobs));
    }
  } else {
    let page = 1;
    // Annotated: the `if (!first.hasMore) return` above narrows this to the
    // literal `true`, which then rejects the reassignment below.
    let hasMore: boolean = first.hasMore;

    while (hasMore && page < PAGE_CAP) {
      page += 1;
      const next = await fetchJobsPage(page, PAGE_SIZE);
      if (!next.jobs.length) break;
      all.push(...next.jobs);
      hasMore = next.hasMore;
    }
  }

  // New postings arriving mid-crawl shift the ordering, which can hand us the
  // same job on two pages. Duplicate <url> entries in a sitemap are untidy at
  // best, so collapse by id.
  const byId = new Map(all.map((job) => [job.id, job]));
  return { jobs: [...byId.values()], live: true };
}

/**
 * `job` is the listing when we found one. `live` says whether the backend
 * actually answered.
 *
 * The distinction matters only to the server-rendered job page, which has to
 * choose between a 404 and a retry. "The API said this job does not exist"
 * (`live: true`, `job: null`) deserves a 404 — soft 404s, where a missing job
 * returns 200 with an empty shell, burn crawl budget and get the whole
 * directory demoted. "The API was unreachable" (`live: false`) must NOT 404:
 * serving 404s for real jobs during a backend outage is how an indexed board
 * disappears from Google.
 */
export type JobResult = { job: Job | null; live: boolean };

export async function fetchJobResult(id: string): Promise<JobResult> {
  try {
    const res = await apiGet<{ success?: boolean; data?: unknown }>(`/jobs/${id}`, { retries: 0 });
    const job = normalizeApiJob(res?.data);
    if (job) return { job, live: true };
    /* 200 with an unusable body — fall through to the list scan */
  } catch (error) {
    const status = (error as { status?: number })?.status;
    // Only the backend explicitly saying "gone" is proof the job doesn't exist.
    // Timeouts, 5xx and proxy misconfiguration prove nothing.
    if (status === 404 || status === 410) return { job: null, live: true };
  }

  try {
    const { jobs, live } = await fetchJobs();
    const match = jobs.find((job) => job.id === id);
    if (match) return { job: match, live };
    if (live) return { job: null, live: true };
  } catch {
    /* fall through */
  }

  return { job: seedJobs.find((job) => job.id === id) ?? null, live: false };
}

export async function fetchJob(id: string): Promise<Job | null> {
  return (await fetchJobResult(id)).job;
}

export async function fetchCompanies(): Promise<{ companies: Company[]; live: boolean }> {
  try {
    const res = await apiGet<CompaniesResponse>("/companies", { retries: 0 });
    const companies = normalizeCompanies(unwrap(res, "companies"));
    if (companies.length) return { companies, live: true };
  } catch {
    /* fall through to seed */
  }
  return { companies: seedCompanies, live: false };
}

export { seedJobs, seedCompanies };
