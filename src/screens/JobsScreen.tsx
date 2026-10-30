"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import { useLocation } from "@/compat/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/job/JobCard";
import FomoTicker from "@/components/job/FomoTicker";
import { fetchJobsPage, JOB_TYPES, JOBS_PAGE_SIZE as PAGE_SIZE, parseFilterList, pluralize, WORK_MODES, type Job } from "@/lib/jobs";

export default function JobsScreen({
  initialJobs = [],
  initialHasMore = true,
  initialTotal,
  initialPage = 1,
  totalPages = 1,
}: {
  initialJobs?: Job[];
  initialHasMore?: boolean;
  /** Board-wide total from the API, so the count line can say "68 jobs" not "12+ jobs". */
  initialTotal?: number;
  /** Server-rendered ?page= this view started from; infinite scroll continues after it. */
  initialPage?: number;
  totalPages?: number;
}) {
  const routeLocation = useLocation();
  const initialSearch = new URLSearchParams(routeLocation.search).get("search") ?? "";
  // `?type=` / `?mode=` preset the filter chips, so the homepage category cards can
  // deep-link straight into a filtered list. Unknown values are dropped.
  const paramList = (search: string, key: string, allowed: readonly string[]): string[] =>
    parseFilterList(new URLSearchParams(search).get(key), allowed);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(initialJobs.length === 0);
  const [query, setQuery] = useState(initialSearch);
  const [location, setLocation] = useState(new URLSearchParams(routeLocation.search).get("location") ?? "");
  const [activeTypes, setActiveTypes] = useState<string[]>(() => paramList(routeLocation.search, "type", JOB_TYPES));
  const [activeModes, setActiveModes] = useState<string[]>(() => paramList(routeLocation.search, "mode", WORK_MODES));
  const [sort, setSort] = useState<"recent" | "salary">("recent");

  // Infinite scroll: pages load one at a time as the sentinel div nears the
  // viewport, instead of fetching the whole list up front. Refs mirror the
  // pieces of state the IntersectionObserver callback needs, so the observer
  // never acts on a stale closure.
  const [hasMore, setHasMore] = useState(initialJobs.length > 0 ? initialHasMore : true);
  const [total, setTotal] = useState<number | undefined>(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(initialPage);
  const hasMoreRef = useRef(initialJobs.length > 0 ? initialHasMore : true);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(new URLSearchParams(routeLocation.search).get("search") ?? "");
    setLocation(new URLSearchParams(routeLocation.search).get("location") ?? "");
    setActiveTypes(paramList(routeLocation.search, "type", JOB_TYPES));
    setActiveModes(paramList(routeLocation.search, "mode", WORK_MODES));
  }, [routeLocation.search]);

  useEffect(() => {
    // Server already provided page 1 — render it instantly, no client refetch.
    if (initialJobs.length > 0) return;
    let active = true;
    fetchJobsPage(1, PAGE_SIZE).then(({ jobs, hasMore, live, total: apiTotal }) => {
      if (!active) return;
      setJobs(jobs);
      setTotal(live ? apiTotal : jobs.length);
      setLoading(false);
      const more = live && hasMore;
      setHasMore(more);
      hasMoreRef.current = more;
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    fetchingRef.current = true;
    setLoadingMore(true);
    try {
      const next = pageRef.current + 1;
      const { jobs: more, hasMore: moreLeft, total: apiTotal } = await fetchJobsPage(next, PAGE_SIZE);
      pageRef.current = next;
      if (apiTotal) setTotal(apiTotal);
      setJobs((prev) => {
        const seen = new Set(prev.map((job) => job.id));
        return [...prev, ...more.filter((job) => !seen.has(job.id))];
      });
      setHasMore(moreLeft);
      hasMoreRef.current = moreLeft;
    } finally {
      fetchingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || loading || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      // Start fetching well before the user reaches the bottom.
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, loading, hasMore]);

  const isFiltering = Boolean(query.trim() || location.trim() || activeTypes.length || activeModes.length);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const filtered = useMemo(() => {
    let result = jobs.filter((job) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        (job.company ?? "").toLowerCase().includes(q) ||
        (job.skills?.some((s) => s.toLowerCase().includes(q)) ?? false);
      const matchesLocation = !location.trim() || job.location.toLowerCase().includes(location.trim().toLowerCase());
      const matchesType = activeTypes.length === 0 || activeTypes.includes(job.type);
      const matchesMode = activeModes.length === 0 || activeModes.includes(job.workMode);
      return matchesQuery && matchesLocation && matchesType && matchesMode;
    });
    result = [...result].sort((a, b) =>
      sort === "recent"
        ? new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        : (b.salaryMax ?? 0) - (a.salaryMax ?? 0),
    );
    return result;
  }, [jobs, query, location, activeTypes, activeModes, sort]);

  // min-h-[40px] keeps every filter chip a comfortable thumb target on a phone;
  // at py-1.5 they measured 34px, under the ~44px touch guideline.
  const chip = (active: boolean) =>
    `inline-flex min-h-[40px] items-center rounded-full border px-4 py-2 text-sm font-medium transition ${
      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* <main id="main">: the page had no main landmark, so screen-reader users had no
          way to skip the nav and jump to the board. It wraps the hero and the
          results but not the Navbar/Footer, which are their own landmarks. */}
      <main id="main">
      {/* Search hero */}
      <section className="border-b border-border bg-muted/40 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Find your next job</h1>
            {/* Counted from the results actually on screen, so the line stays
                true as the visitor filters. */}
            <FomoTicker jobs={filtered} />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Search size={18} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, company or skill"
                aria-label="Search by job title, company or skill"
                type="search"
                enterKeyHint="search"
                className="w-full bg-transparent py-3 text-base outline-none sm:text-sm"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <MapPin size={18} className="text-muted-foreground" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                aria-label="Filter by location"
                autoComplete="address-level2"
                className="w-full bg-transparent py-3 text-base outline-none sm:text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-[260px_1fr]">
          {/* Filters */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <SlidersHorizontal size={16} /> Filters
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Job type</p>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((t) => (
                  <button key={t} type="button" aria-pressed={activeTypes.includes(t)} onClick={() => toggle(activeTypes, setActiveTypes, t)} className={chip(activeTypes.includes(t))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work mode</p>
              <div className="flex flex-wrap gap-2">
                {WORK_MODES.map((m) => (
                  <button key={m} type="button" aria-pressed={activeModes.includes(m)} onClick={() => toggle(activeModes, setActiveModes, m)} className={chip(activeModes.includes(m))}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              {/* Exact counts. This used to read "1+ job found" — the "+" was a
                  guess about pages not yet loaded. Now: "12 of 68 jobs" while
                  more are available, "68 jobs found" once they're all in, and
                  the plain filtered count when the visitor has narrowed it. */}
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {loading
                  ? "Loading jobs..."
                  : isFiltering
                    ? `${pluralize(filtered.length, "job")} match your filters`
                    : hasMore && total && total > filtered.length
                      ? `Showing ${filtered.length} of ${pluralize(total, "job")}`
                      : `${pluralize(filtered.length, "job")} found`}
              </p>
              <select
                // The control has no visible <label> — its meaning comes from
                // the selected option text — so screen readers announced it as
                // an unnamed combo box.
                aria-label="Sort jobs"
                value={sort}
                onChange={(e) => setSort(e.target.value as "recent" | "salary")}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none"
              >
                <option value="recent">Most recent</option>
                <option value="salary">Highest salary</option>
              </select>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-muted/50" />
                ))}
              </div>
            ) : filtered.length === 0 && !hasMore ? (
              <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
                No jobs match your filters. Try widening your search.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {/* h2: these cards sit directly under the page h1, with no
                    section heading between, so h3 would skip a level. */}
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} headingLevel={2} />
                ))}
              </div>
            )}

            {/* Infinite-scroll sentinel: when this row nears the viewport the
                next page is fetched and appended. The explicit button is the
                keyboard / reduced-data fallback — and the thing that makes
                the remaining pages reachable at all when IntersectionObserver
                never fires (print, some in-app browsers). */}
            {!loading && hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                {loadingMore ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Loading more jobs…
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    className="inline-flex min-h-[44px] items-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
                  >
                    Load more jobs
                  </button>
                )}
              </div>
            )}
            {/* Crawlable pagination: plain <a href> links, so every listing is
                reachable without JavaScript or the infinite-scroll observer. */}
            {!isFiltering && totalPages > 1 && (
              <nav aria-label="Job pages" className="flex flex-wrap items-center justify-center gap-2 py-4 text-sm">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <a
                    key={n}
                    href={n === 1 ? "/jobs" : `/jobs?page=${n}`}
                    aria-current={n === initialPage ? "page" : undefined}
                    className={`inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border px-3 ${
                      n === initialPage ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {n}
                  </a>
                ))}
              </nav>
            )}
            {!loading && !hasMore && filtered.length > 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                You&apos;ve seen all {pluralize(filtered.length, "job")}.
              </p>
            )}
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  );
}
