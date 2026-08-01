"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import Placement from "@/components/placement";
import PartnerCompanies from  "@/components/company";
import JobShowcase from "@/components/JobShowcase";
import FeaturedJobsSection from "@/components/FeaturedJobsSection";
import TopCompanies from "@/components/TopCompanies";
import HomeWhyUs from "@/components/HomeWhyUs";
import HomeTestimonials from "@/components/HomeTestimonials";
import HomeReviews from "@/components/HomeReviews";
import HomeFaq from "@/components/HomeFaq";
import HomeClosingCta from "@/components/HomeClosingCta";

/**
 * Home page order, and why:
 *   hero → which employers → who hires here → what kind of work → why us →
 *   the numbers → the voices → the ratings → the questions → act → jobs
 *
 * The page opens on who is hiring and closes on the openings themselves, so a
 * visitor who read the whole thing lands back on real jobs rather than on the
 * footer.
 *
 * Surfaces alternate white / slate-50 the whole way down, which keeps every
 * neighbouring pair of sections distinct without extra dividers. Two sections
 * can render nothing (TopCompanies with an empty board, HomeReviews until it
 * has real reviews), so the pairs around them use a border rather than relying
 * on the tint alternating — see the comments below.
 */
const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      {/* Who is hiring right now, grouped from the live job data — the logo
          marquee below is decoration, this is clickable: each tile filters the
          board to that employer. Renders nothing on an empty board. (white) */}
      <JobShowcase />
      <Placement />
      <HomeWhyUs />
      <HomeTestimonials />
      <TopCompanies />
      {/* Partner logos: the broader trust signal, after the employers who are
          actually hiring right now. (tinted band) */}
      {/* What kind of work is on offer, for a visitor who didn't find their
          role in the strip above. (white) */}
      {/* Why go through RecruitKr at all. Sits after the visitor has seen real
          jobs and real employers, so it reads as substantiation rather than a
          pitch made before anything was shown. (tinted band) */}
      {/* Proof in numbers, moved up from the foot of the page: it backs the
          jobs above while the visitor is still deciding. (white) */}
      {/* Proof in people's own words. Replaces three stacked video rails —
          two of which were both headed "Success Stories" — with one tabbed
          section over the same videos. (tinted band) */}
      {/* Written ratings alongside the video stories. Renders nothing until
          real reviews are added — see the note at the top of the file. (white
          when present) */}
      <HomeReviews />
      {/* Objection handling right before the ask: fees, guarantees, coverage.
          Carries its own top border because the section before it is white
          whenever HomeReviews is showing. (white) */}
      <HomeFaq />
      {/* The ask. (white, with a dark brand band inside) */}
      <HomeClosingCta />
      {}
      <PartnerCompanies />
      <FeaturedJobsSection variant="latest" />
      <Footer />
    </div>
  );
};

export default Index;
