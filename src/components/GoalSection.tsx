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
    <section id="goal" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Our Goal
          </p>
          <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Building The Workforce Of Tomorrow
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            RecruitKR exists to close the gap between talent and opportunity. We
            help students and freshers gain real-world experience, connect skilled
            people with companies that need them, and build a future-ready
            workforce through opportunities, skill development, and career growth.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="card-hover flex items-start gap-4 rounded-xl border border-border bg-card p-6"
            >
              <div className="shrink-0 rounded-lg bg-primary/10 p-3 text-primary">
                <pillar.icon size={24} />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-foreground">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GoalSection;
