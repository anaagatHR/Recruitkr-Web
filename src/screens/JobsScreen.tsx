"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, MapPin, SlidersHorizontal, Loader2 } from "lucide-react";
import { useLocation } from "@/compat/router";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import JobCard from "@/components/job/JobCard";
import FomoTicker from "@/components/job/FomoTicker";
import { fetchJobsPage, type Job } from "@/lib/jobs";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Remote"];
const WORK_MODES = ["On-site", "Hybrid", "Remote"];
const PAGE_SIZE = 12;

export default function JobsScreen({
  initialJobs = [],
  initialHasMore = true,
}: {
  initialJobs?: Job[];
  initialHasMore?: boolean;
}) {
  const routeLocation = useLocation();
  const initialSearch = new URLSearchParams(routeLocation.search).get("search") ?? "";
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loading, setLoading] = useState(initialJobs.length === 0);
  const [query, setQuery] = useState(initialSearch);
  const [location, setLocation] = useState("");
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeModes, setActiveModes] = useState<string[]>([]);
  const [sort, setSort] = useState<"recent" | "salary">("recent");

  // Infinite scroll: pages load one at a time as the sentinel div nears the
  // viewport, instead of fetching the whole list up front. Refs mirror the
  // pieces of state the IntersectionObserver callback needs, so the observer
  // never acts on a stale closure.
  const [hasMore, setHasMore] = useState(initialJobs.length > 0 ? initialHasMore : true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(initialJobs.length > 0 ? initialHasMore : true);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(new URLSearchParams(routeLocation.search).get("search") ?? "");
  }, [routeLocation.search]);

  useEffect(() => {
    // Server already provided page 1 — render it instantly, no client refetch.
    if (initialJobs.length > 0) return;
    let active = true;
    fetchJobsPage(1, PAGE_SIZE).then(({ jobs, hasMore, live }) => {
      if (!active) return;
      setJobs(jobs);
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
      const { jobs: more, hasMore: moreLeft } = await fetchJobsPage(next, PAGE_SIZE);
      pageRef.current = next;
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

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
    }`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Search hero */}
      <section className="border-b border-border bg-muted/40 pt-24 pb-8">
        <div className="container mx-auto px-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-heading text-2xl font-bold sm:text-3xl">Find your next job</h1>
            <FomoTicker />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <Search size={18} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Job title, company or skill"
                className="w-full bg-transparent py-3 text-sm outline-none"
              />
            </div>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3">
              <MapPin size={18} className="text-muted-foreground" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-full bg-transparent py-3 text-sm outline-none"
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
                  <button key={t} onClick={() => toggle(activeTypes, setActiveTypes, t)} className={chip(activeTypes.includes(t))}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Work mode</p>
              <div className="flex flex-wrap gap-2">
                {WORK_MODES.map((m) => (
                  <button key={m} onClick={() => toggle(activeModes, setActiveModes, m)} className={chip(activeModes.includes(m))}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Loading jobs..."
                  : `${filtered.length}${hasMore ? "+" : ""} job${filtered.length === 1 ? "" : "s"} found`}
              </p>
              <select
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
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}

            {/* Infinite-scroll sentinel: when this row nears the viewport the
                next page is fetched and appended. */}
            {!loading && hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                {loadingMore && (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Loading more jobs…
                  </>
                )}
              </div>
            )}
            {!loading && !hasMore && filtered.length > 0 && (
              <p className="py-8 text-center text-xs text-muted-foreground">
                You&apos;ve seen all {filtered.length} job{filtered.length === 1 ? "" : "s"}.
              </p>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
