"use client";

import { useState } from "react";
import { Link, useNavigate } from "@/compat/router";
import { ArrowRight, Building2, Search, ShieldCheck, Sparkles, Star, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DeferredSection from "@/components/DeferredSection";
import ServicesSection from "@/components/ServicesSection";
import WhyRecruitkrSection from "@/components/WhyRecruitkrSection";

const popularSearches = ["Frontend", "Nurse", "Sales", "Finance", "Remote", "Internship"];
const sectionFallback = <div className="min-h-[300px]" aria-hidden="true" />;

const highlights = [
  { icon: Sparkles, title: "Fresh jobs daily", text: "New, verified openings added every day across 11+ sectors." },
  { icon: ShieldCheck, title: "Verified employers", text: "Apply with confidence to companies we've checked and rated." },
  { icon: Users, title: "Free for candidates", text: "Browse everything for free — an account is only needed to apply." },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const goSearch = () => navigate(query.trim() ? `/jobs?search=${encodeURIComponent(query.trim())}` : "/jobs");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Big hero image right after the nav */}
      <section className="relative h-[48vh] min-h-[340px] w-full overflow-hidden sm:h-[62vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1920&q=80"
          alt="People collaborating at work"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center px-4 pt-16 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <Sparkles size={13} /> Your end-to-end hiring &amp; HR partner
            </span>
            <h1
              className="mt-5 font-heading text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl"
              style={{ backgroundImage: "none", WebkitTextFillColor: "#fff" }}
            >
              Your Hiring Partner.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
              RecruitKr connects candidates with verified, top-rated companies across India. Browse freely — log in only when you&apos;re ready to apply.
            </p>
          </div>
        </div>
      </section>

      {/* ===================== HOME SECTION (search + CTAs) ===================== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="mx-auto max-w-3xl">

            {/* Search is the single bridge into the separate Jobs section */}
            <div className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-lg sm:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-xl px-3">
                <Search size={18} className="text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && goSearch()}
                  placeholder="Search jobs by title, skill or company"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
              </div>
              <button onClick={goSearch} className="btn-gradient rounded-xl px-6 py-3 text-sm font-bold transition hover:scale-[1.02]">
                Search jobs
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Popular:</span>
              {popularSearches.map((s) => (
                <Link key={s} to={`/jobs?search=${encodeURIComponent(s)}`} className="rounded-full border border-border px-3 py-1 transition hover:border-primary/40 hover:text-primary">
                  {s}
                </Link>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/jobs" className="btn-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition hover:scale-[1.02]">
                <Building2 size={18} /> Browse all jobs
              </Link>
              <Link to="/companies" className="inline-flex items-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold transition hover:border-primary/40">
                <Star size={18} /> Explore company ratings
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
            {[
              { value: "500+", label: "Placements" },
              { value: "11+", label: "Sectors" },
              { value: "4.4★", label: "Avg. rating" },
            ].map((s) => (
              <div key={s.label} className="px-4 py-6">
                <div className="text-2xl font-extrabold text-primary sm:text-3xl">{s.value}</div>
                <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why RecruitKr — still part of the home/landing story (no job listings here) */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {highlights.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Existing marketing content (kept) */}
      <DeferredSection fallback={sectionFallback}>
        <ServicesSection />
      </DeferredSection>
      <DeferredSection fallback={sectionFallback}>
        <WhyRecruitkrSection />
      </DeferredSection>

      {/* CTA into the separate Jobs section */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="overflow-hidden rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">Ready to make your next move?</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Head to the jobs section to browse and apply, or create a free account in seconds.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/jobs" className="btn-gradient inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold transition hover:scale-[1.02]">
                Go to jobs <ArrowRight size={16} />
              </Link>
              <Link to="/signup" className="rounded-xl border border-border px-7 py-3.5 text-sm font-semibold transition hover:border-primary/40">
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
