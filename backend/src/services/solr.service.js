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

const coreUrl = (core) => `${env.SOLR_URL.replace(/\/$/, '')}/${core}`;

/** Core-aware low-level request. */
const solrFetchCore = async (core, pathWithQuery, init = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.SOLR_TIMEOUT_MS);
  try {
    const res = await fetch(`${coreUrl(core)}${pathWithQuery}`, {
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

// Backward-compatible helper bound to the jobs core (existing call sites unchanged).
const solrFetch = (pathWithQuery, init) => solrFetchCore(env.SOLR_JOBS_CORE, pathWithQuery, init);

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

/** Document count for a core (via a rows=0 match-all). Returns null on failure. */
const coreDocCount = async (core) => {
  try {
    const body = await solrFetchCore(core, '/select?q=*:*&rows=0&wt=json');
    const n = body?.response?.numFound;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

/**
 * Prints a clear, human-readable Solr status banner at boot so operators can see
 * at a glance whether search is running on Solr or the MongoDB fallback — and
 * whether the cores still need a reindex. Never throws.
 */
export const reportSolrStatus = async () => {
  if (!isConfigured()) {
    console.log('🔎 Search: MongoDB (Solr not configured — set SOLR_URL to enable)');
    return;
  }

  const url = env.SOLR_URL;
  const reachable = await pingSolr({ force: true });
  if (!reachable) {
    console.warn(`⚠️  Solr: configured at ${url} but UNREACHABLE — using MongoDB fallback.`);
    console.warn('    The backend re-checks every 15s and switches to Solr automatically once it is up.');
    return;
  }

  const [jobs, candidates] = await Promise.all([
    coreDocCount(env.SOLR_JOBS_CORE),
    coreDocCount(env.SOLR_CANDIDATES_CORE),
  ]);

  console.log(`✅ Solr connected: ${url}`);
  console.log(
    `   • core "${env.SOLR_JOBS_CORE}": ${jobs ?? 'unknown'} docs` +
      (jobs === 0 ? '  → run `npm run solr:reindex` to backfill' : ''),
  );
  console.log(
    `   • core "${env.SOLR_CANDIDATES_CORE}": ${candidates ?? 'unknown'} docs` +
      (candidates === 0 ? '  → run `npm run solr:reindex:candidates` to backfill' : ''),
  );
  console.log('   Search engine: Solr (MongoDB fallback active only if Solr goes down)');
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
export const searchJobsViaSolr = async ({ q, location, type, minSalary, maxSalary, page = 1, limit = 10 }) => {
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
  // Salary band overlap: the job's max must clear the desired floor, and its
  // min must sit below the desired ceiling.
  if (minSalary != null && Number.isFinite(Number(minSalary))) {
    params.append('fq', `maxCtc_d:[${Number(minSalary)} TO *]`);
  }
  if (maxSalary != null && Number.isFinite(Number(maxSalary))) {
    params.append('fq', `minCtc_d:[* TO ${Number(maxSalary)}]`);
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

/* ------------------------------------------------------------------ *
 *  Candidates core                                                    *
 *  Mirrors the jobs design (dynamic-field suffixes, payload_s blob).  *
 *  PII-SAFE: the stored payload never contains email or phone — those *
 *  are reachable only through an authorized application/chat.         *
 * ------------------------------------------------------------------ */

const candidatesCore = () => env.SOLR_CANDIDATES_CORE;

// Lightweight 0-100 readiness score used for ranking when there is no text query.
const computeProfileScore = (c) => {
  const experienceLabel =
    c.experienceStatus === 'experienced'
      ? [c.experienceDetails?.designation, c.experienceDetails?.totalExperience].filter(Boolean).join(' · ')
      : c.experienceStatus === 'fresher'
        ? 'Fresher'
        : '';
  const location = c.preferences?.preferredLocation || c.preferredLocation || c.currentCity || '';
  const filled = [
    c.fullName,
    Array.isArray(c.skills) && c.skills.length,
    c.highestQualification,
    experienceLabel,
    location,
    c.summary,
    c.profilePhotoUrl,
  ].filter(Boolean).length;
  return Math.round((filled / 7) * 100);
};

/** Map a CandidateProfile (plain object) to a Solr doc + safe result payload. */
export const buildCandidateSolrDoc = (c) => {
  const skills = (Array.isArray(c.skills) ? c.skills : []).map((s) => String(s).trim()).filter(Boolean);
  const experienceLabel =
    c.experienceStatus === 'experienced'
      ? [c.experienceDetails?.designation, c.experienceDetails?.totalExperience].filter(Boolean).join(' · ') ||
        'Experienced'
      : 'Fresher';
  const location = c.preferences?.preferredLocation || c.preferredLocation || c.currentCity || '';
  const headline = c.preferences?.preferredRole || c.preferredRole || '';
  const profileScore = computeProfileScore(c);

  // Returned to recruiters verbatim — intentionally excludes email/phone.
  const payload = {
    id: String(c.userId),
    name: c.fullName || '',
    headline,
    skills,
    experience: experienceLabel,
    experienceStatus: c.experienceStatus || '',
    education: c.highestQualification || '',
    location,
    profileScore,
    photoUrl: c.profilePhotoUrl || '',
  };

  const doc = {
    id: String(c.userId),
    name_t: payload.name,
    headline_t: headline,
    skills_txt: skills.join(' '),
    skills_ss: skills,
    education_t: payload.education,
    experience_s: experienceLabel,
    exp_s: c.experienceStatus || '',
    location_t: location,
    location_s: location.toLowerCase(),
    profileScore_i: profileScore,
    payload_s: JSON.stringify(payload),
  };
  const updatedAt = toEpochDate(c.updatedAt);
  if (updatedAt) doc.updatedAt_dt = updatedAt;
  return doc;
};

export const indexCandidates = async (candidates) => {
  if (!isConfigured() || !candidates?.length) return;
  const docs = candidates.map(buildCandidateSolrDoc);
  await solrFetchCore(candidatesCore(), '/update?commitWithin=2000&overwrite=true', {
    method: 'POST',
    body: JSON.stringify(docs),
  });
};

export const indexCandidate = async (candidate) => {
  try {
    await indexCandidates([candidate]);
  } catch (error) {
    console.warn('[solr] indexCandidate failed (profile saved to Mongo regardless):', error.message);
  }
};

export const deleteCandidateFromSolr = async (userId) => {
  if (!isConfigured()) return;
  try {
    await solrFetchCore(candidatesCore(), '/update?commit=true', {
      method: 'POST',
      body: JSON.stringify({ delete: { id: String(userId) } }),
    });
  } catch (error) {
    console.warn('[solr] deleteCandidate failed:', error.message);
  }
};

export const clearCandidatesIndex = async () => {
  if (!isConfigured()) return;
  await solrFetchCore(candidatesCore(), '/update?commit=true', {
    method: 'POST',
    body: JSON.stringify({ delete: { query: '*:*' } }),
  });
};

export const commitCandidates = async () => {
  if (!isConfigured()) return;
  await solrFetchCore(candidatesCore(), '/update?commit=true', { method: 'POST', body: '{}' });
};

// Append `~1` fuzziness to alphabetic tokens >3 chars for typo tolerance.
const fuzzify = (q) =>
  String(q || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => (/^[a-zA-Z]{4,}$/.test(tok) ? `${tok}~1` : tok))
    .join(' ');

const parseFacetField = (body, field) => {
  const arr = body?.facet_counts?.facet_fields?.[field] || [];
  const out = [];
  for (let i = 0; i < arr.length; i += 2) out.push({ value: arr[i], count: arr[i + 1] });
  return out;
};

/**
 * Recruiter candidate search. Returns { candidates, total, facets }. Throws on
 * transport failure so the caller can fall back to MongoDB. PII-safe payloads.
 */
export const searchCandidatesViaSolr = async ({
  q,
  skills,
  experience,
  location,
  page = 1,
  limit = 12,
  fuzzy = true,
} = {}) => {
  const params = new URLSearchParams();
  const hasQuery = q && String(q).trim();
  params.set('defType', 'edismax');
  params.set('qf', 'name_t^3 skills_txt^2.5 headline_t^2 education_t location_t');
  params.set('q.op', 'OR');
  params.set('q', hasQuery ? (fuzzy ? fuzzify(q) : String(q).trim()) : '*:*');
  params.set('start', String(Math.max(0, (Number(page) - 1) * Number(limit))));
  params.set('rows', String(Number(limit)));
  params.set('sort', hasQuery ? 'score desc, profileScore_i desc' : 'profileScore_i desc, updatedAt_dt desc');
  params.set('fl', 'payload_s,score');

  const skillList = Array.isArray(skills)
    ? skills
    : String(skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  for (const sk of skillList) params.append('fq', `skills_ss:"${escapeSolrTerm(sk)}"`);
  if (experience && String(experience).trim()) params.append('fq', `exp_s:"${escapeSolrTerm(experience)}"`);
  if (location && String(location).trim()) params.append('fq', `location_t:(${escapeSolrTerm(location)})`);

  params.set('facet', 'true');
  params.append('facet.field', 'skills_ss');
  params.append('facet.field', 'exp_s');
  params.set('facet.mincount', '1');
  params.set('facet.limit', '24');
  params.set('wt', 'json');

  const body = await solrFetchCore(candidatesCore(), `/select?${params.toString()}`);
  const docs = body?.response?.docs || [];
  const candidates = docs
    .map((doc) => {
      try {
        return JSON.parse(doc.payload_s);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return {
    candidates,
    total: body?.response?.numFound ?? candidates.length,
    facets: { skills: parseFacetField(body, 'skills_ss'), experience: parseFacetField(body, 'exp_s') },
  };
};

/**
 * Autocomplete. `core` is 'jobs' | 'candidates'. Returns up to `limit` distinct
 * display strings matching the prefix. Uses an edismax prefix query (no Solr
 * Suggester component required, so a plain `solr create` works out of the box).
 */
export const suggest = async ({ core = 'jobs', prefix, limit = 8 } = {}) => {
  if (!isConfigured() || !prefix || !String(prefix).trim()) return [];
  const isJobs = core === 'jobs';
  const targetCore = isJobs ? env.SOLR_JOBS_CORE : env.SOLR_CANDIDATES_CORE;
  const term = String(prefix).trim();

  const params = new URLSearchParams();
  params.set('defType', 'edismax');
  params.set('qf', isJobs ? 'title_t^3 skills_txt company_t' : 'name_t^3 skills_txt headline_t');
  // Prefix match on the last token so results appear while typing.
  params.set('q', `${escapeSolrTerm(term)}*`);
  params.set('rows', String(Number(limit)));
  params.set('fl', 'payload_s');
  if (isJobs) params.append('fq', 'status_s:active');
  params.set('wt', 'json');

  const body = await solrFetchCore(targetCore, `/select?${params.toString()}`);
  const docs = body?.response?.docs || [];
  const seen = new Set();
  const out = [];
  for (const doc of docs) {
    let payload = null;
    try {
      payload = JSON.parse(doc.payload_s);
    } catch {
      payload = null;
    }
    const value = isJobs ? payload?.jobTitle : payload?.name;
    const key = String(value || '').trim().toLowerCase();
    if (value && !seen.has(key)) {
      seen.add(key);
      out.push({ value, type: isJobs ? 'job' : 'candidate' });
    }
    if (out.length >= Number(limit)) break;
  }
  return out;
};
