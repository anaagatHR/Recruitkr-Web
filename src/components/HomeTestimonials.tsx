"use client";

import { useState } from "react";
import { Youtube } from "lucide-react";
import YouTubeShorts from "@/components/YouTubeShorts";

// The home page used to stack three near-identical video rails back to back —
// two of them both titled "Success Stories". Same videos, one section: the
// visitor picks whose story they want instead of scrolling past three headers.
const TABS = [
  { key: "all", label: "All stories", blurb: "Every story from the RecruitKr community." },
  { key: "candidate", label: "Candidates", blurb: "Real people who landed their role through RecruitKr." },
  { key: "employer", label: "Employers", blurb: "What companies say about hiring with RecruitKr." },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function HomeTestimonials() {
  const [active, setActive] = useState<TabKey>("all");
  const current = TABS.find((t) => t.key === active) ?? TABS[0];

  return (
    <section className="overflow-hidden border-y border-slate-100 bg-slate-50 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF0000] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
          <Youtube size={14} /> In their own words
        </span>
        <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">
          Hear it from <span className="text-[#264a7f]">the people</span> who used it
        </h2>
        {/* Keyed so the blurb re-renders (and reads as new) when the tab flips. */}
        <p key={current.key} className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {current.blurb}
        </p>

        {/* Segmented control. Each button clears 40px so it stays a comfortable
            thumb target; the row scrolls rather than wraps on narrow phones. */}
        <div
          role="tablist"
          aria-label="Testimonial audience"
          className="mx-auto mt-7 inline-flex max-w-full gap-1 overflow-x-auto rounded-full border border-slate-200 bg-white p-1.5 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active === tab.key}
              onClick={() => setActive(tab.key)}
              className={`inline-flex min-h-[40px] shrink-0 items-center rounded-full px-4 text-sm font-semibold transition-colors duration-200 sm:px-5 ${
                active === tab.key
                  ? "bg-gradient-to-r from-[#264a7f] to-[#2f5b98] text-white shadow"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* key remounts the strip on tab change so it refetches for the new
          audience and resets its scroll position instead of showing the
          previous tab's videos while the request is in flight. */}
      <div className="mt-8 sm:mt-12">
        {/* fadeColor matches this section's slate-50 band, not the page white. */}
        <YouTubeShorts key={active} audience={active} embedded fadeColor="#f8fafc" />
      </div>
    </section>
  );
}
