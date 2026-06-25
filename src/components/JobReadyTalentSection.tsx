"use client";

import {
  type LucideIcon,
  UserPlus,
  FileCheck2,
  Award,
  GraduationCap,
  Target,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Users,
  ShieldCheck,
  Clock,
  Sparkles,
  ThumbsUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/compat/router";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

type Step = { icon: LucideIcon; title: string; description: string };
type Stat = { icon: LucideIcon; value: string; label: string };

const STEPS: Step[] = [
  {
    icon: UserPlus,
    title: "Candidate Joins RecruitKr",
    description:
      "Candidates create a professional profile, upload their resume, and share their skills, education, and career goals.",
  },
  {
    icon: FileCheck2,
    title: "Profile Optimization",
    description:
      "Our team reviews each profile, improves resume quality, and fills the gaps so employers receive a complete, professional profile.",
  },
  {
    icon: Award,
    title: "Skill Verification",
    description:
      "We evaluate technical skills, experience, certifications, and practical abilities to understand each candidate's real strengths.",
  },
  {
    icon: GraduationCap,
    title: "Training & Career Support",
    description:
      "Candidates receive interview preparation, resume coaching, and career guidance to maximise their chances of success.",
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description:
      "Our matching engine surfaces the best-fit roles based on skills, experience, salary expectations, and location.",
  },
  {
    icon: Briefcase,
    title: "Recommended to Employers",
    description:
      "Only suitable, job-ready candidates are recommended to you — cutting hiring time and lifting match quality.",
  },
  {
    icon: CalendarCheck,
    title: "Interview Coordination",
    description:
      "We schedule interviews, support candidates throughout, and keep communication flowing smoothly between both sides.",
  },
  {
    icon: CheckCircle2,
    title: "Successful Placement",
    description:
      "Our support continues until the candidate joins your company — a smooth hiring experience for everyone involved.",
  },
];

const STATS: Stat[] = [
  { icon: ShieldCheck, value: "100%", label: "Verified candidates" },
  { icon: Clock, value: "70%", label: "Faster hiring process" },
  { icon: Sparkles, value: "3×", label: "Better candidate quality" },
  { icon: ThumbsUp, value: "98%", label: "Employer satisfaction" },
];

/**
 * Employer-facing section explaining how RecruitKr prepares, verifies and
 * matches candidates before recommending them. Renders as a vertical timeline
 * on mobile and a connected horizontal flow on desktop.
 */
export default function JobReadyTalentSection() {
  return (
    <section className="relative overflow-hidden py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <Reveal as="div" className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#264a7f]">
            <Users size={13} /> Candidate Journey
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            How We Build{" "}
            <span className="bg-gradient-to-r from-[#264a7f] to-[#69a44f] bg-clip-text text-transparent">
              Job-Ready Talent
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            We don&apos;t just connect employers with candidates — we prepare, verify, and
            match every candidate to maximise hiring success.
          </p>
        </Reveal>

        {/* Timeline */}
        <RevealGroup
          stagger={0.07}
          className="relative mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((step, i) => (
            <RevealItem
              key={step.title}
              className="group relative flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-[#264a7f]/30 hover:shadow-[0_12px_30px_-12px_rgba(38,74,127,0.35)] sm:p-6"
            >
              {/* Step number */}
              <span className="absolute right-4 top-4 text-[2.5rem] font-extrabold leading-none text-foreground/5 transition-colors group-hover:text-[#264a7f]/10">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Icon */}
              <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#264a7f] to-[#69a44f] text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                <step.icon size={22} />
              </span>

              <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {/* Connector arrow — desktop only, between cards in a row */}
              {(i + 1) % 4 !== 0 && i !== STEPS.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-[#264a7f] lg:flex"
                >
                  <ArrowRight size={14} />
                </span>
              )}
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Statistics */}
        <RevealGroup
          stagger={0.08}
          className="mt-12 grid grid-cols-2 gap-3 rounded-3xl border border-border bg-muted/40 p-5 sm:mt-16 sm:grid-cols-4 sm:gap-5 sm:p-8"
        >
          {STATS.map((s) => (
            <RevealItem key={s.label} className="flex flex-col items-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#69a44f]/10 text-[#69a44f]">
                <s.icon size={20} />
              </span>
              <span className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                {s.value}
              </span>
              <span className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
                {s.label}
              </span>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* CTA */}
        <Reveal className="relative mt-12 overflow-hidden rounded-3xl bg-[#16305a] p-8 text-center sm:mt-16 sm:p-12">
          <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
          <div className="relative z-10">
            <h3 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Ready to Hire Better Talent?
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
              Discover pre-screened, job-ready candidates prepared to succeed in your
              organization.
            </p>
            <div className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
              <Link
                to="/signup/employer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#264a7f] shadow-sm transition hover:bg-white/95 sm:w-auto"
              >
                Hire Talent
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
              >
                Learn More
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
