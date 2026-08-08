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

/**
 * The same three hues, darkened until white text on them clears WCAG AA (4.5:1).
 *
 * The bright originals stay on the decorative top bar, which carries no text.
 * But the avatar chip and the Apply button both set white 12px bold on the
 * accent, and at that size WCAG counts it as normal text, not large — the green
 * measured 2.99:1 and the amber 2.23:1, so both failed. Navy already passes at
 * 8.87:1 and is unchanged.
 */
const ON_ACCENT_SAFE: Record<string, string> = {
  "#264a7f": "#264a7f", // 8.87:1
  "#69a44f": "#53823f", // 2.99 -> 4.53:1
  "#e59f56": "#9c6c3a", // 2.23 -> 4.55:1
};

export default function JobCard({
  job,
  headingLevel = 3,
}: {
  job: Job;
  /**
   * The card's title tag. Defaults to h3, which is right when the card sits
   * under a section h2. Screens that put cards directly under the page h1 pass
   * 2, so the outline doesn't skip a level.
   */
  headingLevel?: 2 | 3;
}) {
  const Heading = (headingLevel === 2 ? "h2" : "h3") as "h2" | "h3";
  const navigate = useNavigate();
  const fresh = isFresh(job.postedAt);
  const hot = (job.applicants ?? 0) >= 40;
  const skills = job.skills ?? [];
  const key = String(job.id ?? job.title ?? "");
  const accent = brandColor(key);
  const accentOnWhiteText = ON_ACCENT_SAFE[accent] ?? accent;

  // One ribbon only, strongest signal first: real demand beats an editorial
  // "featured" flag, which in turn beats "posted recently".
  // The two tinted ribbons carry 10px text, which WCAG scores as normal size,
  // so the original orange-600 (3.11:1) and secondary green (2.58:1) both fell
  // short of 4.5:1 on their own tints. Darkened to clear AA.
  //
  // bg-orange-100 is a fixed light tint in both themes, so its text stays dark.
  // bg-secondary/15 tracks the theme, so the hardcoded dark green is scoped to
  // light mode and dark mode keeps the token.
  const ribbon = hot
    ? { label: "High demand", className: "bg-orange-100 text-orange-700" }
    : job.featured
      ? { label: "Featured", className: "bg-primary/10 text-primary" }
      : fresh
        ? { label: "New today", className: "bg-secondary/15 text-[#4d783a] dark:text-secondary" }
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
          style={{ backgroundColor: accentOnWhiteText }}
        >
          {displayInitial(job.company)}
        </div>
        <div className="min-w-0 flex-1">
          <Heading className="truncate text-sm font-bold leading-tight text-foreground group-hover:text-primary">
            {job.title}
          </Heading>
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
          style={{ backgroundColor: accentOnWhiteText }}
        >
          Apply
        </button>
      </div>
    </Link>
  );
}
