"use client";

import { GraduationCap, Video, Award, Users2, BriefcaseBusiness, Sparkles } from "lucide-react";
import MarketingPage from "@/components/MarketingPage";

export default function Training() {
  return (
    <MarketingPage
      eyebrow="Training"
      title="Get job-ready with real skills"
      highlight="job-ready"
      subtitle="Industry-led training programs that turn potential into placements — learn, practice, get certified, and get hired."
      primaryCta={{ label: "Explore programs", to: "/contact" }}
      secondaryCta={{ label: "For candidates", to: "/candidates" }}
      stats={[
        { value: "50+", label: "Programs" },
        { value: "85%", label: "Placement support" },
        { value: "1:1", label: "Mentorship" },
      ]}
      featuresTitle="Training built for outcomes"
      features={[
        { icon: Video, title: "Live & self-paced", description: "Learn on your schedule with live cohorts or on-demand modules." },
        { icon: BriefcaseBusiness, title: "Job-focused tracks", description: "Curricula mapped to real roles in tech, sales, HR and operations." },
        { icon: Users2, title: "Expert mentors", description: "Get guidance from practitioners who've hired and built teams." },
        { icon: Award, title: "Certifications", description: "Earn credentials that employers on RecruitKr recognise." },
        { icon: Sparkles, title: "Hands-on projects", description: "Build a portfolio with practical, reviewed projects." },
        { icon: GraduationCap, title: "Placement support", description: "Move from training straight into matching jobs on RecruitKr." },
      ]}
      steps={[
        { title: "Choose a track", description: "Pick the program that matches your goal." },
        { title: "Learn", description: "Attend live sessions or learn at your own pace." },
        { title: "Get certified", description: "Complete projects and earn your certificate." },
        { title: "Get placed", description: "Apply to matching roles with a stronger profile." },
      ]}
      closingTitle="Upskill and get hired"
      closingSubtitle="Start a training program that leads to real opportunities."
    />
  );
}
