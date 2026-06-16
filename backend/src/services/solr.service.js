import { env } from '../config/env.js';

/**
 * Thin Apache Solr client for the public job index.
 *
 * Design goals:
 *  - Optional: when SOLR_URL is unset, every call is a no-op / "not configured"
 *    so the rest of the app keeps working against MongoDB.
 *  - Resilient: search throws on failure so the caller can fall back to Mongo;
 *    indexing failures are swallowed (logged) so a Solr outage never blocks a
 *    write to the source-of-truth database.
 *  - Self-contained schema: documents use Solr's default dynamic-field suffixes
 *    (*_t text, *_s string, *_ss multi-string, *_d double, *_dt date) so a plain
 *    `solr create -c jobs` works with no manual schema editing.
 */

const isConfigured = () => Boolean(env.SOLR_URL);

export const isSolrConfigured = isConfigured;

const coreBaseUrl = () => `${env.SOLR_URL.replace(/\/$/, '')}/${env.SOLR_JOBS_CORE}`;

const solrFetch = async (pathWithQuery, init = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.SOLR_TIMEOUT_MS);
  try {
    const res = await fetch(`${coreBaseUrl()}${pathWithQuery}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    if (!res.ok) {
      const message = body?.error?.msg || (typeof body === 'string' ? body : `HTTP ${res.status}`);
      throw new Error(`Solr request failed: ${message}`);
    }
    return body;
  } finally {
    clearTimeout(timeout);
  }
};

// Short-lived health cache so a single failed request doesn't trigger a Solr
// round-trip on every job listing while it is down.
let healthCache = { ok: false, checkedAt: 0 };
const HEALTH_TTL_MS = 15000;

export const pingSolr = async ({ force = false } = {}) => {
  if (!isConfigured()) return false;
  const now = Date.now();
  if (!force && now - healthCache.checkedAt < HEALTH_TTL_MS) {
    return healthCache.ok;
  }
  try {
    const body = await solrFetch('/admin/ping?wt=json');
    const ok = body?.status === 'OK' || body?.responseHeader?.status === 0;
    healthCache = { ok, checkedAt: now };
    return ok;
  } catch (error) {
    healthCache = { ok: false, checkedAt: now };
    console.warn('[solr] ping failed:', error.message);
    return false;
  }
};

const toEpochDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/**
 * Map a normalized public job (the output of normalizePublicJob) to a Solr doc.
 * The full normalized object is stored verbatim in `payload_s` so search results
 * can be returned with the exact same shape the API already promises — no second
 * MongoDB read required.
 */
export const buildJobSolrDoc = (job) => {
  const doc = {
    id: String(job._id),
    title_t: job.jobTitle || '',
    company_t: job.companyName || '',
    description_t: job.description || '',
    location_t: job.jobLocation || '',
    department_t: job.department || '',
    skills_txt: Array.isArray(job.skills) ? job.skills.join(' ') : '',
    location_s: (job.jobLocation || '').toLowerCase(),
    type_s: job.employmentType || '',
    status_s: 'active',
    sourceCollection_s: job.sourceCollection || 'jobRequirements',
    minCtc_d: Number.isFinite(job.minCtcLpa) ? job.minCtcLpa : null,
    maxCtc_d: Number.isFinite(job.maxCtcLpa) ? job.maxCtcLpa : null,
    payload_s: JSON.stringify(job),
  };
  const createdAt = toEpochDate(job.createdAt);
  if (createdAt) doc.createdAt_dt = createdAt;
  return doc;
};

export const indexJobs = async (jobs) => {
  if (!isConfigured() || !jobs?.length) return;
  const docs = jobs.map(buildJobSolrDoc);
  await solrFetch('/update?commitWithin=2000&overwrite=true', {
    method: 'POST',
    body: JSON.stringify(docs),
  });
};

export const indexJob = async (job) => {
  try {
    await indexJobs([job]);
  } catch (error) {
    console.warn('[solr] indexJob failed (job saved to Mongo regardless):', error.message);
  }
};

export const deleteJobFromSolr = async (jobId) => {
  if (!isConfigured()) return;
  try {
    await solrFetch('/update?commit=true', {
      method: 'POST',
      body: JSON.stringify({ delete: { id: String(jobId) } }),
    });
  } catch (error) {
    console.warn('[solr] deleteJob failed:', error.message);
  }
};

export const clearJobsIndex = async () => {
  if (!isConfigured()) return;
  await solrFetch('/update?commit=true', {
    method: 'POST',
    body: JSON.stringify({ delete: { query: '*:*' } }),
  });
};

export const commitSolr = async () => {
  if (!isConfigured()) return;
  await solrFetch('/update?commit=true', { method: 'POST', body: '{}' });
};

const escapeSolrTerm = (value) =>
  String(value || '').replace(/([+\-!(){}[\]^"~*?:\\/&|])/g, '\\$1');

/**
 * Run a job search against Solr. Returns { jobs, total } where jobs are the
 * stored normalized payloads. Throws on transport/parse failure so the caller
 * can fall back to MongoDB.
 */
export const searchJobsViaSolr = async ({ q, location, type, page = 1, limit = 10 }) => {
  const params = new URLSearchParams();
  params.set('defType', 'edismax');
  params.set('qf', 'title_t^3 company_t^2 skills_txt^1.5 location_t description_t');
  params.set('q', q && String(q).trim() ? String(q).trim() : '*:*');
  params.set('start', String(Math.max(0, (Number(page) - 1) * Number(limit))));
  params.set('rows', String(Number(limit)));
  params.set('sort', 'createdAt_dt desc');
  params.set('fl', 'payload_s');
  params.append('fq', 'status_s:active');
  if (type && String(type).trim()) {
    params.append('fq', `type_s:"${escapeSolrTerm(type)}"`);
  }
  if (location && String(location).trim()) {
    params.append('fq', `location_t:(${escapeSolrTerm(location)})`);
  }
  params.set('wt', 'json');

  const body = await solrFetch(`/select?${params.toString()}`);
  const docs = body?.response?.docs || [];
  const jobs = docs
    .map((doc) => {
      try {
        return JSON.parse(doc.payload_s);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return { jobs, total: body?.response?.numFound ?? jobs.length };
};
