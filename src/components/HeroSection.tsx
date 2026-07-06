"use client";
import { ArrowRight, BriefcaseBusiness, Search, Sparkles, Users } from "lucide-react";
import { useNavigate } from "@/compat/router";
import TypingText from "@/components/TypingText";
import HeroProcessFlow from "@/components/HeroProcessFlow";
import HeroAnimatedBackground from "@/components/HeroAnimatedBackground";
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
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-slate-950 py-24 sm:py-28 lg:min-h-[calc(100svh-4rem)] lg:py-32 lg:pb-40">
      {/* Animated talent-network background (replaces the old hero video). */}
      <HeroAnimatedBackground />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(105,164,79,0.24),transparent_35%),linear-gradient(115deg,rgba(0,0,0,0.82),rgba(0,0,0,0.45))]" />
      {/* Cinematic aurora — a slow drifting brand-colour glow field over the video. */}
      <div aria-hidden className="aurora pointer-events-none absolute inset-0 opacity-40 mix-blend-screen" />
      {/* Fine grid texture for engineered depth. */}
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(70%_70%_at_50%_40%,#000,transparent)]" />
      <div className="absolute left-[-8%] top-[-8%] h-40 w-40 rounded-full bg-[#69a44f]/30 blur-3xl animate-blob" />
      <div className="absolute bottom-[-8%] right-[-4%] h-56 w-56 rounded-full bg-[#e59f56]/25 blur-3xl animate-blob-delayed" />

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90 shadow-lg backdrop-blur">
              <Sparkles size={16} className="text-[#e59f56]" />
              Explore jobs with confidence
            </div>

            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.4)] sm:text-5xl lg:text-7xl">
              RecruitKr – <span className="text-gradient-teal">Find  Your Dream Job ?</span>
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-200 sm:text-xl">
             Connect directly with Recruiters, track live updates, get instant updates and scroll down to apply for verified jobs.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <button
                type="button"
                onClick={goSearch}
                className="sheen glow-green group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#69a44f] to-[#5a8d3d] px-7 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-1"
              >
                Explore jobs <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/contact")}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white/90 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/50 hover:bg-white/20"
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

          <div className="relative mx-auto w-full max-w-xl">
            {/* Conic spotlight glow rotating slowly behind the search card. */}
            <div aria-hidden className="spotlight pointer-events-none absolute -inset-8 -z-10 rounded-full opacity-60 blur-2xl" />
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
                    className="sheen mt-3 w-full rounded-xl bg-gradient-to-r from-[#264a7f] via-[#2f5b98] to-[#69a44f] px-4 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
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

      {/* Animated journey ribbon — shows how the whole site works end to end. */}
      <HeroProcessFlow />
    </section>
  );
};

export default HeroSection;
