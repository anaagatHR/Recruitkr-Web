import { apiGet, apiPost } from "@/lib/api";
import { normalizeApiJob, type Job } from "@/lib/jobs";
import type { ConversationSummary } from "@/lib/messages";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  meta?: SearchMeta;
  facets?: CandidateFacets;
};

export type SearchMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  engine?: "solr" | "mongo";
};

export type Suggestion = { value: string; type: "job" | "candidate" };

export type CandidateResult = {
  id: string;
  name: string;
  headline: string;
  skills: string[];
  experience: string;
  experienceStatus: string;
  education: string;
  location: string;
  profileScore: number;
  photoUrl: string;
};

export type CandidateFacet = { value: string; count: number };
export type CandidateFacets = { skills: CandidateFacet[]; experience: CandidateFacet[] };

const buildQuery = (params: Record<string, unknown>) => {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined || val === null || val === "") continue;
    sp.set(key, String(val));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
};

/* ----------------------------- Jobs (public) ----------------------------- */

export type JobSearchParams = {
  q?: string;
  location?: string;
  type?: string;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  limit?: number;
};

export const searchJobs = async (
  params: JobSearchParams,
): Promise<{ jobs: Job[]; meta: SearchMeta }> => {
  const res = await apiGet<ApiEnvelope<unknown[]>>(`/search/jobs${buildQuery(params)}`);
  const jobs = (res.data || []).map(normalizeApiJob).filter((j): j is Job => Boolean(j));
  return {
    jobs,
    meta: res.meta ?? { page: 1, limit: jobs.length, total: jobs.length, totalPages: 1 },
  };
};

export const fetchJobSuggestions = async (q: string): Promise<Suggestion[]> => {
  if (!q || q.trim().length < 2) return [];
  const res = await apiGet<ApiEnvelope<Suggestion[]>>(`/search/suggestions${buildQuery({ q })}`);
  return res.data || [];
};

/* ------------------------- Candidates (recruiter) ------------------------ */

export type CandidateSearchParams = {
  q?: string;
  skills?: string; // comma-separated
  experience?: string; // "fresher" | "experienced"
  location?: string;
  page?: number;
  limit?: number;
};

export const searchCandidates = async (
  params: CandidateSearchParams,
): Promise<{ candidates: CandidateResult[]; meta: SearchMeta; facets: CandidateFacets }> => {
  const res = await apiGet<ApiEnvelope<CandidateResult[]>>(
    `/search/candidates${buildQuery(params)}`,
    { auth: true },
  );
  return {
    candidates: res.data || [],
    meta: res.meta ?? { page: 1, limit: 12, total: (res.data || []).length, totalPages: 1 },
    facets: res.facets ?? { skills: [], experience: [] },
  };
};

export const fetchCandidateSuggestions = async (q: string): Promise<Suggestion[]> => {
  if (!q || q.trim().length < 2) return [];
  const res = await apiGet<ApiEnvelope<Suggestion[]>>(
    `/search/candidates/suggestions${buildQuery({ q })}`,
    { auth: true },
  );
  return res.data || [];
};

/** Start (or reopen) a direct chat with a candidate straight from search. */
export const startDirectChat = async (candidateId: string): Promise<ConversationSummary> => {
  const res = await apiPost<ApiEnvelope<ConversationSummary>>(
    "/conversations/direct",
    { candidateId },
    { auth: true },
  );
  return res.data;
};
