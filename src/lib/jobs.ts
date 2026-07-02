import { apiGet } from "@/lib/api";

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
  postedAt: string; // ISO
  applicants: number;
  openings: number;
  featured?: boolean;
  companyRating?: number;
};

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

const JOB_TYPES: JobType[] = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
const WORK_MODES: Job["workMode"][] = ["On-site", "Hybrid", "Remote"];

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
  if (isSeedJob(raw)) return raw;

  const record = raw as Record<string, unknown>;
  const salary = record.salary && typeof record.salary === "object" ? (record.salary as Record<string, unknown>) : null;

  const id = asString(record.id ?? record._id);
  const title = asString(record.title ?? record.jobTitle);
  if (!id || !title) return null;

  const salaryMin = asNumber(record.salaryMin ?? record.minCtcLpa ?? salary?.min);
  const salaryMax = asNumber(record.salaryMax ?? record.maxCtcLpa ?? salary?.max);
  const createdAt = asString(record.postedAt ?? record.createdAt, new Date().toISOString());

  return {
    id,
    title,
    company: asString(record.company ?? record.companyName, "Company") || "Company",
    companyId: asString(record.companyId) || undefined,
    companyLogo: asString(record.companyLogo) || undefined,
    location: asString(record.location ?? record.jobLocation, "Location not shared") || "Location not shared",
    type: normalizeJobType(record.type ?? record.employmentType),
    workMode: normalizeWorkMode(record.workMode, record.workModes),
    salaryMin: salaryMin && salaryMin > 0 ? salaryMin : undefined,
    salaryMax: salaryMax && salaryMax > 0 ? salaryMax : undefined,
    experience: asString(record.experience ?? record.experienceRequired, "Not specified") || "Not specified",
    sector: asString(record.sector ?? record.department ?? record.category, "General") || "General",
    skills: Array.isArray(record.skills)
      ? record.skills.map((skill) => asString(skill)).filter(Boolean)
      : [],
    description: asString(record.description ?? record.jobDescription, ""),
    postedAt: createdAt,
    applicants: asNumber(record.applicants) ?? 0,
    openings: Math.max(1, asNumber(record.openings) ?? 1),
    featured: Boolean(record.featured),
    companyRating: asNumber(record.companyRating),
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
  { id: "j1", title: "Corporate Jobs", company: "Nimbus Technologies", companyId: "c1", location: "Bengaluru", type: "Full-time", workMode: "Hybrid", salaryMin: 18, salaryMax: 32, experience: "4-7 yrs", sector: "Information Technology", skills: ["React", "TypeScript", "Next.js"], description: "Build delightful, high-performance web apps used by millions.", postedAt: hoursAgo(3), applicants: 47, openings: 2, featured: true, companyRating: 4.6 },
  { id: "j2", title: "Staff Nurse - ICU", company: "MediCare Health", companyId: "c2", location: "Mumbai", type: "Full-time", workMode: "On-site", salaryMin: 4, salaryMax: 7, experience: "2-5 yrs", sector: "Healthcare", skills: ["Critical Care", "Patient Care"], description: "Provide compassionate, expert care in our ICU.", postedAt: hoursAgo(8), applicants: 31, openings: 5, companyRating: 4.3 },
  { id: "j3", title: "Internship", company: "FinEdge Capital", companyId: "c3", location: "Gurugram", type: "Full-time", workMode: "On-site", salaryMin: 9, salaryMax: 15, experience: "3-6 yrs", sector: "Banking & Finance", skills: ["Risk", "SQL", "Excel"], description: "Own credit-risk models for our digital lending book.", postedAt: hoursAgo(20), applicants: 18, openings: 1, featured: true, companyRating: 4.1 },
  { id: "j4", title: "Store Manager", company: "RetailNova", companyId: "c4", location: "Delhi", type: "Full-time", workMode: "On-site", salaryMin: 5, salaryMax: 9, experience: "3-8 yrs", sector: "Retail", skills: ["Operations", "Team Lead"], description: "Run a flagship store and lead a 20-person team.", postedAt: hoursAgo(30), applicants: 64, openings: 3, companyRating: 3.9 },
  { id: "j5", title: "Production Engineer", company: "BuildWorks Manufacturing", companyId: "c5", location: "Pune", type: "Full-time", workMode: "On-site", salaryMin: 6, salaryMax: 11, experience: "2-5 yrs", sector: "Manufacturing", skills: ["CNC", "Lean", "Quality"], description: "Optimise precision manufacturing lines.", postedAt: hoursAgo(46), applicants: 12, openings: 4, companyRating: 4.0 },
  { id: "j6", title: "Logistics Coordinator", company: "SwiftLogix", companyId: "c6", location: "Hyderabad", type: "Full-time", workMode: "Hybrid", salaryMin: 4, salaryMax: 8, experience: "1-4 yrs", sector: "Logistics", skills: ["Supply Chain", "ERP"], description: "Coordinate last-mile delivery across the south zone.", postedAt: hoursAgo(5), applicants: 22, openings: 6, companyRating: 4.2 },
  { id: "j7", title: "Workfrom Home", company: "Nimbus Technologies", companyId: "c1", location: "Remote", type: "Internship", workMode: "Remote", salaryMin: 0.3, salaryMax: 0.5, experience: "0-1 yrs", sector: "Information Technology", skills: ["Content", "SEO"], description: "Learn product marketing with a world-class team.", postedAt: hoursAgo(2), applicants: 88, openings: 2, featured: true, companyRating: 4.6 },
  { id: "j8", title: "Backend Engineer (Node.js)", company: "SwiftLogix", companyId: "c6", location: "Hyderabad", type: "Full-time", workMode: "Remote", salaryMin: 14, salaryMax: 26, experience: "3-6 yrs", sector: "Information Technology", skills: ["Node.js", "Postgres", "AWS"], description: "Scale our delivery platform to 10x volume.", postedAt: hoursAgo(11), applicants: 39, openings: 3, companyRating: 4.2 },
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

export async function fetchJobs(): Promise<{ jobs: Job[]; live: boolean }> {
  try {
    const res = await apiGet<JobsResponse>("/jobs?limit=50", { retries: 0 });
    const jobs = normalizeJobs(unwrap(res, "jobs"));
    if (jobs.length) return { jobs, live: true };
  } catch {
    /* fall through to seed */
  }
  return { jobs: seedJobs, live: false };
}

export async function fetchJob(id: string): Promise<Job | null> {
  try {
    const res = await apiGet<{ success?: boolean; data?: unknown }>(`/jobs/${id}`, { retries: 0 });
    const job = normalizeApiJob(res?.data);
    if (job) return job;
  } catch {
    /* no public GET /jobs/:id — fall through */
  }

  try {
    const { jobs } = await fetchJobs();
    const match = jobs.find((job) => job.id === id);
    if (match) return match;
  } catch {
    /* fall through */
  }

  return seedJobs.find((job) => job.id === id) ?? null;
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
