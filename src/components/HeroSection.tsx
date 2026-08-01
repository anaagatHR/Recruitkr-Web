"use client";
import { ArrowRight, BriefcaseBusiness, Search } from "lucide-react";
import { useNavigate } from "@/compat/router";
import TypingText from "@/components/TypingText";
import HeroProcessFlow from "@/components/HeroProcessFlow";
import HeroPhotoSlider from "@/components/HeroPhotoSlider";
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

const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const goSearch = () => {
    navigate(query.trim() ? `/jobs?search=${encodeURIComponent(query.trim())}` : "/jobs");
  };

  // The navbar is fixed and 5rem tall and the page starts underneath it, so the
  // hero's top padding has to clear it — less than that hides the first line.
  // The section is a full viewport tall (svh, so mobile browser chrome doesn't
  // push the bottom off-screen) and centres its column, which means the whole
  // hero — pill through stats — lands in one screen on a phone too. Everything
  // below is sized so that column stays under ~(100svh - navbar) on a small
  // phone: single-row search, side-by-side CTAs, tighter type and gaps.
  return (
    <section className="relative isolate flex min-h-[72svh] flex-col justify-center overflow-hidden border-b border-slate-200 bg-white pb-10 pt-20 sm:min-h-[100svh] sm:pb-16 sm:pt-28 lg:pb-32 lg:pt-32">
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Rotating multilingual hook, pulled up above the headline as a pill so
              it reads as a greeting rather than a stray line of body copy. */}
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur sm:px-4 sm:py-2 sm:text-sm">
            <BriefcaseBusiness size={15} className="text-[#e59f56]" />
            <TypingText phrases={heroPhrases} />
          </div>

          {/* One line from sm up, where there is room for it. Phones let the phrase
              wrap: nowrap at a readable hero size gives the h1 a min-content width
              wider than the viewport, which drags the whole page into horizontal
              overflow. Sizes are fluid because nowrap can't step at breakpoints. */}
          <h1 className="mt-4 font-heading text-[clamp(1.75rem,8.5vw,2.5rem)] font-extrabold leading-[1.12] tracking-tight sm:mt-6 text-slate-900 [text-shadow:0_2px_6px_rgba(255,255,255,0.9)] sm:whitespace-nowrap sm:text-[clamp(2.25rem,7vw,3.5rem)] lg:text-[clamp(3rem,5vw,4.25rem)] lg:leading-[1.08]">
            {/* Two-tone wordmark, matched to the logo: navy "Recruit" + green "Kr". */}
            <span className="text-[#264a7f]">Recruit</span>
            <span className="text-[#69a44f]">Kr</span>
            {/* Same navy + green split as the wordmark. Solid logo colours rather
                than the brand gradient: gradient text goes muddy over a photo,
                and these hold their contrast on every slide. */}
            <span className="block">
              <span className="text-[#264a7f]">Find Your Dream </span>
              <span className="text-[#69a44f]">Job ?</span>
            </span>
          </h1>

          {/* Darker than the usual slate-600 body copy, with a soft white halo:
              at 40-50% scrim the photos read through, so the text has to carry
              its own contrast rather than lean on a flat white backdrop. */}
          <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-800 [text-shadow:0_1px_3px_rgba(255,255,255,0.95)] sm:mt-5 sm:text-lg sm:leading-8">
            Connect directly with Recruiters, track live updates, get instant updates and scroll
            down to apply for verified jobs.
          </p>

          {/* Search comes after the copy and is the primary action of the hero, so
              it gets the full width of the column rather than living in a card.
              One row at every size — stacking it on phones cost ~60px of height
              and pushed the stats below the fold. The button shrinks to an icon
              under sm so the input keeps a usable width on a narrow phone. */}
          <div className="mx-auto mt-5 max-w-2xl rounded-full border border-slate-200 bg-white/95 p-1.5 shadow-xl backdrop-blur sm:mt-8 sm:p-2">
            <div className="flex flex-row items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full py-0 pl-3 sm:pl-5">
                <Search size={18} className="shrink-0 text-slate-400" />
                {/* 16px on mobile — anything smaller makes iOS Safari zoom the page on focus. */}
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goSearch()}
                  placeholder="Search jobs or companies"
                  enterKeyHint="search"
                  autoComplete="off"
                  aria-label="Search jobs, skills or companies"
                  className="w-full min-w-0 bg-transparent py-2 text-base text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>
              <button
                type="button"
                onClick={goSearch}
                aria-label="Search opportunities"
                className="sheen flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#264a7f] via-[#2f5b98] to-[#69a44f] text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5 sm:h-auto sm:w-auto sm:px-6 sm:py-3.5"
              >
                <Search size={18} className="sm:hidden" />
                <span className="hidden sm:inline">Search opportunities</span>
              </button>
            </div>
          </div>

          {/* Side by side on phones — each half is still a comfortable thumb
              target at this width, and one row instead of two keeps the stats
              on screen. Both stay ~44px tall for tap accessibility. */}
          <div className="mt-4 flex flex-row items-center justify-center gap-2.5 sm:mt-6 sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={goSearch}
              className="sheen glow-green group inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#69a44f] to-[#5a8d3d] px-5 py-3 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-1 sm:flex-none sm:px-7 sm:py-3.5"
            >
              Explore jobs{" "}
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/contact")}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 hover:bg-white sm:flex-none sm:px-7 sm:py-3.5"
            >
              Talk to us
            </button>
          </div>

          {/* Three across even on the narrowest phone — the labels are short
              enough that stacking them just made the row needlessly tall. */}
          <div className="mx-auto mt-5 grid max-w-2xl grid-cols-3 gap-2 sm:mt-10 sm:gap-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-slate-200 bg-white/80 px-2 py-2.5 text-center shadow-sm backdrop-blur sm:rounded-2xl sm:p-4"
              >
                <p className="text-lg font-bold text-slate-900 sm:text-2xl">{stat.value}</p>
                {/* 11px floor: 10px labels measured as the smallest text on the
                    site and were the hardest thing on the page to read. */}
                <p className="mt-0.5 text-[11px] leading-tight text-slate-600 sm:mt-1 sm:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <HeroPhotoSlider
        className="absolute inset-0 z-0"
        overlayClassName="bg-white/55 sm:bg-white/40"
        showArrows={false}
      />

      {/* Animated journey ribbon — shows how the whole site works end to end. */}
      <HeroProcessFlow />
    </section>
  );
};

export default HeroSection;
