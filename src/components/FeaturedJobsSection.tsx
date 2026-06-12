"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/compat/router";
import JobCard from "@/components/job/JobCard";
import { fetchJobs, type Job } from "@/lib/jobs";

export default function FeaturedJobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchJobs()
      .then(({ jobs: allJobs }) => {
        if (!active) return;
        const featured = allJobs.filter((job) => job.featured);
        const picks = (featured.length ? featured : allJobs).slice(0, 4);
        setJobs(picks);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="featured-jobs" className="border-y border-border bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Hot openings</p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Featured jobs</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Browse verified roles from top-rated companies — no login needed until you apply.
            </p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
          >
            View all jobs <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-muted/50" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Jobs are loading soon.{" "}
            <Link to="/jobs" className="font-semibold text-primary hover:underline">
              Browse the jobs page
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
