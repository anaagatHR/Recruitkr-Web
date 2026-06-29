"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { useState } from "react";
import { Link } from "@/compat/router";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

type RatingCard = { title: string; subtitle: string; jobCount: string; ctaLabel?: string; ctaLink?: string };

// Only the three logo colours are used here (navy, green, amber).
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const jobProfiles: RatingCard[] = [
  { title: "Corporate Jobs / Internship", subtitle: "Find office roles and paid internships", jobCount: "120+ jobs" },
  { title: "Work From Home", subtitle: "Remote roles for flexible schedules", jobCount: "80+ jobs" },
  { title: "Freelance Opportunities", subtitle: "Project-based work for self-starters", jobCount: "60+ jobs" },
  { title: "Internship", subtitle: "Short-term and side-hustle roles", jobCount: "40+ jobs" },
  { title: "Gig / Part-time", subtitle: "Short-term and side-hustle roles", jobCount: "40+ jobs" },
  { title: "other", subtitle: "Short-term and side-hustle roles", jobCount: "40+ jobs" },
];

const solutionCards: { title: string; description: string; bullets: string[]; icon: LucideIcon; accent: string }[] = [
  {
    title: "Access",
    description: "Open doors to curated opportunities with instant visibility across hiring channels.",
    bullets: ["Talent discovery", "Fast onboarding", "Smart matching"],
    icon: ShieldCheck,
    accent: NAVY,
  },
  {
    title: "Train",
    description: "Build workforce confidence with guided learning, skill development and readiness support.",
    bullets: ["Skill roadmaps", "Career coaching", "Interview prep"],
    icon: BookOpen,
    accent: GREEN,
  },
  {
    title: "Recruit",
    description: "Hire faster with structured pipelines, quality screening and recruiter-first workflows.",
    bullets: ["Shortlisting", "Candidate tracking", "Seamless outreach"],
    icon: BriefcaseBusiness,
    accent: AMBER,
  },
  {
    title: "Manage",
    description: "Stay in control with performance insights, team coordination and growth planning.",
    bullets: ["Progress tracking", "Team visibility", "Retention planning"],
    icon: BarChart3,
    accent: NAVY,
  },
];

function JobCountBadge({ jobCount }: { jobCount: string }) {
  return (
    <div className="inline-flex items-center rounded-full bg-[#264a7f]/10 px-3 py-1 text-xs font-semibold text-[#264a7f]">
      {jobCount}
    </div>
  );
}

export default function JobShowcase() {
  const marqueeCards = [...jobProfiles, ...jobProfiles];
  const [paused, setPaused] = useState(false);

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] py-14 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(105,164,79,0.12),transparent_30%)]" />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Opportunity categories</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Find the Right Job Today
            </h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground font-bold">
            Choose your role and start your job search today.
          </p>
        </Reveal>

        <div
          className="mb-14 overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="flex w-max gap-4"
            style={{
              animation: "marquee 18s linear infinite",
              animationPlayState: paused ? "paused" : "running",
              willChange: "transform",
            }}
          >
            {marqueeCards.map((card, index) => (
              <Link
                key={`${card.title}-${index}`}
                to="/employers"
                aria-label={`${card.title} — for employers`}
                className="group/card relative flex min-w-[264px] shrink-0 flex-col overflow-hidden rounded-3xl border border-border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-[#264a7f]/40 hover:shadow-xl sm:min-w-[288px]"
              >
                {/* soft hover glow */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[#69a44f]/15 opacity-0 blur-2xl transition-opacity duration-300 group-hover/card:opacity-100"
                />
                <div className="relative mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#264a7f]/10 text-[#264a7f] transition-colors duration-300 group-hover/card:bg-[#264a7f] group-hover/card:text-white">
                    <BriefcaseBusiness size={20} />
                  </span>
                  <span className="rounded-full bg-[#22c198]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1a9c7a]">
                    Active
                  </span>
                </div>
                <h3 className="relative text-base font-bold text-foreground">{card.title}</h3>
                <p className="relative mb-4 mt-1.5 text-xs leading-6 text-muted-foreground">{card.subtitle}</p>
                <div className="relative mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-4">
                  <JobCountBadge jobCount={card.jobCount} />
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#264a7f]">
                    Get started
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#264a7f] text-white transition-transform group-hover/card:translate-x-0.5">
                      <ArrowRight size={14} />
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-2 rounded-[32px] border border-border bg-white/80 p-4 shadow-sm sm:p-6">
          <div className="mb-6 max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#264a7f]">End-to-end support</p>
            <h3 className="text-2xl font-extrabold tracking-tight text-[#264a7f] sm:text-3xl">
              From Development to Deployment
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground font-bold">
              Helping job seekers find jobs and employers hire the right people.
            </p>
          </div>

          <RevealGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {solutionCards.map((card) => {
              const Icon = card.icon;
              return (
                <RevealItem
                  key={card.title}
                  className="group rounded-[24px] border border-border bg-slate-50/80 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: card.accent }}>
                      <Icon size={18} />
                    </div>
                    <h4 className="text-lg font-bold text-foreground">{card.title}</h4>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{card.description}</p>

                  <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                    {card.bullets.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: card.accent }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}