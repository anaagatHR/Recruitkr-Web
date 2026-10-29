"use client";

import { Link } from "@/compat/router";
import { Briefcase, CalendarClock, MapPin, Users } from "lucide-react";
import { daysUntilDeadline, displayCompany, pluralize, type Job } from "@/lib/jobs";
import { isFresh, relativeTime, salaryLabel } from "@/lib/format";
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
  const fresh = isFresh(job.postedAt);
  const hot = (job.applicants ?? 0) >= 40;
  const skills = job.skills ?? [];
  const company = displayCompany(job);
  const hasCompany = Boolean(job.company?.trim());
  const closesIn = daysUntilDeadline(job);
  // "Closes in 3 days" is only worth a badge when it's actually soon.
  const closingSoon = closesIn !== undefined && closesIn >= 0 && closesIn <= 7;
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
  const ribbon = closingSoon
    ? { label: closesIn === 0 ? "Closes today" : `Closes in ${pluralize(closesIn as number, "day")}`, className: "bg-rose-100 text-rose-700" }
    : hot
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
          {hasCompany ? displayInitial(job.company) : "?"}
        </div>
        <div className="min-w-0 flex-1">
          <Heading className="truncate text-sm font-bold leading-tight text-foreground group-hover:text-primary">
            {job.title}
            {/* A board listing six "Computer Operator" roles gave a screen
                reader six identically-named links to six different pages.
                Hidden text rather than an aria-label on purpose: a label would
                have to repeat the card's entire visible text or trip
                label-content-name-mismatch. */}
            <span className="sr-only">
              {` at ${company}`}
              {job.location ? `, ${job.location}` : ""}
            </span>
          </Heading>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <p className={`truncate text-xs ${hasCompany ? "text-muted-foreground" : "italic text-muted-foreground/80"}`}>{company}</p>
            {job.companyRating != null && (
              <StarRating value={job.companyRating} size={10} className="shrink-0" />
            )}
          </div>
        </div>
        {ribbon && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${ribbon.className}`}
          >
            {ribbon.label}
          </span>
        )}
      </div>

      {/* Location / experience / openings on one line — `truncate` rather than
          wrapping, so a long location can't push the card taller. */}
      <div className="flex items-center gap-2 truncate text-xs text-muted-foreground">
        <span className="inline-flex shrink-0 items-center gap-1"><MapPin size={12} /> {job.location}</span>
        <span className="inline-flex shrink-0 items-center gap-1"><Briefcase size={12} /> {job.experience}</span>
        <span className="inline-flex shrink-0 items-center gap-1" title={pluralize(job.openings, "opening")}>
          <Users size={12} /> {pluralize(job.openings, "opening")}
        </span>
        {closesIn !== undefined && closesIn > 7 && (
          <span className="inline-flex shrink-0 items-center gap-1"><CalendarClock size={12} /> {closesIn}d left</span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-nowrap gap-1 overflow-hidden">
          {skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground/80"
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
          <span className="block text-xs text-muted-foreground">{relativeTime(job.postedAt)}</span>
        </span>
        {/* The whole card is already the link to the job page, so this is a
            visual affordance, not a second control. It used to be a <button>
            that sent logged-out visitors straight to /login — a hard login
            wall before they had even read the role, and the single biggest
            drop-off the audit found. Now: read first, apply on the job page. */}
        <span
          aria-hidden="true"
          className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-lg"
          style={{ backgroundColor: accentOnWhiteText }}
        >
          View &amp; apply
        </span>
      </div>
    </Link>
  );
}
