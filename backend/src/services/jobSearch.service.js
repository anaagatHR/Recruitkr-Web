/**
 * MongoDB-backed job search used as the source of truth and as the fallback
 * whenever Apache Solr is not configured or temporarily unavailable.
 *
 * The expensive part of the legacy implementation was reading and normalizing
 * three collections on every request. We cache that normalized list for a short
 * window so repeated listings (pagination, filter tweaks) are served from memory
 * instead of re-scanning MongoDB each time.
 */

const CACHE_TTL_MS = 30000;

let cache = { jobs: null, expiresAt: 0 };

export const invalidateJobsCache = () => {
  cache = { jobs: null, expiresAt: 0 };
};

/**
 * @param {() => Promise<Array>} loader - returns the full list of normalized
 *   active public jobs (the heavy 3-collection read + normalize).
 * @param {{ force?: boolean }} [opts]
 */
export const getActiveNormalizedJobs = async (loader, { force = false } = {}) => {
  const now = Date.now();
  if (!force && cache.jobs && now < cache.expiresAt) {
    return cache.jobs;
  }
  const jobs = await loader();
  cache = { jobs, expiresAt: now + CACHE_TTL_MS };
  return jobs;
};

const includesCI = (haystack, needle) =>
  String(haystack || '').toLowerCase().includes(String(needle).trim().toLowerCase());

export const filterSortPaginateJobs = (jobs, { q, location, type, minSalary, maxSalary, page = 1, limit = 10 }) => {
  const floor = minSalary != null && Number.isFinite(Number(minSalary)) ? Number(minSalary) : null;
  const ceil = maxSalary != null && Number.isFinite(Number(maxSalary)) ? Number(maxSalary) : null;

  const filtered = jobs.filter((job) => {
    if (q && !includesCI(job.jobTitle, q) && !includesCI(job.companyName, q)) return false;
    if (location && !includesCI(job.jobLocation, location)) return false;
    if (type && job.employmentType !== type) return false;
    // Salary band overlap against the job's [minCtcLpa, maxCtcLpa] range.
    if (floor != null && Number.isFinite(job.maxCtcLpa) && job.maxCtcLpa < floor) return false;
    if (ceil != null && Number.isFinite(job.minCtcLpa) && job.minCtcLpa > ceil) return false;
    return true;
  });

  // jobs are already createdAt-desc from the loader; keep that order.
  const total = filtered.length;
  const currentPage = Math.max(1, Number(page));
  const pageLimit = Math.max(1, Number(limit));
  const skip = (currentPage - 1) * pageLimit;
  const data = filtered.slice(skip, skip + pageLimit);

  return {
    data,
    meta: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages: Math.ceil(total / pageLimit) || 1,
    },
  };
};
