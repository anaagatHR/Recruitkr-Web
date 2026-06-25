"use client";

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
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
      {/* 1 — Success stories: candidates who GOT the job (videos tagged "both") */}
      <YouTubeShorts
        audience="both"
        eyebrow="Success Stories"
        title="Candidates who got the job"
        subtitle="Real people who landed their role through RecruitKr."
      />
      {/* 2 — Success stories: more candidates who got the job (tagged "candidate") */}
      <YouTubeShorts
        audience="candidate"
        eyebrow="Success Stories"
        title="candidates who got hired"
        subtitle="Real stories from people who landed their job through RecruitKr."
      />
      {/* 3 — Employer ratings */}
      <YouTubeShorts
        audience="employer"
        eyebrow="Employer Ratings"
        title="Client testimonials"
        subtitle="Hear what companies think of hiring with RecruitKr."
      />
      <Placement />
      
      <PartnerCompanies />
      <Footer />
    </div>
  );
};

export default Index;
