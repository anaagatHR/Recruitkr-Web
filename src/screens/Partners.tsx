"use client";

import { Handshake, Building2, GraduationCap, Network, Megaphone, BadgePercent } from "lucide-react";
import MarketingPage from "@/components/MarketingPage";

export default function Partners() {
  return (
    <MarketingPage
      eyebrow="Partners"
      title="Grow together with RecruitKr"
      highlight="together"
      subtitle="Partner with us as a staffing agency, training institute, college or channel partner — and reach more talent and employers across India."
      primaryCta={{ label: "Become a partner", to: "/contact" }}
      secondaryCta={{ label: "Success stories", to: "/success-stories" }}
      stats={[
        { value: "100+", label: "Active partners" },
        { value: "Pan-India", label: "Reach" },
        { value: "Win-win", label: "Revenue share" },
      ]}
      featuresTitle="Ways to partner with us"
      features={[
        { icon: Building2, title: "Staffing agencies", description: "Source and place candidates faster with our verified employer network." },
        { icon: GraduationCap, title: "Training institutes", description: "Connect your trained learners directly to hiring companies." },
        { icon: Network, title: "Colleges & campuses", description: "Run campus drives and give students access to verified opportunities." },
        { icon: Megaphone, title: "Channel partners", description: "Refer employers and candidates and earn through our partner program." },
        { icon: BadgePercent, title: "Revenue share", description: "Transparent, win-win commercials that grow with your contribution." },
        { icon: Handshake, title: "Dedicated support", description: "A partner success team and tooling to help you scale." },
      ]}
      steps={[
        { title: "Apply", description: "Tell us about your organisation and goals." },
        { title: "Onboard", description: "Get set up with tools, training and support." },
        { title: "Collaborate", description: "Bring talent or employers onto the platform." },
        { title: "Grow", description: "Scale placements and earn through the partnership." },
      ]}
      closingTitle="Let's build hiring together"
      closingSubtitle="Join the RecruitKr partner network and grow with us."
    />
  );
}
