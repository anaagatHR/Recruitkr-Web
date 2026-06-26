"use client";

import { Users, Search, MessagesSquare, CalendarCheck, Kanban, BarChart3, Star, Quote } from "lucide-react";
import MarketingPage from "@/components/MarketingPage";
import YouTubeShorts from "@/components/YouTubeShorts";
import FeaturedJobsSection from "@/components/FeaturedJobsSection";
import JobReadyTalentSection from "@/components/JobReadyTalentSection";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

const CHANNEL_URL = "https://www.youtube.com/@RecruitKr_official";

const REVIEWS = [
  {
    quote: "We filled three roles in under two weeks. The candidate search and instant chat cut our shortlisting time in half.",
    name: "Rohan Kapoor",
    company: "NovaTech Solutions",
    rating: 5,
  },
  {
    quote: "Being able to see profiles, resumes and intro videos at apply time means we interview far fewer, far better candidates.",
    name: "Meera Iyer",
    company: "BrightHire Staffing",
    rating: 5,
  },
  {
    quote: "Scheduling interviews right inside the chat is a game-changer. Our hiring managers love how simple it is.",
    name: "Aditya Verma",
    company: "Skyline Logistics",
    rating: 5,
  },
];

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

export default function ForEmployers() {
  return (
    <MarketingPage
      eyebrow="For Employers"
      title="Hire faster with less effort"
      highlight="faster"
      subtitle="Post a role, search verified candidates, chat instantly, and schedule interviews — your whole hiring pipeline in one place."
      primaryCta={{ label: "Post a job", to: "/signup/employer" }}
      secondaryCta={{ label: "Talk to us", to: "/contact" }}
      stats={[
        { value: "3.5k+", label: "Companies hiring" },
        { value: "70%", label: "Faster shortlisting" },
        { value: "24/7", label: "Real-time chat" },
      ]}
      beforeFeatures={
        <>
          <FeaturedJobsSection />
          <JobReadyTalentSection />
          
        </>
      }
      featuresTitle="A complete recruitment toolkit"
      features={[
        { icon: Search, title: "Candidate search", description: "Find talent by skill, experience and location with instant, typo-tolerant search." },
        { icon: MessagesSquare, title: "Instant chat", description: "Message any candidate directly — share notes, files and interview details in real time." },
        { icon: Kanban, title: "Applicant pipeline", description: "Track every applicant from applied to hired with status, timeline and notes." },
        { icon: CalendarCheck, title: "Interview scheduling", description: "Schedule interviews inside the chat with meeting links the candidate sees instantly." },
        { icon: Users, title: "Rich profiles", description: "See each candidate's full profile, resume and intro videos at apply time." },
        { icon: BarChart3, title: "Hiring insights", description: "Understand your funnel, time-to-hire and conversion at a glance." },
      ]}
      steps={[
        { title: "Post a role", description: "Create a requirement in minutes and go live." },
        { title: "Source", description: "Search and shortlist verified candidates instantly." },
        { title: "Engage", description: "Chat, share, and schedule interviews in one thread." },
        { title: "Hire", description: "Move candidates through your pipeline to offer." },
      ]}
      closingTitle="Build your team Befikr"
      closingSubtitle="Start hiring verified candidates on RecruitKr today."
    >
      {/* Candidate success — how candidates get the job (shown to employers) */}
      <YouTubeShorts
        audience="candidate"
        eyebrow="Candidate Success"
        title="Candidate success stories"
        subtitle="Real stories from people who landed their job through RecruitKr."
        channelUrl={CHANNEL_URL}
      />
      {/* Employer reviews */}
      <section className="bg-muted/40 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal as="div">
            <h2 className="text-center font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              What employers say
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
              Recruiters and hiring teams trust RecruitKr to hire faster.
            </p>
          </Reveal>

          <RevealGroup className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-3">
            {REVIEWS.map((r) => (
              <RevealItem
                key={r.name}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-1 hover:shadow-md sm:p-6"
              >
                <Quote size={22} className="text-[#264a7f]/30" />
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-foreground">“{r.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#264a7f_0%,#69a44f_100%)] text-xs font-bold text-white">
                    {initials(r.name)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">{r.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.company}</span>
                  </span>
                </figcaption>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </MarketingPage>
  );
}
