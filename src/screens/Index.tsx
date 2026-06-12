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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HomeJobSearch />
      <FeaturedJobsSection />
      <ServicesSection />
      <SectorsSection />
      <WhoWeHelpSection />
      <ProcessSection />
      <WhyRecruitkrSection />
      <DualCtaSection />
      <Footer />
    </div>
  );
};

export default Index;
