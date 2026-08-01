"use client";

import { Quote, Star } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️  NEEDS REAL DATA — this section renders NOTHING until you fill it in.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The section is built and styled; the only thing missing is the content. It is
 * intentionally left empty rather than filled with plausible-looking sample
 * reviews, because anything written here ships to the front page of a live
 * recruitment site and reads as genuine social proof from real people.
 *
 * There is no rating data anywhere in the product to draw on: the backend has
 * no review/rating model or endpoint, and the star ratings elsewhere in the app
 * (`seedCompanies` in src/lib/jobs.ts, the `REVIEWS` array in ForEmployers,
 * "4.6★" in ForCandidates) are all hardcoded placeholders, not measurements.
 * Copying those here would spread invented numbers, not source them.
 *
 * TO TURN THIS SECTION ON
 *   1. Set `overallRating` and `totalReviews` to your real figures, or leave
 *      them `null` to hide the summary badge and show only the quotes.
 *   2. Add real, attributable entries to `reviews` — each one from a person who
 *      actually said it and is happy to be named on the site.
 *
 * The section appears automatically once `reviews` is non-empty.
 *
 * If the reviews ever become dynamic, replace the constant with a fetch and
 * keep the same "render nothing when empty" guard at the bottom.
 */

const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";
const ACCENTS = [NAVY, GREEN, AMBER];

/** Real average out of 5, or null to hide the summary badge. */
const overallRating: number | null = null;

/** Real number of reviews behind that average, or null. */
const totalReviews: number | null = null;

type Review = {
  /** The reviewer's own words. Do not paraphrase or tidy. */
  quote: string;
  /** Person's name as they agreed to be credited. */
  name: string;
  /** e.g. "Placed as Backend Developer" or "HR Lead, <company>". */
  role: string;
  /** Their rating out of 5. Omit if they didn't give one. */
  rating?: number;
};

const reviews: Review[] = [
  // Example of the shape — delete this comment and add real entries:
  // {
  //   quote: "…",
  //   name: "…",
  //   role: "…",
  //   rating: 5,
  // },
];

function Stars({ value, label }: { value: number; label?: string }) {
  // Rounded to the nearest whole star: there is no half-star glyph here, and
  // rounding up a 4.4 to five filled stars would overstate it.
  const filled = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={label ?? `${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
          style={{ color: AMBER }}
          fill={i < filled ? AMBER : "none"}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

export default function HomeReviews() {
  // The guard that keeps invented content off the page. See the header note.
  if (reviews.length === 0) return null;

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e59f56]/25 bg-[#e59f56]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c07c33]">
            <Star size={13} fill="currentColor" />
            Ratings &amp; reviews
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">
            What people <span className="text-[#e59f56]">rate us</span>
          </h2>

          {overallRating !== null && (
            <div className="mt-4 inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
              <span className="font-heading text-xl font-extrabold text-slate-900 sm:text-2xl">
                {overallRating.toFixed(1)}
              </span>
              <Stars value={overallRating} label={`Average rating ${overallRating} out of 5`} />
              {totalReviews !== null && (
                <span className="text-xs text-slate-500 sm:text-sm">
                  {totalReviews.toLocaleString("en-IN")} reviews
                </span>
              )}
            </div>
          )}
        </Reveal>

        <RevealGroup className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {reviews.map((review, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            return (
              <RevealItem key={`${review.name}-${index}`} className="h-full">
                <figure
                  style={{ "--accent": accent } as React.CSSProperties}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--accent)] hover:shadow-[0_18px_40px_-24px_var(--accent)] sm:rounded-3xl sm:p-6"
                >
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[color:var(--accent)]" />
                  <Quote
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-3 h-8 w-8 text-slate-900/[0.05] sm:h-10 sm:w-10"
                  />

                  {review.rating !== undefined && (
                    <Stars value={review.rating} label={`${review.rating} out of 5`} />
                  )}

                  <blockquote className="mt-2.5 text-[12.5px] leading-relaxed text-slate-700 sm:text-sm sm:leading-6">
                    “{review.quote}”
                  </blockquote>

                  <figcaption className="mt-auto flex items-center gap-2.5 pt-4">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold sm:h-10 sm:w-10 sm:text-sm"
                      style={{ backgroundColor: `${accent}14`, color: accent }}
                    >
                      {review.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-slate-900 sm:text-sm">
                        {review.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500 sm:text-xs">
                        {review.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
