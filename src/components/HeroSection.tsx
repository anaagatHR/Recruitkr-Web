"use client";
import { ArrowRight, Briefcase } from "lucide-react";
import { Link } from "@/compat/router";

const stats = [
  { value: "500+", label: "Placements" },
  { value: "11+", label: "Sectors" },
  { value: "End to End", label: "HR Solutions" },
];

const HeroSection = () => {
  return (
    <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center justify-center overflow-hidden pt-20">
      {/* Background image right behind the hero */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=80"
        alt="People collaborating at work"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Dark gradient overlay keeps the text readable over the image */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/60 to-black/45" />

      <div className="relative z-10 container mx-auto px-4 py-14 text-center sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-heading mb-6 text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-7xl">
            Your Hiring Partner.
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-base text-white/90 sm:text-lg md:text-xl">
            Recruitment, Payroll, Staffing, Gig Solutions — Serving Startups, Small Business MSMEs and Corporates.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/login?role=client"
              className="btn-gradient group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-bold transition-transform hover:scale-105 sm:w-auto sm:px-8"
            >
              <Briefcase size={20} />
              Hire Talent
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/register/candidate"
              className="btn-gradient group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-bold transition-transform hover:scale-105 sm:w-auto sm:px-8"
            >
              Find a Job
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 divide-y divide-white/20 rounded-xl border border-white/20 bg-white/10 backdrop-blur sm:mt-20 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
          {stats.map((stat) => (
            <div key={stat.label} className="min-h-[96px] px-4 py-5 text-center sm:px-6 sm:py-6">
              <div className="text-2xl font-extrabold text-white sm:text-3xl md:text-4xl">{stat.value}</div>
              <div className="mt-1 text-sm text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
