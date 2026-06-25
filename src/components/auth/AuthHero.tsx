"use client";

import { Link } from "@/compat/router";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "12k+", label: "Verified jobs" },
  { value: "3.5k+", label: "Hiring companies" },
  { value: "4.6★", label: "Avg. rating" },
];

/**
 * Branded auth hero panel (from the RecruitKr design) — the animated drift
 * gradient with decorative rings, logo, headline and trust stats. Used beside
 * the login / signup forms.
 */
export default function AuthHero({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-3xl bg-[#193156] p-8 text-white sm:p-10 lg:p-12",
        className,
      )}
    >
      {/* Animated drift gradient */}
      <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
      {/* Decorative rings (from the design) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-44 h-[520px] w-[520px] rounded-full border border-white/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-[340px] w-[340px] rounded-full bg-white/[0.04]"
      />

      {/* Brand */}
      <Link to="/" className="relative z-10 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-extrabold text-[#264a7f]">
          R
        </span>
        <span className="text-xl font-extrabold tracking-tight">RecruitKr</span>
      </Link>

      {/* Headline */}
      <div className="relative z-10 max-w-md">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-white/60">Befikr Hiring</p>
        <h1 className="font-heading text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
          ढूंढ लिया Job?
        </h1>
        <p className="mt-2 text-xl font-bold text-[#bcd0ee]">RecruitKr — Befikr.</p>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
          Verified jobs, real company ratings, and end-to-end hiring — connecting candidates with
          startups, MSMEs and enterprises across India.
        </p>
      </div>

      {/* Trust stats */}
      <div className="relative z-10 flex gap-8">
        {STATS.map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-extrabold sm:text-3xl">{s.value}</div>
            <div className="text-xs font-medium text-white/65">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
