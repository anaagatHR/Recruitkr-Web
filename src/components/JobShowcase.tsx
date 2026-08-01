"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  Laptop,
  Rocket,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import Image from "next/image";
import { useEffect, useRef, type CSSProperties } from "react";
import { Link } from "@/compat/router";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

type RatingCard = {
  title: string;
  subtitle: string;
  jobCount: string;
  icon: LucideIcon;
  accent: string;
  href: string;
  image: string;
};

// Only the three logo colours are used here (navy, green, amber).
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

// Each card lands on the jobs list already filtered for its category — the
// `type` / `mode` params are read by JobsScreen, same as `search`.
const jobProfiles: RatingCard[] = [
  { title: "Corporate Jobs / Internship", subtitle: "Find office roles and paid internships", jobCount: "120+ jobs", icon: Building2, accent: NAVY, href: "/jobs?type=Full-time", image: "/assets/hero-team-1.jpg" },
  { title: "Work From Home", subtitle: "Remote roles for flexible schedules", jobCount: "80+ jobs", icon: Laptop, accent: GREEN, href: "/jobs?mode=Remote", image: "/assets/hero-team-2.jpg" },
  { title: "Freelance Opportunities", subtitle: "Project-based work for self-starters", jobCount: "60+ jobs", icon: Rocket, accent: AMBER, href: "/jobs?type=Contract", image: "/assets/hero-team-3.jpg" },
  { title: "Internship", subtitle: "Paid internships to kick-start your career", jobCount: "40+ jobs", icon: GraduationCap, accent: NAVY, href: "/jobs?type=Internship", image: "/assets/hero-team-4.jpg" },
  { title: "Gig / Part-time", subtitle: "Short-term and side-hustle roles", jobCount: "40+ jobs", icon: Clock, accent: GREEN, href: "/jobs?type=Part-time", image: "/assets/hero-bg.jpg" },
  { title: "Other", subtitle: "Explore more ways to work", jobCount: "40+ jobs", icon: Sparkles, accent: AMBER, href: "/jobs", image: "/assets/hero-team-2.jpg" },
];

// `short` is the phone copy. The four stages have to fit one viewport there, so
// rather than clamping the full sentence and cutting it mid-thought, each stage
// carries a written-short version that still says something on its own.
const solutionCards: {
  title: string;
  description: string;
  short: string;
  bullets: string[];
  icon: LucideIcon;
  accent: string;
}[] = [
  {
    title: "Access",
    description: "Open doors to curated opportunities with instant visibility across hiring channels.",
    short: "Curated openings, visible across every hiring channel.",
    bullets: ["Talent discovery", "Fast onboarding", "Smart matching"],
    icon: ShieldCheck,
    accent: NAVY,
  },
  {
    title: "Train",
    description: "Build workforce confidence with guided learning, skill development and readiness support.",
    short: "Guided learning that gets people job-ready.",
    bullets: ["Skill roadmaps", "Career coaching", "Interview prep"],
    icon: BookOpen,
    accent: GREEN,
  },
  {
    title: "Recruit",
    description: "Hire faster with structured pipelines, quality screening and recruiter-first workflows.",
    short: "Structured pipelines and screening that hire faster.",
    bullets: ["Shortlisting", "Candidate tracking", "Seamless outreach"],
    icon: BriefcaseBusiness,
    accent: AMBER,
  },
  {
    title: "Manage",
    description: "Stay in control with performance insights, team coordination and growth planning.",
    short: "Performance insight and planning after the hire.",
    bullets: ["Progress tracking", "Team visibility", "Retention planning"],
    icon: BarChart3,
    accent: NAVY,
  },
];

function JobCountBadge({ jobCount, accent }: { jobCount: string; accent: string }) {
  return (
    <div
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${accent}1a`, color: accent }}
    >
      {jobCount}
    </div>
  );
}

function CategoryCard({ card }: { card: RatingCard }) {
  const Icon = card.icon;
  return (
    <Link
      to={card.href}
      aria-label={`${card.title} — ${card.jobCount}`}
      style={{ "--accent": card.accent } as CSSProperties}
      className="group/card relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-[color:var(--accent)] hover:shadow-[0_20px_45px_-20px_var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 sm:rounded-3xl"
    >
      {/* Photo header. The gradient is what keeps the white badge and the icon
          legible — these are candid photos, so their top-right corner can be
          any brightness. The image scales slightly on hover, the card itself
          lifts; both are cheap transforms, no layout work. */}
      <div className="relative h-32 w-full shrink-0 overflow-hidden sm:h-36">
        <Image
          src={card.image}
          alt=""
          aria-hidden
          fill
          sizes="(max-width: 640px) 80vw, 340px"
          className="object-cover object-center transition-transform duration-500 group-hover/card:scale-105"
        />
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25"
        />
        {/* Accent wash in the card's own colour, so the six cards stay a set
            rather than six unrelated photos. */}
        <span
          aria-hidden
          className="absolute inset-0 opacity-45 mix-blend-multiply transition-opacity duration-300 group-hover/card:opacity-25"
          style={{ backgroundColor: card.accent }}
        />

        <div className="absolute right-3 top-3">
          <JobCountBadge jobCount={card.jobCount} accent={card.accent} />
        </div>

        {/* Icon badge straddles the photo edge and ties the header to the body. */}
        <span
          className="absolute -bottom-5 left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/70 shadow-md transition-transform duration-300 group-hover/card:scale-110 sm:h-12 sm:w-12 sm:rounded-2xl"
          style={{ backgroundColor: "#fff", color: card.accent }}
        >
          <Icon size={22} />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-8 sm:p-5 sm:pt-9">
        <h3 className="font-bold text-slate-900 transition-colors duration-200 group-hover/card:text-[color:var(--accent)] text-base sm:text-lg">
          {card.title}
        </h3>
        <p className="mb-4 mt-1.5 text-sm leading-6 text-slate-500">{card.subtitle}</p>

        {/* mt-auto keeps the footer rows aligned across cards when a subtitle wraps. */}
        <span
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: card.accent }}
        >
          Browse roles
          <ArrowRight size={15} className="transition-transform duration-200 group-hover/card:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

// Continuously auto-scrolling rail. The list is rendered twice and the scroll
// position wraps at the halfway mark, so the loop is seamless — there is never
// a visible jump back to the start.
//
// It drives scrollLeft on a real overflow container rather than animating a
// transform, which is what keeps it swipeable: a drag, a trackpad gesture or an
// arrow click all just move the same scroll position, and the auto-scroll picks
// up from wherever the visitor left it. That also rules out CSS scroll-snap —
// snap-mandatory would fight the sub-pixel steps and yank the row back.
const AUTO_SCROLL_PX_PER_FRAME = 0.6;

function CategoryRail({ cards }: { cards: RatingCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Held in a ref, not state: the animation loop reads it every frame and must
  // not re-run the effect (or re-render the six cards) when it flips.
  const pausedRef = useRef(false);

  const setPaused = (value: boolean) => {
    pausedRef.current = value;
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    // Honour the OS "reduce motion" setting — an endlessly moving row is
    // exactly the kind of thing that setting exists to stop. The rail stays
    // scrollable by hand.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // The position is accumulated here as a float rather than read back off the
    // element each frame. scrollLeft reads back rounded in several browsers, so
    // "scrollLeft = scrollLeft + 0.6" can round straight back to where it
    // started every frame and the rail sits dead still. Keeping our own float
    // means sub-pixel steps always accumulate into whole pixels.
    let position = el.scrollLeft;
    // What we last wrote, so a real user scroll can be told apart from the
    // rounding of our own write and the accumulator resynced to it.
    let lastWritten = position;
    let frame: number;

    const step = () => {
      // scrollWidth covers both copies, so half of it is one full list.
      const half = el.scrollWidth / 2;

      if (Math.abs(el.scrollLeft - lastWritten) > 2) {
        // The visitor swiped or hit an arrow — carry on from where they are.
        position = el.scrollLeft;
      }

      if (!pausedRef.current && half > 0) {
        position += AUTO_SCROLL_PX_PER_FRAME;
        // Subtracting rather than resetting to 0 keeps the fractional
        // remainder, so the wrap lands mid-card and reads as continuous.
        if (position >= half) position -= half;
        el.scrollLeft = position;
        lastWritten = el.scrollLeft;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = (el.firstElementChild as HTMLElement | null)?.offsetWidth ?? el.clientWidth;
    el.scrollBy({ left: direction * (step + 16), behavior: "smooth" });
  };

  return (
    <div
      role="region"
      // The visible heading is gone, so the rail names itself for screen
      // readers and shows up in the landmark list.
      aria-label="Opportunity categories"
      className="group/rail relative"
      // Pause while the visitor is reading or interacting — a card sliding out
      // from under the cursor mid-click is the classic marquee failure.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Both fades stay on: the row loops, so there is always more in each
          direction. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white to-transparent sm:w-12"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent sm:w-12"
      />

      <div
        ref={trackRef}
        // px-4 -mx-4 lets the cards bleed to the screen edge on a phone while
        // still starting flush with the section's own gutter.
        className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Second pass is presentational only — aria-hidden so the six
            categories aren't announced twice, and inert so tabbing doesn't walk
            through duplicate links. */}
        {[0, 1].flatMap((copy) =>
          cards.map((card) => (
            <div
              key={`${copy}-${card.title}`}
              aria-hidden={copy === 1}
              className="w-[78vw] max-w-[320px] shrink-0 sm:w-[320px]"
              {...(copy === 1 ? { inert: "" as unknown as boolean } : {})}
            >
              <CategoryCard card={card} />
            </div>
          )),
        )}
      </div>

      {/* Arrows are pointer-device affordances — on touch you just swipe, and
          they'd only cover the cards. They never disable now: the row loops, so
          there is no end to reach. */}
      <div className="mt-5 hidden items-center justify-center gap-3 sm:flex">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Previous categories"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#264a7f] hover:text-[#264a7f]"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Next categories"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#264a7f] hover:text-[#264a7f]"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function JobShowcase() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* No heading above the rail: the cards carry their own titles and the
            photos say what they are, so the eyebrow/headline/subtitle block was
            three lines of text restating them. The rail names itself for
            assistive tech with aria-label instead, and the section still has a
            heading further down for the four support stages.

            The CTA takes the heading's place — it's the one bit of text in the
            section, and sitting on top it reads as the opener rather than
            something you only reach after the cards. */}
        <div className="mb-8 flex justify-center sm:mb-10">
          <Link
            to="/jobs"
            className="sheen inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#264a7f] via-[#2f5b98] to-[#69a44f] px-7 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-1"
          >
            Browse all jobs
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mb-12 sm:mb-14">
          <CategoryRail cards={jobProfiles} />
        </div>

        {/* Access → Train → Recruit → Manage is a sequence, not four unrelated
            services, so each stage is numbered and the four sit on one
            connector line at desktop width.

            The layout is driven by the phone case: stacked full-width cards ran
            well past one viewport, so on mobile this is a 2×2 grid of compact
            tiles — short copy, bullets collapsed to a single dot-separated line
            — which fits under the heading without scrolling. From `sm` up the
            tiles get the full sentence and the bullets become chips. */}
        <div className="mt-2 border-t border-slate-200 pt-10 sm:pt-16">
          <Reveal as="div" className="mx-auto max-w-2xl text-center">
            <h3 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              From <span className="text-[#264a7f]">Development</span> to{" "}
              <span className="text-[#69a44f]">Deployment</span>
            </h3>
            <p className="mx-auto mt-2.5 max-w-xl text-[13px] leading-relaxed text-slate-600 sm:mt-3 sm:text-base">
              Helping job seekers find jobs and employers hire the right people.
            </p>
          </Reveal>

          <RevealGroup className="relative mt-6 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4 lg:gap-6">
            {/* Desktop connector. It's drawn behind the tiles, which are opaque,
                so it only shows through the gaps between them — reads as one
                line threading the four stages rather than a rule across the
                cards. top-[52px] lands on the icon badge's centre. */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-[52px] hidden h-px bg-gradient-to-r from-[#264a7f]/30 via-[#69a44f]/40 to-[#e59f56]/30 lg:block"
            />

            {solutionCards.map((card, index) => {
              const Icon = card.icon;

              return (
                // The motion wrapper stays outside the card: framer-motion
                // writes an inline `transform` for the entrance animation,
                // which would win over a Tailwind hover:-translate on the same
                // element. Two elements, two transforms, no fight.
                <RevealItem key={card.title} className="relative z-10 h-full">
                  <div
                    style={{ "--accent": card.accent } as CSSProperties}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-3.5 ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_var(--accent)] hover:ring-[color:var(--accent)] sm:rounded-3xl sm:p-5"
                  >
                    {/* Accent cap — the one place each stage's colour reads at
                        full strength, so the four are distinguishable at a
                        glance without tinting the whole tile. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-1 bg-[color:var(--accent)]"
                    />
                    {/* Step number as a watermark: carries the order without
                        spending a row of vertical space on a badge. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-1 top-0 font-heading text-5xl font-extrabold leading-none text-slate-900/[0.045] sm:text-6xl"
                    >
                      {index + 1}
                    </span>

                    <span
                      className="mb-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 sm:mb-3.5 sm:h-12 sm:w-12 sm:rounded-2xl"
                      style={{ backgroundColor: `${card.accent}14`, color: card.accent }}
                    >
                      <Icon className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" />
                    </span>

                    <h4 className="font-heading text-[15px] font-bold text-slate-900 sm:text-lg">
                      {card.title}
                    </h4>

                    <p className="mt-1 text-[11.5px] leading-[1.45] text-slate-600 sm:hidden">
                      {card.short}
                    </p>
                    <p className="mt-1.5 hidden text-sm leading-6 text-slate-600 sm:block">
                      {card.description}
                    </p>

                    {/* Same three phrases either way — a dot-separated line on
                        a phone, where three chips in a half-width column would
                        wrap to three rows, and chips from `sm` up where they
                        fit. */}
                    <p className="mt-2 text-[10.5px] leading-[1.5] text-slate-400 sm:hidden">
                      {card.bullets.join(" · ")}
                    </p>
                    <ul className="mt-auto hidden flex-wrap gap-1.5 pt-3 sm:flex">
                      {card.bullets.map((item) => (
                        <li
                          key={item}
                          className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-slate-700"
                          style={{ borderColor: `${card.accent}33`, backgroundColor: `${card.accent}0f` }}
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
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