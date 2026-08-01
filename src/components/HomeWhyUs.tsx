"use client";

import {
  ArrowRight,
  Globe,
  Heart,
  Layers,
  RefreshCcw,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/compat/router";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

/**
 * Condensed "why RecruitKr" block for the home page.
 *
 * The copy is lifted verbatim from `WhyRecruitkrSection` (the /why-us and
 * /about page) rather than rewritten — these are claims about what the company
 * offers, so the home page should not state them in stronger or different terms
 * than the page they come from. If a claim changes there, change it here too.
 *
 * What is deliberately NOT carried over is that section's stat row ("10,000+
 * successful placements", "500+ hiring partners", "98% client satisfaction").
 * The home page already runs its own numbers in `Placement` ("100+ candidates
 * placed", "50 hiring companies") and the two sets flatly contradict each
 * other. Putting both on one page would show the visitor 100+ and 10,000+
 * placements a screen apart.
 *
 * Layout note: every other home section is a centred header over a full-width
 * grid. This one splits — header pinned on the left, cards scrolling past on
 * the right — so the page has a change of rhythm at its midpoint instead of a
 * seventh identical stack, and so the "more than a job board" claim stays on
 * screen while the visitor reads the six things that back it up.
 */

const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const usps: { icon: LucideIcon; title: string; desc: string; color: string }[] = [
  {
    icon: ShieldCheck,
    title: "End-to-End HR Partner",
    desc: "Not just a job board — a complete HR ecosystem from recruitment to retention.",
    color: NAVY,
  },
  {
    icon: RefreshCcw,
    title: "Replacement Guarantee",
    desc: "We stand behind every placement with a confident replacement guarantee.",
    color: GREEN,
  },
  {
    icon: Globe,
    title: "Multi-Sector Expertise",
    desc: "Deep, specialised knowledge across 12+ industries and growing.",
    color: AMBER,
  },
  {
    icon: UserCog,
    title: "Dedicated Account Manager",
    desc: "A single, accountable point of contact for all your hiring needs.",
    color: NAVY,
  },
  {
    icon: Layers,
    title: "Flexible Staffing Models",
    desc: "Gig, full-time and contract — talent solutions for every business stage.",
    color: GREEN,
  },
  {
    icon: Heart,
    title: "People-First Approach",
    desc: "We care about careers and culture, not just filling seats.",
    color: AMBER,
  },
];

export default function HomeWhyUs() {
  return (
    <section className="relative overflow-hidden border-y border-slate-100 bg-slate-50 py-14 sm:py-20">
      {/* Two soft brand washes bleeding in from the edges — enough to stop the
          flat slate-50 band reading as a plain grey box, faint enough that the
          white cards keep their contrast. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#264a7f]/[0.07] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#e59f56]/[0.09] blur-3xl"
      />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-9 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.3fr)] lg:gap-14 xl:gap-20">
          {/* Sticky only from lg up: on a phone the column is just the header
              stacked above the cards, and pinning it there would eat the
              viewport the cards need. */}
          <Reveal as="div" className="text-center lg:sticky lg:top-28 lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#264a7f]/20 bg-[#264a7f]/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#264a7f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#264a7f]" />
              Why RecruitKr
            </span>
            <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-[2.6rem] lg:leading-[1.12]">
              More than a <span className="text-[#264a7f]">job board</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-base lg:mx-0">
              From recruitment to retention — what you get when you hire or job-hunt with us.
            </p>

            {/* Brand rule under the copy: centred with the text on mobile,
                anchored left once the column is. */}
            <span className="mx-auto mt-6 hidden h-1 w-16 rounded-full bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] lg:mx-0 lg:block" />

            <div className="mt-7 flex justify-center sm:mt-8 lg:justify-start">
              <Link
                to="/why-us"
                className="group inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#264a7f] px-7 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(38,74,127,0.9)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#1d3a66]"
              >
                More about how we work
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </Reveal>

          {/* On a phone each point is one compact row — icon left, title and a
              single line of copy right — so all six fit in about a screen.
              From `sm` up the same markup becomes the stacked card grid. */}
          <RevealGroup className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:gap-5">
            {usps.map((usp, i) => {
              const Icon = usp.icon;
              return (
                <RevealItem key={usp.title} className="h-full">
                  <div
                    style={{ "--accent": usp.color } as React.CSSProperties}
                    className="group relative flex h-full items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 transition-all duration-300 hover:-translate-y-1.5 hover:border-[color:var(--accent)] hover:shadow-[0_22px_45px_-26px_var(--accent)] sm:block sm:rounded-3xl sm:p-5"
                  >
                    {/* Accent wash that fades in from the top-right on hover —
                        the card picks up its own colour rather than every card
                        lighting up the same way. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[color:var(--accent)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-[0.14]"
                    />
                    {/* Index marker: gives the six cards a readable order and
                        fills the space beside the icon tile. Hidden on a phone,
                        where the row layout leaves it nowhere to sit without
                        colliding with the text. Decorative either way, so it's
                        hidden from assistive tech. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-4 top-3 hidden font-heading text-xl font-extrabold text-slate-900/[0.07] sm:block"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 sm:mb-3.5 sm:h-12 sm:w-12 sm:rounded-2xl"
                      style={{
                        backgroundColor: `${usp.color}14`,
                        color: usp.color,
                        boxShadow: `inset 0 0 0 1px ${usp.color}29`,
                      }}
                    >
                      <Icon className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" strokeWidth={2.1} />
                    </span>
                    <span className="relative min-w-0 flex-1 sm:block">
                      <h3 className="font-heading text-[13px] font-bold leading-tight text-slate-900 sm:text-base">
                        {usp.title}
                      </h3>
                      {/* One line on a phone, full text from `sm` up. */}
                      <p className="mt-0.5 line-clamp-1 text-[11px] leading-[1.45] text-slate-600 sm:mt-1.5 sm:line-clamp-none sm:text-sm sm:leading-6">
                        {usp.desc}
                      </p>
                    </span>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
