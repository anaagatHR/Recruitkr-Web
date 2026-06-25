"use client";

import { ClipboardCheck, Code2, Brain, Gauge, ShieldCheck, FileBarChart } from "lucide-react";
import MarketingPage from "@/components/MarketingPage";

export default function Assessment() {
  return (
    <MarketingPage
      eyebrow="Assessment"
      title="Hire on skills, not just resumes"
      highlight="skills"
      subtitle="Screen candidates with role-based assessments — aptitude, coding and domain tests — and shortlist the right people with confidence."
      primaryCta={{ label: "Request a demo", to: "/contact" }}
      secondaryCta={{ label: "For employers", to: "/employers" }}
      stats={[
        { value: "200+", label: "Skill tests" },
        { value: "90%", label: "Less manual screening" },
        { value: "Auto", label: "Scored & ranked" },
      ]}
      featuresTitle="Assess what matters"
      features={[
        { icon: Code2, title: "Coding tests", description: "Real-world programming challenges with automated evaluation across languages." },
        { icon: Brain, title: "Aptitude & reasoning", description: "Measure logical, numerical and verbal ability with proven question banks." },
        { icon: ClipboardCheck, title: "Domain assessments", description: "Role-specific tests for sales, HR, finance, engineering and more." },
        { icon: Gauge, title: "Skill match score", description: "Every candidate gets an objective score so you shortlist faster." },
        { icon: ShieldCheck, title: "Proctoring", description: "Keep assessments fair with anti-cheat safeguards and integrity checks." },
        { icon: FileBarChart, title: "Detailed reports", description: "Clear, shareable reports that make hiring decisions easy to defend." },
      ]}
      steps={[
        { title: "Pick a test", description: "Choose from 200+ ready assessments or request a custom one." },
        { title: "Invite", description: "Send candidates a link — they take it on any device." },
        { title: "Auto-score", description: "Results are graded and ranked automatically." },
        { title: "Shortlist", description: "Move top scorers straight into your pipeline." },
      ]}
      closingTitle="Make confident hiring decisions"
      closingSubtitle="Add objective assessments to your hiring with RecruitKr."
    />
  );
}
