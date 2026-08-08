"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, ListChecks, MessagesSquare } from "lucide-react";
import { Link } from "@/compat/router";
import { cn } from "@/lib/utils";
import { fetchJobsPage } from "@/lib/jobs";
import logoImage from "@/assets/logo-tagline.png";

/**
 * What the panel promises, beside the login / signup form.
 *
 * These are product capabilities that exist in the app (messaging, the
 * application step tracker, the verified flag on employers), not metrics — so
 * unlike a headline number they cannot go stale or overstate the marketplace.
 * The one real *number* on this panel is the live job count below, which is
 * read from the API at render time.
 */
const PROMISES = [
  { icon: BadgeCheck, label: "Verified employers", detail: "Every company checked before it can post" },
  { icon: MessagesSquare, label: "Talk to the hirer", detail: "Message the employer directly, no middleman" },
  { icon: ListChecks, label: "Know where you stand", detail: "Track each application stage in real time" },
];

/**
 * Live count of open roles.
 *
 * `null` until the request settles, and it stays `null` when the API is
 * unreachable — `fetchJobsPage` falls back to the fictional seed listings in
 * that case and flags them with `live: false`, so rendering its total would put
 * an invented number on the signup page. The stat is simply omitted instead.
 *
 * Deliberately requests a single row: we want `meta.total`, not the listings,
 * and the auth page should not pay for a full page of job data it never shows.
 */
function useLiveJobCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJobsPage(1, 1)
      .then(({ total, live }) => {
        if (!cancelled && live && total > 0) setCount(total);
      })
      .catch(() => {
        /* no count on this render — the panel reads fine without it */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

/**
 * Branded auth hero panel — animated drift gradient, decorative rings, the
 * RecruitKr wordmark, headline and what the product actually promises. Sits
 * beside the login / signup forms on large screens.
 */
export default function AuthHero({ className }: { className?: string }) {
  const jobCount = useLiveJobCount();

  return (
    <div
      className={cn(
        "relative flex min-h-[560px] flex-col justify-between overflow-hidden rounded-3xl bg-[#193156] p-8 text-white sm:p-10 lg:p-12",
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
        className="pointer-events-none absolute -right-24 -top-20 h-[320px] w-[320px] rounded-full border border-white/[0.07]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-20 h-[340px] w-[340px] rounded-full bg-white/[0.04]"
      />
      {/* Vignette: darkens the lower half so the promise list keeps its contrast
          wherever the drift gradient happens to be in its cycle. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#132743]/70 to-transparent"
      />

      {/* Brand. The wordmark art is navy on transparent, so it needs the same
          soft white chip the footer uses to read against a deep-navy panel —
          a bare <img> here would be nearly invisible. */}
      <Link
        to="/home"
        aria-label="RecruitKr home"
        className="relative z-10 flex w-fit items-center rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg ring-1 ring-white/50 transition-transform duration-200 hover:scale-[1.02]"
      >
        <img
          src={logoImage.src}
          alt="RecruitKr — Your Hiring Partner"
          loading="eager"
          decoding="async"
          className="block h-11 w-auto object-contain sm:h-12"
        />
      </Link>

      {/* Headline */}
      <div className="relative z-10 my-8 max-w-md">
        <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/75">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#69a44f]" />
          Befikr Hiring
        </p>
        {/*
         * `heading-plain` is load-bearing, not styling preference: index.css
         * paints every h1/h2 in the brand gradient, which runs navy -> green,
         * so on this navy panel the navy half of the headline renders invisible
         * and only "Job?" survives. See the utility's note in index.css.
         *
         * Devanagari matras also sit above the cap line, so this needs looser
         * leading than the Latin headings elsewhere — at leading-[1.08] the
         * ू in ढूंढ gets clipped by the line box.
         */}
        <h1 className="heading-plain font-heading text-4xl font-extrabold leading-[1.25] tracking-tight text-white sm:text-5xl">
          ढूंढ लिया Job?
        </h1>
        <p className="mt-3 text-xl font-bold text-[#cfdff7]">RecruitKr — Befikr.</p>
        <span aria-hidden className="mt-4 block h-1 w-16 rounded-full bg-[#69a44f]" />
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/90">
          Verified jobs, real company ratings, and end-to-end hiring — connecting candidates with
          startups, MSMEs and enterprises across India.
        </p>
      </div>

      {/* What you get, plus the live role count when the board is reachable. */}
      <div className="relative z-10">
        {jobCount !== null && (
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/15 backdrop-blur-sm">
            <span aria-hidden className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#69a44f] opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#69a44f]" />
            </span>
            <span className="tabular-nums text-white">{jobCount.toLocaleString("en-IN")}</span>
            <span className="font-medium text-white/85">roles open right now</span>
          </p>
        )}

        <ul className="space-y-3.5">
          {PROMISES.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15"
              >
                <Icon className="h-4 w-4 text-[#cfdff7]" strokeWidth={2.25} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-tight text-white">{label}</span>
                <span className="block text-xs leading-relaxed text-white/80">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
