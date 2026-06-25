"use client";

import { Briefcase, MessageSquare, FileText, Bell, ShieldCheck, TrendingUp, Video, Play, ArrowRight } from "lucide-react";
import MarketingPage, { MarketingCheck } from "@/components/MarketingPage";
import YouTubeShorts, { type Short } from "@/components/YouTubeShorts";
import { Link } from "@/compat/router";

// 👉 Paste your channel's Shorts video IDs here (the part after youtube.com/shorts/).
//    These are placeholder IDs just so the carousel previews — replace them.
const CANDIDATE_SHORTS: Short[] = [
  { id: "jNQXAC9IVRw", title: "I got hired in 5 days — my review" },
  { id: "dQw4w9WgXcQ", title: "How RecruitKr got me the job" },
  { id: "9bZkp7q19f0", title: "My RecruitKr success story" },
  { id: "kJQP7kiw5Fk", title: "From fresher to first job" },
  { id: "JGwWNGJdvx8", title: "Best decision for my career" },
  { id: "aqz-KE-bpKQ", title: "Why I recommend RecruitKr" },
];

const CHANNEL_URL = "https://www.youtube.com/@recruitkr";

export default function ForCandidates() {
  return (
    <MarketingPage
      eyebrow="For Candidates"
      title="Find the right job, Befikr"
      highlight="right job"
      subtitle="Apply in one tap, chat directly with employers, and track every application in real time — all from your phone."
      primaryCta={{ label: "Create your profile", to: "/signup" }}
      secondaryCta={{ label: "Browse jobs", to: "/jobs" }}
      stats={[
        { value: "12k+", label: "Verified jobs" },
        { value: "3.5k+", label: "Hiring companies" },
        { value: "4.6★", label: "Avg. rating" },
      ]}
      featuresTitle="Everything you need to land your next role"
      features={[
        { icon: Briefcase, title: "One-tap apply", description: "Apply to verified jobs instantly — your profile and resume go to the employer automatically." },
        { icon: MessageSquare, title: "Direct chat", description: "Message recruiters directly, share files, and schedule interviews without leaving the app." },
        { icon: FileText, title: "Smart resume", description: "Build a clean resume from your profile and download a polished PDF in seconds." },
        { icon: Bell, title: "Real-time updates", description: "Get notified the moment your status changes — shortlisted, interview, or offer." },
        { icon: ShieldCheck, title: "Verified companies", description: "Every employer is verified with real ratings, so you apply with confidence." },
        { icon: TrendingUp, title: "Track progress", description: "See your full application pipeline and recruiter activity at a glance." },
      ]}
      steps={[
        { title: "Create profile", description: "Add your skills, experience and preferences in minutes." },
        { title: "Apply", description: "Find matching jobs and apply with a single tap." },
        { title: "Chat", description: "Talk to the employer directly and book your interview." },
        { title: "Get hired", description: "Track offers and join your next team Befikr." },
      ]}
      closingTitle="Your next job is one tap away"
      closingSubtitle="Join thousands of candidates hiring through RecruitKr."
    >
      {/* Profile video feature */}
      <section className="bg-muted/40 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#264a7f]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#264a7f]">
                <Video size={13} /> Profile Video
              </span>
              <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Stand out with a 30-second intro video
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                A short video lets employers see the real you — your communication, confidence and personality —
                before the interview even starts.
              </p>
              <ul className="mt-5 space-y-3">
                <MarketingCheck>Record a quick intro right from your phone</MarketingCheck>
                <MarketingCheck>Upload it from your dashboard under “My Card”</MarketingCheck>
                <MarketingCheck>Employers see it on your application automatically</MarketingCheck>
              </ul>
              <Link
                to="/signup"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#264a7f] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Add your video <ArrowRight size={16} />
              </Link>
            </div>

            {/* Visual */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-[#16305a] shadow-lg">
                <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#264a7f] shadow-lg transition group-hover:scale-105">
                    <Play size={26} className="ml-1 fill-current" />
                  </span>
                  <p className="mt-4 text-sm font-semibold">Your intro</p>
                  <p className="text-xs text-white/70">0:30 • shown to employers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Candidate Shorts — right-to-left auto-scrolling carousel */}
      <YouTubeShorts
        shorts={CANDIDATE_SHORTS}
        eyebrow="Candidate Reviews"
        title="Candidates who got hired — their reviews"
        subtitle="Real reviews from people who landed their job through RecruitKr."
        channelUrl={CHANNEL_URL}
      />
    </MarketingPage>
  );
}
