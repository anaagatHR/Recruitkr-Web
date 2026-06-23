"use client";

import {
  ShieldCheck,
  RefreshCcw,
  Globe,
  UserCog,
  Layers,
  Target,
  Eye,
  Heart,
  Sparkles,
  ArrowRight,
  Briefcase,
  Building2,
  Users,
  Smile,
} from "lucide-react";
import { Link } from "@/compat/router";

// Brand palette (navy / green / amber) — keep accents on-brand across blocks.
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const stats = [
  { icon: Briefcase, value: "10,000+", label: "Successful placements", color: NAVY },
  { icon: Building2, value: "500+", label: "Hiring partners", color: GREEN },
  { icon: Globe, value: "12+", label: "Industries served", color: AMBER },
  { icon: Smile, value: "98%", label: "Client satisfaction", color: NAVY },
];

const usps = [
  { icon: ShieldCheck, title: "End-to-End HR Partner", desc: "Not just a job board — a complete HR ecosystem from recruitment to retention.", color: NAVY },
  { icon: RefreshCcw, title: "Replacement Guarantee", desc: "We stand behind every placement with a confident replacement guarantee.", color: GREEN },
  { icon: Globe, title: "Multi-Sector Expertise", desc: "Deep, specialised knowledge across 12+ industries and growing.", color: AMBER },
  { icon: UserCog, title: "Dedicated Account Manager", desc: "A single, accountable point of contact for all your hiring needs.", color: NAVY },
  { icon: Layers, title: "Flexible Staffing Models", desc: "Gig, full-time and contract — talent solutions for every business stage.", color: GREEN },
  { icon: Heart, title: "People-First Approach", desc: "We care about careers and culture, not just filling seats.", color: AMBER },
];

const story = [
  "RecruitKr was founded on a simple belief: hiring should be human, transparent and built for the long term.",
  "What began as a focused recruitment desk has grown into a full-service HR partner — helping companies across India find, hire and retain the right people, while giving candidates a fair, supportive path to their next role.",
  "Today we combine sector expertise, technology and a genuinely personal touch to deliver placements that last.",
];

const WhyRecruitkrSection = () => {
  return (
    <section id="why-us" className="relative overflow-hidden">
      {/* Decorative brand blobs */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: NAVY }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 h-80 w-80 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: GREEN }}
      />

      <div className="container relative mx-auto px-4">
        {/* Intro / mission */}
        <div className="mx-auto max-w-3xl py-20 text-center sm:py-24">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary animate-fade-up">
            <Sparkles size={14} /> About RecruitKr
          </p>
         <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl text-[#264a7f] animate-fade-up-delay-1">
  Your End-to-End Hiring &amp;{" "}
            <span className="bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] bg-clip-text text-transparent">
              HR Partner
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground animate-fade-up-delay-2">
            From recruitment to retention, we connect ambitious talent with verified companies across
            India — building careers and teams that grow together.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pb-20 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: stat.color }}
              >
                <stat.icon size={22} />
              </div>
              <p className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Our story */}
        <div className="grid items-center gap-10 pb-20 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Our Story</p>
          <h2 className="mb-5 text-3xl font-extrabold tracking-tight md:text-4xl text-[#264a7f]">
  Built for people, powered by trust
</h2>
            <div className="space-y-4">
              {story.map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Mission & Vision cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: NAVY }}
              >
                <Target size={22} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">Our Mission</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                To make hiring effortless and human — matching the right talent with the right
                opportunity, every single time.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:mt-8">
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: GREEN }}
              >
                <Eye size={22} />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">Our Vision</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                To be India&apos;s most trusted HR partner — where every placement builds a lasting
                career and a stronger company.
              </p>
            </div>
          </div>
        </div>

        {/* Our edge / values */}
        <div className="pb-20">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Our Edge</p>
           <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl text-[#264a7f]">
  Why companies &amp; candidates choose us
</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {usps.map((usp) => (
              <div
                key={usp.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ backgroundColor: usp.color }}
                />
                <div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: usp.color }}
                >
                  <usp.icon size={22} />
                </div>
                <h3 className="mb-1.5 text-lg font-bold text-foreground">{usp.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{usp.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
       <div className="relative mb-20 overflow-hidden rounded-[36px] bg-gradient-to-br from-[#264a7f] via-[#2f5c99] to-[#69a44f] px-6 py-14 text-center shadow-2xl sm:px-12 sm:py-20">

  {/* background glow effects */}
  <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
  <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-black/10 blur-3xl" />

  {/* subtle grid overlay */}
  <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:24px_24px]" />

  <div className="relative z-10">

    {/* badge */}
    <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold tracking-wider text-white backdrop-blur">
      Join RecruitKr Today
    </span>

    {/* heading */}
    <h2 className="mt-6 text-3xl font-extrabold leading-tight text-white md:text-5xl">
      Ready to build your future?
    </h2>

    {/* subtitle */}
    <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
      Whether you’re looking for a job or hiring talent, we help you grow faster with trusted opportunities and verified candidates.
    </p>

    {/* buttons */}
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

      <Link
        to="/jobs"
        className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-[#264a7f] shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      >
        Browse Jobs
        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
      </Link>

      <Link
        to="/contact"
        className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-8 py-3 text-sm font-bold text-white backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:bg-white/10"
      >
        Talk to us
      </Link>

    </div>

    {/* small trust line */}
    <p className="mt-8 text-xs text-white/60">
      Trusted by 500+ companies & 10,000+ professionals
    </p>

  </div>
</div>
      </div>
    </section>
  );
};

export default WhyRecruitkrSection;
