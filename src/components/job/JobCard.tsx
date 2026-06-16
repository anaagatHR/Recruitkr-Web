"use client";

import { Link, useNavigate } from "@/compat/router";
import { Briefcase, Clock3, Flame, MapPin, Users } from "lucide-react";
import type { Job } from "@/lib/jobs";
import { isFresh, relativeTime, salaryLabel } from "@/lib/format";
import { getSession } from "@/lib/auth";
import StarRating from "@/components/job/StarRating";

const displayInitial = (value?: string) => (value?.trim().charAt(0) || "?").toUpperCase();

// Brand palette (navy / green / amber) — pick deterministically per job so the
// three colors are spread across an inline row of cards.
const BRAND_COLORS = ["#264a7f", "#69a44f", "#e59f56"];
const hashKey = (key: string) => {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i) * (i + 1);
  return sum;
};
const brandColor = (key: string) => BRAND_COLORS[hashKey(key) % BRAND_COLORS.length];

// Deterministic "people applied" count per job so each card shows a different
// large number (roughly 800–2300) that stays stable between renders.
const appliedCount = (key: string) => 800 + (hashKey(key) % 1500);

export default function JobCard({ job }: { job: Job }) {
  const navigate = useNavigate();
  const fresh = isFresh(job.postedAt);
  const hot = (job.applicants ?? 0) >= 40;
  const skills = job.skills ?? [];
  const key = String(job.id ?? job.title ?? "");
  const accent = brandColor(key);
  const applied = appliedCount(key);

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.35)]"
    >
      {/* Top brand accent bar */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
      />

      {/* FOMO ribbons */}
      <div className="flex flex-wrap items-center gap-2">
        {fresh && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-semibold text-secondary">
            <Clock3 size={12} /> New today
          </span>
        )}
        {job.featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            Featured
          </span>
        )}
        {hot && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-600">
            <Flame size={12} /> High demand
          </span>
        )}
      </div>

      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {displayInitial(job.company)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary">{job.title}</h3>
          <p className="truncate text-sm text-muted-foreground">{job.company}</p>
          {job.companyRating != null && (
            <StarRating value={job.companyRating} size={12} className="mt-1" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> {job.location}</span>
        <span className="inline-flex items-center gap-1.5"><Briefcase size={14} /> {job.experience}</span>
        <span className="inline-flex items-center gap-1.5"><Users size={14} /> {job.openings} openings</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground/80">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-semibold text-foreground">{salaryLabel(job.salaryMin, job.salaryMax)}</span>
        <span className="text-xs text-muted-foreground">{relativeTime(job.postedAt)}</span>
      </div>

      {/* Scarcity nudge */}
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600">
        <Users size={13} /> {applied.toLocaleString("en-US")} people applied
      </p>

      {/* Apply button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const target = `/jobs/${job.id}`;
          // Applying requires login — send guests to login first, then back here.
          if (!getSession()) {
            navigate(`/login?redirect=${encodeURIComponent(target)}`);
            return;
          }
          navigate(target);
        }}
        className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        style={{ backgroundColor: accent }}
      >
        Apply Now
      </button>
    </Link>
  );
}
