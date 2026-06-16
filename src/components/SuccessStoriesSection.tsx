"use client";
import { Quote, Star, Sparkles, TrendingUp } from "lucide-react";

// Brand palette (navy / green / amber) — keep accents on-brand across cards.
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const stats = [
  { value: "10,000+", label: "Candidates Placed", color: NAVY },
  { value: "1,200+", label: "Hiring Companies", color: GREEN },
  { value: "500+", label: "Interns Trained", color: AMBER },
  { value: "94%", label: "Placement Satisfaction", color: NAVY },
];

const stories = [
  {
    name: "Priya Sharma",
    role: "Frontend Developer @ TechNova",
    initials: "PS",
    quote:
      "I had zero work experience after college. RecruitKR's free training and an internship got me a full-time developer role in four months.",
    tag: "Career Transformation",
    color: NAVY,
  },
  {
    name: "Aman Verma",
    role: "Founder, GigCraft Studio",
    initials: "AV",
    quote:
      "As a startup founder I needed skilled people fast and affordably. I hired my first three engineers through RecruitKR within two weeks.",
    tag: "Startup Founder",
    color: GREEN,
  },
  {
    name: "Neha Gupta",
    role: "Data Analyst @ FinEdge",
    initials: "NG",
    quote:
      "The real-world projects gave me a portfolio that actually got noticed. Employers responded — something that never happened on other platforms.",
    tag: "Candidate Success",
    color: AMBER,
  },
  {
    name: "Rahul Mehta",
    role: "Remote Backend Engineer",
    initials: "RM",
    quote:
      "I switched from a non-tech job to a remote engineering role. The structured path and genuine job postings made all the difference.",
    tag: "Career Transformation",
    color: NAVY,
  },
];

const SuccessStoriesSection = () => {
  return (
    <section id="success-stories" className="relative overflow-hidden border-y border-border py-24">
      {/* Decorative brand blobs */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: GREEN }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-10 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: AMBER }}
      />

      <div className="container relative mx-auto px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary animate-fade-up">
            <Sparkles size={14} /> Success Stories
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground animate-fade-up-delay-1 md:text-5xl">
            Real People,{" "}
            <span className="bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] bg-clip-text text-transparent">
              Real Careers
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground animate-fade-up-delay-2">
            From freshers landing their first job to founders building their teams — here is the
            impact RecruitKR is creating.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-16 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: stat.color }}
              >
                <TrendingUp size={20} />
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Stories */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {stories.map((story) => (
            <figure
              key={story.name}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: story.color }}
              />
              <Quote size={32} style={{ color: story.color }} className="mb-4 opacity-30" />
              <blockquote className="flex-1 text-base leading-relaxed text-foreground">
                “{story.quote}”
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: story.color }}
                >
                  {story.initials}
                </div>
                <figcaption className="min-w-0">
                  <div className="truncate font-bold text-foreground">{story.name}</div>
                  <div className="truncate text-sm text-muted-foreground">{story.role}</div>
                </figcaption>
                <div className="ml-auto flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
              <span
                className="mt-4 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: `${story.color}1a`, color: story.color }}
              >
                {story.tag}
              </span>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
