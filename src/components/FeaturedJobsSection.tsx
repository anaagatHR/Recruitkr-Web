"use client";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/compat/router";
import JobCard from "@/components/job/JobCard";
import { fetchJobs, type Job } from "@/lib/jobs";

/**
 * A four-job strip in two flavours: "featured" (employer-flagged roles, used on
 * the employers page) and "latest" (newest postings, the last thing on the home
 * page before the footer, so a visitor who read the whole page lands back on
 * jobs rather than on the footer).
 */

const COUNT = 4;

/** Featured jobs, or the first four if none are flagged. */
function featuredPicks(all: Job[]): Job[] {
  const featured = all.filter((job) => job.featured);
  return (featured.length ? featured : all).slice(0, COUNT);
}

/** The four most recently posted. */
function latestPicks(all: Job[]): Job[] {
  return all
    .slice()
    .sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt))
    .slice(0, COUNT);
}

type Variant = "featured" | "latest";

const COPY: Record<
  Variant,
  { id: string; eyebrow: string; heading: React.ReactNode; blurb: string }
> = {
  featured: {
    id: "featured-jobs",
    eyebrow: "Hot openings",
    heading: (
      <>
        Roles <span className="text-[#264a7f]">hiring right now</span>
      </>
    ),
    blurb: "Verified openings from top-rated companies — no login needed until you apply.",
  },
  latest: {
    id: "latest-jobs",
    eyebrow: "Fresh on the board",
    heading: (
      <>
        Roles, <span className="text-[#264a7f]">just posted</span>
      </>
    ),
    blurb: "The most recently added openings — no login needed until you apply.",
  },
};

export default function FeaturedJobsSection({ variant = "featured" }: { variant?: Variant }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchJobs()
      .then(({ jobs: allJobs }) => {
        if (!active) return;
        setJobs(variant === "latest" ? latestPicks(allJobs) : featuredPicks(allJobs));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [variant]);

  const copy = COPY[variant];

  // An empty "More roles, just posted" heading would read as broken, and the
  // empty-state prompt below belongs to the featured section only — so on an
  // empty board this variant just disappears.
  if (variant === "latest" && !loading && jobs.length === 0) return null;

  return (
    // Tinted band with the same centred eyebrow → heading → subtitle header as
    // every other home section, so it reads as part of one system rather than
    // the older left-aligned style it used to carry.
    <section id={copy.id} className="border-y border-slate-100 bg-slate-50 py-14 sm:py-20">
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e59f56]/25 bg-[#e59f56]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c07c33] sm:tracking-[0.22em]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e59f56]" />
            {copy.eyebrow}
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">
            {copy.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            {copy.blurb}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: COUNT }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-muted/50" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/70 p-10 text-center text-muted-foreground shadow-sm">
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

        {/* CTA moved below the grid and centred: at the top-right it competed
            with the heading and was the first thing read on a phone, before a
            single job had been seen. */}
        <div className="mt-8 flex justify-center sm:mt-10">
          <Link
            to="/jobs"
            className="group inline-flex min-h-[48px] items-center gap-2 rounded-full border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#264a7f] hover:text-[#264a7f]"
          >
            View all jobs
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
