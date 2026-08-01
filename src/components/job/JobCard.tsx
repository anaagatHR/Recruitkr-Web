"use client";

import { Link, useNavigate } from "@/compat/router";
import { Briefcase, MapPin, Users } from "lucide-react";
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

export default function JobCard({ job }: { job: Job }) {
  const navigate = useNavigate();
  const fresh = isFresh(job.postedAt);
  const hot = (job.applicants ?? 0) >= 40;
  const skills = job.skills ?? [];
  const key = String(job.id ?? job.title ?? "");
  const accent = brandColor(key);

  // One ribbon only, strongest signal first: real demand beats an editorial
  // "featured" flag, which in turn beats "posted recently".
  const ribbon = hot
    ? { label: "High demand", className: "bg-orange-100 text-orange-600" }
    : job.featured
      ? { label: "Featured", className: "bg-primary/10 text-primary" }
      : fresh
        ? { label: "New today", className: "bg-secondary/15 text-secondary" }
        : null;

  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-border bg-card p-3 pt-3.5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.35)] sm:rounded-2xl"
    >
      {/* Top brand accent bar */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: accent }}
      />

      {/* Header. The status ribbon sits beside the logo instead of on its own
          row above it — one badge is all the card ever needs to carry, and the
          old dedicated row cost ~28px of height for it. */}
      <div className="flex items-start gap-2.5">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {displayInitial(job.company)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold leading-tight text-foreground group-hover:text-primary">
            {job.title}
          </h3>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <p className="truncate text-[11px] text-muted-foreground">{job.company}</p>
            {job.companyRating != null && (
              <StarRating value={job.companyRating} size={10} className="shrink-0" />
            )}
          </div>
        </div>
        {ribbon && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ribbon.className}`}
          >
            {ribbon.label}
          </span>
        )}
      </div>

      {/* Location / experience / openings on one line — `truncate` rather than
          wrapping, so a long location can't push the card taller. */}
      <div className="flex items-center gap-2 truncate text-[11px] text-muted-foreground">
        <span className="inline-flex shrink-0 items-center gap-1"><MapPin size={11} /> {job.location}</span>
        <span className="inline-flex shrink-0 items-center gap-1"><Briefcase size={11} /> {job.experience}</span>
        <span className="inline-flex shrink-0 items-center gap-1"><Users size={11} /> {job.openings}</span>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-nowrap gap-1 overflow-hidden">
          {skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Salary, age and the apply action share the final row — they used to be
          two stacked rows plus a full-width button, three lines for what fits
          on one. */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-2">
        <span className="min-w-0 truncate">
          <span className="block truncate text-xs font-semibold text-foreground">
            {salaryLabel(job.salaryMin, job.salaryMax)}
          </span>
          <span className="block text-[10px] text-muted-foreground">{relativeTime(job.postedAt)}</span>
        </span>
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
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ backgroundColor: accent }}
        >
          Apply
        </button>
      </div>
    </Link>
  );
}
