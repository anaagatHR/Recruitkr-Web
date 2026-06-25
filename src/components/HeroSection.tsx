"use client";
import { ArrowRight, BriefcaseBusiness, Search, Sparkles, Users } from "lucide-react";
import { useNavigate } from "@/compat/router";
import TypingText from "@/components/TypingText";
import { useState } from "react";

const heroPhrases = [
  "ढूंढ लिया Job?",
  "Found your dream Job?",
  "नौकरी मिल गई?",
  "Your next Job is here",
];

const quickStats = [
  { label: "Active openings", value: "500+" },
  { label: "Trusted companies", value: "100+" },
  { label: "Career support", value: "24/7" },
];

const heroBadges = ["Remote jobs", "Internships", "Freelance", "Part-time"];

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const goSearch = () => {
    navigate(query.trim() ? `/jobs?search=${encodeURIComponent(query.trim())}` : "/jobs");
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-slate-950 py-24 sm:py-28 lg:min-h-[calc(100svh-4rem)] lg:py-32">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/hero-bg.jpg"
        className="absolute inset-0 h-full w-full object-cover object-center"
      >
        <source src="/assets/hero.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(105,164,79,0.24),transparent_35%),linear-gradient(115deg,rgba(0,0,0,0.92),rgba(0,0,0,0.65))]" />
      <div className="absolute left-[-8%] top-[-8%] h-40 w-40 rounded-full bg-[#69a44f]/30 blur-3xl animate-blob" />
      <div className="absolute bottom-[-8%] right-[-4%] h-56 w-56 rounded-full bg-[#e59f56]/25 blur-3xl animate-blob-delayed" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 shadow-lg backdrop-blur">
              <Sparkles size={16} className="text-[#e59f56]" />
              Hire faster. Grow smarter.
            </div>

            <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-7xl">
              Discover your next <span className="text-gradient-teal">career move</span>
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-200 sm:text-xl">
              RecruitKr helps you find the right opportunities, from corporate roles to internships, remote work, freelance gigs and more.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button
                type="button"
                onClick={goSearch}
                className="inline-flex items-center gap-2 rounded-full bg-[#69a44f] px-6 py-3 text-sm font-semibold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-[#5a8d3d]"
              >
                Explore jobs <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white/90 backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/20"
              >
                Talk to us
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {heroBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-white/80 backdrop-blur">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-xl">
            <div className="glass-panel relative overflow-hidden rounded-[32px] border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
                  <BriefcaseBusiness size={16} className="text-[#e59f56]" />
                  <TypingText phrases={heroPhrases} />
                </div>

                <div className="mt-5 rounded-2xl border border-white/15 bg-slate-950/50 p-3 shadow-inner backdrop-blur sm:p-4">
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-3">
                    <Search size={18} className="shrink-0 text-white/70" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && goSearch()}
                      placeholder="Search jobs, skills or companies"
                      className="w-full min-w-0 bg-transparent py-1 text-sm text-white outline-none placeholder:text-white/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={goSearch}
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#264a7f] via-[#2f5b98] to-[#69a44f] px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5"
                  >
                    Search opportunities
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur">
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                      <p className="mt-1 text-xs text-slate-200">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
