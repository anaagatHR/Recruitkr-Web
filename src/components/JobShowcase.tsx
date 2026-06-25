"use client";

import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Link } from "@/compat/router";

type RatingCard = { title: string; subtitle: string; jobCount: string; ctaLabel?: string; ctaLink?: string };

// Only the three logo colours are used here (navy, green, amber).
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const jobProfiles: RatingCard[] = [
  { title: "Corporate Jobs / Internship", subtitle: "Find office roles and paid internships", jobCount: "120+ jobs" },
  { title: "Work From Home", subtitle: "Remote roles for flexible schedules", jobCount: "80+ jobs" },
  { title: "Freelance Opportunities", subtitle: "Project-based work for self-starters", jobCount: "60+ jobs" },
  { title: "Gig / Part-time", subtitle: "Short-term and side-hustle roles", jobCount: "40+ jobs" },
  {
    title: "Other",
    subtitle: "Explore other job types and new opportunities",
    jobCount: "20+ jobs",
  },
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

  return (
    <>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] py-14 sm:py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(105,164,79,0.12),transparent_30%)]" />
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-primary">Opportunity categories</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Explore the latest job paths
            </h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Pick the role type that matches your goals and jump into the next step with confidence.
          </p>
        </div>

        <div className="mb-14 overflow-hidden">
          <div
            className="flex w-max gap-4"
            style={{ animation: "marquee 18s linear infinite", willChange: "transform" }}
          >
            {marqueeCards.map((card, index) => (
              <div
                key={`${card.title}-${index}`}
                className="group min-w-[280px] shrink-0 rounded-[24px] border border-border bg-white/90 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-base font-bold text-foreground">{card.title}</h3>
                  <span className="rounded-md bg-[#22c198]/15 px-2 py-0.5 text-[10px] font-semibold text-[#1a9c7a]">
                    Active
                  </span>
                </div>
                <p className="mb-3 text-xs leading-6 text-muted-foreground">{card.subtitle}</p>
                <JobCountBadge jobCount={card.jobCount} />
                {card.ctaLabel && card.ctaLink ? (
                  <div className="mt-5">
                    <Link
                      to={card.ctaLink}
                      className="inline-flex rounded-full bg-[#264a7f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f3f6d]"
                    >
                      {card.ctaLabel}
                    </Link>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 rounded-[32px] border border-border bg-white/80 p-4 shadow-sm sm:p-6">
          <div className="mb-6 max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-[#264a7f]">End-to-end support</p>
            <h3 className="text-2xl font-extrabold tracking-tight text-[#264a7f] sm:text-3xl">
              From Development to Deployment
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              A complete journey for hiring teams and job seekers — from discovering opportunities to managing growth with confidence.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {solutionCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </section>
    </>
  );
}