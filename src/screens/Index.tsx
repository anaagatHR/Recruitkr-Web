"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HomeJobSearch from "@/components/HomeJobSearch";
import FeaturedJobsSection from "@/components/FeaturedJobsSection";
import ServicesSection from "@/components/ServicesSection";
import SectorsSection from "@/components/SectorsSection";
import WhoWeHelpSection from "@/components/WhoWeHelpSection";
import ProcessSection from "@/components/ProcessSection";
import WhyRecruitkrSection from "@/components/WhyRecruitkrSection";
import DualCtaSection from "@/components/DualCtaSection";
import Footer from "@/components/Footer";
import Placement from "@/components/placement";
import PartnerCompanies from  "@/components/company";
import JobShowcase from "@/components/JobShowcase";
import YouTubeShorts from "@/components/YouTubeShorts";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <JobShowcase />
      <YouTubeShorts
        audience="all"
        eyebrow="Success Stories"
        title="Success stories from RecruitKr"
        subtitle="Real videos from candidates who got hired and the companies that built their teams."
      />
      <Placement />
      
      <PartnerCompanies />
      {/* <FeaturedJobsSection /> */}
      <Footer />
    </div>
  );
};

export default Index;
