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
    <section id="success-stories" className="relative overflow-hidden border-y border-border py-28 bg-gradient-to-b from-white/80 to-transparent">
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
          <h1 className="text-4xl font-semibold tracking-tight text-foreground animate-fade-up-delay-1 md:text-5xl">
            Real People, Real Careers
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-2xl mx-auto animate-fade-up-delay-2">
            Success stories from candidates and companies who scaled faster with RecruitKr — validated outcomes and measurable impact.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group rounded-xl bg-white p-6 text-center shadow-sm ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: stat.color }}
              >
                <TrendingUp size={18} />
              </div>
              <div className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Stories */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <figure
              key={story.name}
              className="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: story.color }}
                >
                  {story.initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{story.name}</div>
                  <div className="truncate text-sm text-muted-foreground">{story.role}</div>
                </div>
                <div className="ml-auto flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                <Quote size={20} className="inline-block mr-2 -mt-1 text-muted-foreground" />
                {story.quote}
              </blockquote>

              <div className="mt-4 flex items-center justify-between">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ backgroundColor: `${story.color}1a`, color: story.color }}
                >
                  {story.tag}
                </span>
                <a href="#contact" className="text-sm font-medium text-primary hover:underline">
                  Read full story →
                </a>
              </div>
            </figure>
          ))}
        </div>

        {/* Call to action */}
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h3 className="text-xl font-semibold text-foreground">Want results like these?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Whether you&apos;re hiring or looking for a career change, RecruitKr partners with you to
            deliver measurable outcomes. Start a conversation today.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="#contact"
              className="rounded-full bg-gradient-to-r from-[#264a7f] to-[#69a44f] px-6 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95"
            >
              Get Started
            </a>
            <a
              href="/our-team"
              className="rounded-full border border-border px-6 py-2 text-sm font-semibold text-foreground hover:bg-card"
            >
              Speak to an Expert
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SuccessStoriesSection;
