"use client";
import { Target, GraduationCap, Rocket, Users, TrendingUp, HeartHandshake } from "lucide-react";

const pillars = [
  {
    icon: GraduationCap,
    title: "Free Skill Development",
    desc: "Industry-aligned training that turns freshers into job-ready professionals — at no cost.",
  },
  {
    icon: Rocket,
    title: "Real-World Experience",
    desc: "Internships, freelance gigs, and live projects that bridge the gap between education and industry.",
  },
  {
    icon: Users,
    title: "Equal Opportunity Access",
    desc: "Every candidate gets a fair shot — hiring based on proven ability, not just resumes.",
  },
  {
    icon: TrendingUp,
    title: "Career Growth Pathways",
    desc: "From first internship to full-time role, we support each step of the journey.",
  },
  {
    icon: HeartHandshake,
    title: "Trusted Connections",
    desc: "Verified companies and authentic job postings — no fake listings, no dead ends.",
  },
  {
    icon: Target,
    title: "Future-Ready Workforce",
    desc: "Preparing talent for the skills and roles that tomorrow's economy demands.",
  },
];

const GoalSection = () => {
  return (
    <section id="goal" className="py-12 sm:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Our Goal
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Building The Workforce Of Tomorrow
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            RecruitKR exists to close the gap between talent and opportunity. We
            help students and freshers gain real-world experience, connect skilled
            people with companies that need them, and build a future-ready
            workforce through opportunities, skill development, and career growth.
          </p>
        </div>

        {/* Tighter rows on a phone (smaller icon, one line of copy) so the set
            fits a screen; full padding and full copy from `sm` up. */}
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="card-hover flex items-center gap-3 rounded-xl border border-border bg-card p-2.5 sm:items-start sm:gap-4 sm:p-6"
            >
              <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary sm:p-3">
                <pillar.icon className="h-[18px] w-[18px] sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-bold leading-tight text-foreground sm:mb-1 sm:text-lg">
                  {pillar.title}
                </h3>
                <p className="mt-0.5 line-clamp-1 text-[11px] leading-[1.45] text-muted-foreground sm:mt-0 sm:line-clamp-none sm:text-sm">
                  {pillar.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GoalSection;
