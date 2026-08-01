"use client";

import { ArrowRight, BadgeCheck, Clock, IndianRupee } from "lucide-react";
import { Link } from "@/compat/router";
import { Reveal } from "@/components/motion/Reveal";

// The two audiences the whole page has been talking to, given one door each.
const points = [
  { icon: BadgeCheck, text: "Every employer verified" },
  { icon: IndianRupee, text: "Free for job seekers" },
  { icon: Clock, text: "Apply in under a minute" },
];

export default function HomeClosingCta() {
  return (
    // The page used to end on the stats grid with nothing asking for the click.
    // A dark brand band closes it: after the logos, the categories, the numbers
    // and the stories, this is where a convinced visitor acts.
    <section className="bg-white py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal
          as="div"
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#1d3a64] via-[#264a7f] to-[#2f5b98] px-6 py-12 text-center shadow-2xl sm:rounded-[36px] sm:px-10 sm:py-16"
        >
          {/* Green bloom in the corner keeps the band from reading as a flat
              navy rectangle, and ties it to the logo's second colour. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#69a44f]/30 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#e59f56]/20 blur-3xl"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-heading text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
              Your next role is on the board right now
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:mt-4 sm:text-base">
              Browse verified openings across India, or tell us who you need and we&apos;ll bring the
              shortlist to you.
            </p>

            {/* Stacked on phones so each is a full-width thumb target. */}
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-9 sm:flex-row sm:items-center">
              <Link
                to="/jobs"
                className="sheen group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#69a44f] px-7 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-1"
              >
                Find a job
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/employers"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                Hire talent
              </Link>
            </div>

            <ul className="mt-8 flex flex-col items-center justify-center gap-3 text-sm text-white/70 sm:mt-10 sm:flex-row sm:gap-7">
              {points.map((point) => {
                const Icon = point.icon;
                return (
                  <li key={point.text} className="inline-flex items-center gap-2">
                    <Icon size={16} className="shrink-0 text-[#8fc772]" />
                    {point.text}
                  </li>
                );
              })}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
