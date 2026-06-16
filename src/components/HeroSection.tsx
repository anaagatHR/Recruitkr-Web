"use client";
import { Search } from "lucide-react";
import { useNavigate } from "@/compat/router";
import TypingText from "@/components/TypingText";
import { useState } from "react";

const heroPhrases = [
  "ढूंढ लिया Job?",
  "Found your dream Job?",
  "नौकरी मिल गई?",
  "Your next Job is here",
];
  
const HeroSection = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const goSearch = () => {
    navigate(query.trim() ? `/jobs?search=${encodeURIComponent(query.trim())}` : "/jobs");
  };

  return (
    <section className="relative flex min-h-[58svh] items-center border-b border-[#264a7f] justify-center overflow-hidden px-4 pt-20 sm:min-h-[60svh] lg:min-h-[calc(100svh-5rem)]">
      {/* Muted looping background video. The poster image shows instantly and
          remains the fallback until /assets/hero.mp4 is added. */}
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
      {/* Dark gradient overlay keeps the text readable over the video */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/45" />

      <div className="relative z-10 container mx-auto px-4 py-8 text-center sm:px-6 sm:py-16 md:py-20 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="font-heading  mb-4 flex min-h-[2.4em] items-center justify-center text-3xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:mb-6 sm:min-h-[1.6em] sm:text-5xl md:text-6xl lg:text-7xl">
            <TypingText phrases={heroPhrases} />
          </h1>

          <p className="mx-auto max-w-2xl text-sm text-white/100 sm:text-base md:text-lg lg:text-xl">
            RecruirKr-Befikr
          </p>

          <div className="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 shadow-lg backdrop-blur sm:mt-8 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl px-3">
              <Search size={18} className="shrink-0 text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && goSearch()}
                placeholder="Search jobs by title, skill or company"
                className="w-full min-w-0 bg-transparent py-3 text-sm outline-none text-white placeholder-white/50"
              />
            </div>
            <button
              type="button"
              onClick={goSearch}
              className="btn-gradient w-full shrink-0 rounded-xl px-6 py-3 text-sm font-bold transition hover:scale-[1.02] sm:w-auto"
            >
              Search jobs
            </button>
          </div>

        </div>

        

      </div>
    </section>
  );
};

export default HeroSection;
