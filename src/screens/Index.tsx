"use client";

import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import FeaturedJobsSection from "@/components/FeaturedJobsSection";

/**
 * Below-the-fold sections are code-split. Everything on the home page used to
 * ship in one client bundle (~745 KB of JS for the route, per the audit); the
 * hero and the job strip are what a visitor sees first, so only those are in
 * the initial chunk. The rest still server-renders (ssr: true is the default)
 * — this changes how the JS is delivered, not what crawlers get.
 */
const JobShowcase = dynamic(() => import("@/components/JobShowcase"), {
  loading: () => <SectionSkeleton className="h-[520px]" />,
});
const HomeWhyUs = dynamic(() => import("@/components/HomeWhyUs"), {
  loading: () => <SectionSkeleton className="h-[480px]" />,
});
const Placement = dynamic(() => import("@/components/placement"), {
  loading: () => <SectionSkeleton className="h-[360px]" />,
});
const HomeTestimonials = dynamic(() => import("@/components/HomeTestimonials"), {
  loading: () => <SectionSkeleton className="h-[520px]" />,
});
const HomeClosingCta = dynamic(() => import("@/components/HomeClosingCta"), {
  loading: () => <SectionSkeleton className="h-[320px]" />,
});

/** Reserves the section's height so nothing jumps while a chunk loads. */
function SectionSkeleton({ className }: { className: string }) {
  return <div aria-hidden className={`w-full animate-pulse bg-slate-50 ${className}`} />;
}

/**
 * Home page: seven sections, and why these seven.
 *
 * The audit measured the previous page at ~7,700 px across 15+ sections —
 * jobs, categories, process, stats, why-us, testimonials, employers, FAQ,
 * CTA, partners, fresh jobs — and found that the one action that matters
 * (search → read a job → apply) was buried under them. This cut keeps the
 * sections that move a visitor towards a job and drops the ones that
 * duplicate a dedicated page:
 *
 *   1. Hero + search          — the action
 *   2. Fresh on the board     — real jobs, immediately (was the LAST section)
 *   3. Categories             — a second way in, with live counts
 *   4. Why RecruitKr          — three reasons, once the jobs have been seen
 *   5. By the numbers         — track record
 *   6. Success stories        — people, in their own words
 *   7. Closing CTA
 *
 * Removed from the home page (still live elsewhere): the FAQ (→ /faqs), the
 * partner-logo marquee (→ /partners), "companies hiring" (two employers made
 * it look thin; it returns when the board has depth), and written reviews
 * (rendered nothing until reviews exist).
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main">
        <HeroSection />
        <FeaturedJobsSection variant="latest" />
        <JobShowcase />
        <HomeWhyUs />
        <Placement />
        <HomeTestimonials />
        <HomeClosingCta />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
