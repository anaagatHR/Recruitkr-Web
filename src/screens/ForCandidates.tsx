"use client";

import { Briefcase, MessageSquare, FileText, Bell, ShieldCheck, TrendingUp } from "lucide-react";
import MarketingPage from "@/components/MarketingPage";
import YouTubeShorts from "@/components/YouTubeShorts";
import CandidateJourneySection from "@/components/CandidateJourneySection";

const CHANNEL_URL = "https://www.youtube.com/@RecruitKr_official";

export default function ForCandidates() {
  return (
    <MarketingPage
      eyebrow="For Candidates"
      title="Your career journey starts here"
      highlight="career journey"
      subtitle="RecruitKr helps you build a professional profile, showcase your skills, connect with the right employers, and confidently secure your next opportunity."
      primaryCta={{ label: "Create your profile", to: "/signup" }}
      secondaryCta={{ label: "Explore jobs", to: "/jobs" }}
      stats={[
        { value: "12k+", label: "Verified jobs" },
        { value: "3.5k+", label: "Hiring companies" },
        { value: "4.6★", label: "Avg. rating" },
      ]}
      beforeFeatures={<CandidateJourneySection />}
      featuresTitle="Everything you need to land your next role"
      features={[
        { icon: Briefcase, title: "One-tap apply", description: "Apply to verified jobs instantly — your profile and resume go to the employer automatically." },
        { icon: MessageSquare, title: "Direct chat", description: "Message recruiters directly, share files, and schedule interviews without leaving the app." },
        { icon: FileText, title: "Smart resume", description: "Build a clean resume from your profile and download a polished PDF in seconds." },
        { icon: Bell, title: "Real-time updates", description: "Get notified the moment your status changes — shortlisted, interview, or offer." },
        { icon: ShieldCheck, title: "Verified companies", description: "Every employer is verified with real ratings, so you apply with confidence." },
        { icon: TrendingUp, title: "Track progress", description: "See your full application pipeline and recruiter activity at a glance." },
      ]}
      closingTitle="Ready to build your career?"
      closingSubtitle="Join thousands of candidates finding better opportunities through RecruitKr."
    >
      {/* Employer reviews — shown to candidates (cross-trust) */}
      <YouTubeShorts
        audience="employer"
        eyebrow="Employer Reviews"
        title="What employers say about hiring with RecruitKr"
        subtitle="Hear from the companies building their teams on RecruitKr."
        channelUrl={CHANNEL_URL}
      />
    </MarketingPage>
  );
}
