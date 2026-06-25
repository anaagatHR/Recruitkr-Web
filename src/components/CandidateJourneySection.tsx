"use client";

import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  MousePointerClick,
  Play,
  Sparkles,
  Target,
  Trophy,
  UserPlus,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

const NAVY = "#264a7f";
const GREEN = "#69a44f";

/* — Per-step preview mock-ups (built from primitives, no images needed) — */

const ProfilePreview = () => (
  <div className="rounded-2xl border border-border/60 bg-white p-3 shadow-sm">
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#264a7f] to-[#69a44f]" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2 w-24 rounded bg-foreground/15" />
        <div className="h-1.5 w-16 rounded bg-foreground/10" />
      </div>
    </div>
    <div className="mt-3">
      <div className="mb-1 flex justify-between text-[10px] font-medium text-muted-foreground">
        <span>Profile strength</span>
        <span className="font-bold text-[#69a44f]">85%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-[85%] rounded-full bg-[#69a44f]" />
      </div>
    </div>
    <div className="mt-3 flex flex-wrap gap-1.5">
      {["React", "Sales", "Design", "+4"].map((s) => (
        <span key={s} className="rounded-full bg-[#264a7f]/10 px-2 py-0.5 text-[10px] font-semibold text-[#264a7f]">
          {s}
        </span>
      ))}
    </div>
  </div>
);

const VideoPreview = () => (
  <div className="relative aspect-video overflow-hidden rounded-2xl border border-border/60 bg-[#16305a]">
    <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
    <div className="absolute inset-0 flex items-center justify-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-[#264a7f] shadow-lg">
        <Play size={18} className="ml-0.5 fill-current" />
      </span>
    </div>
    <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white">0:45</span>
    <span className="absolute left-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-[#264a7f]">Intro</span>
  </div>
);

const Line = ({ w }: { w: string }) => <div className="h-1.5 rounded bg-foreground/15" style={{ width: w }} />;

const ResumePreview = () => (
  <div className="flex items-center gap-2">
    <div className="flex-1 space-y-1.5 rounded-xl border border-border/60 bg-white p-2.5 shadow-sm">
      <Line w="70%" />
      <Line w="90%" />
      <Line w="55%" />
      <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Before</span>
    </div>
    <ArrowRight size={16} className="shrink-0 text-[#69a44f]" />
    <div className="relative flex-1 space-y-1.5 rounded-xl border-2 border-[#69a44f]/40 bg-white p-2.5 shadow-sm">
      <span className="absolute -right-1.5 -top-2 flex items-center gap-0.5 rounded-full bg-[#69a44f] px-1.5 py-0.5 text-[8px] font-bold text-white">
        <Sparkles size={8} /> AI
      </span>
      <Line w="85%" />
      <Line w="65%" />
      <Line w="95%" />
      <span className="mt-1 inline-block text-[9px] font-bold uppercase tracking-wide text-[#69a44f]">After</span>
    </div>
  </div>
);

const MatchRow = ({ title, pct, info }: { title: string; pct: number; info: string }) => (
  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-2.5 shadow-sm">
    <div className="min-w-0">
      <div className="truncate text-[11px] font-bold text-foreground">{title}</div>
      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
        <MapPin size={10} /> {info}
      </div>
    </div>
    <span className="shrink-0 rounded-full bg-[#69a44f]/15 px-2 py-0.5 text-[10px] font-bold text-[#4e8a36]">{pct}% match</span>
  </div>
);

const DiscoveryPreview = () => (
  <div className="space-y-2">
    <MatchRow title="Frontend Developer" pct={96} info="Remote · ₹12 LPA" />
    <MatchRow title="UX Designer" pct={89} info="Bengaluru · ₹9 LPA" />
  </div>
);

const StatusRow = ({ title, status, color }: { title: string; status: string; color: string }) => (
  <div className="flex items-center justify-between rounded-xl border border-border/60 bg-white p-2.5 shadow-sm">
    <span className="truncate text-[11px] font-semibold text-foreground">{title}</span>
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${color}1a`, color }}>
      {status}
    </span>
  </div>
);

const ApplyPreview = () => (
  <div className="space-y-2">
    <StatusRow title="Frontend Developer" status="Shortlisted" color="#69a44f" />
    <StatusRow title="Sales Executive" status="In review" color="#e59f56" />
    <StatusRow title="UX Designer" status="Applied" color="#264a7f" />
  </div>
);

const InterviewPreview = () => (
  <div className="rounded-2xl border border-border/60 bg-white p-3 shadow-sm">
    <ul className="space-y-1.5">
      {["Mock interview booked", "Top questions ready", "Profile tips reviewed"].map((t) => (
        <li key={t} className="flex items-center gap-2 text-[11px] font-medium text-foreground">
          <CheckCircle2 size={13} className="shrink-0 text-[#69a44f]" /> {t}
        </li>
      ))}
    </ul>
    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#264a7f]/10 px-2 py-0.5 text-[10px] font-bold text-[#264a7f]">
      <Wallet size={10} /> Career support
    </span>
  </div>
);

const HiredPreview = () => (
  <div className="relative overflow-hidden rounded-2xl border border-[#69a44f]/30 bg-gradient-to-br from-[#69a44f]/10 to-white p-3 shadow-sm">
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#69a44f] text-white shadow">
        <Trophy size={16} />
      </span>
      <div className="flex-1">
        <div className="text-[11px] font-bold text-foreground">Offer Letter</div>
        <div className="text-[10px] text-muted-foreground">Congratulations — you&apos;re hired!</div>
      </div>
      <CheckCircle2 size={18} className="text-[#69a44f]" />
    </div>
    <div className="mt-2 flex gap-1">
      {["#264a7f", "#69a44f", "#e59f56", "#264a7f", "#69a44f"].map((c, i) => (
        <span key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: c }} />
      ))}
    </div>
  </div>
);

type Step = { icon: LucideIcon; title: string; description: string; preview: React.ReactNode };

const steps: Step[] = [
  {
    icon: UserPlus,
    title: "Create your professional profile",
    description: "Build a professional profile that highlights your experience, education, skills and career goals.",
    preview: <ProfilePreview />,
  },
  {
    icon: Video,
    title: "Upload a video introduction",
    description:
      "Introduce yourself in a short video so employers see your personality, communication and confidence before the interview.",
    preview: <VideoPreview />,
  },
  {
    icon: Sparkles,
    title: "Resume & profile improvement",
    description:
      "We help improve your resume and profile so you stand out to recruiters and get shortlisted more often.",
    preview: <ResumePreview />,
  },
  {
    icon: Target,
    title: "Smart job discovery",
    description:
      "Our matching system recommends jobs aligned to your skills, experience, preferred location and salary.",
    preview: <DiscoveryPreview />,
  },
  {
    icon: MousePointerClick,
    title: "Apply with one click",
    description: "Apply to multiple relevant jobs quickly and track every application from a single dashboard.",
    preview: <ApplyPreview />,
  },
  {
    icon: ClipboardCheck,
    title: "Interview preparation",
    description: "Prepare with interview guidance, practical tips and career support before meeting employers.",
    preview: <InterviewPreview />,
  },
  {
    icon: Trophy,
    title: "Get hired",
    description: "Receive offers and start your career with confidence — RecruitKr supports you the whole way.",
    preview: <HiredPreview />,
  },
];

/**
 * Candidate "Career Journey" — a horizontal scroll-snap slider on desktop and a
 * vertical card flow on mobile. Soft glass cards with per-step preview mock-ups.
 */
export default function CandidateJourneySection() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,rgba(38,74,127,0.08),transparent_45%),linear-gradient(180deg,#ffffff_0%,#f6faff_100%)] py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal as="div" className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#264a7f]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#264a7f]">
            Career Journey
          </span>
          <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Your career journey starts here
          </h2>
          <p className="mx-auto mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            RecruitKr helps every candidate create a professional profile, showcase their skills, connect with the right
            employers, and confidently secure their next opportunity.
          </p>
        </Reveal>

        <RevealGroup
          stagger={0.08}
          className="mt-12 flex flex-col gap-5 lg:flex-row lg:snap-x lg:snap-mandatory lg:gap-5 lg:overflow-x-auto lg:pb-4"
        >
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <RevealItem
                key={step.title}
                className="group relative flex flex-col gap-4 rounded-3xl border border-white/70 bg-white/70 p-5 shadow-[0_8px_30px_rgba(16,24,40,0.06)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:p-6 lg:w-[330px] lg:shrink-0 lg:snap-start"
              >
                <div className="flex items-center gap-3">
                  <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md" style={{ backgroundColor: NAVY }}>
                    <Icon size={20} />
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white"
                      style={{ backgroundColor: GREEN }}
                    >
                      {i + 1}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#69a44f]">Step {i + 1}</p>
                    <h3 className="font-heading text-base font-bold leading-snug text-foreground sm:text-lg">{step.title}</h3>
                  </div>
                </div>

                {step.preview}

                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>

                {/* progress connector dot */}
                {i < steps.length - 1 && (
                  <span aria-hidden className="absolute -bottom-3 left-1/2 z-10 hidden h-6 w-px -translate-x-1/2 bg-[#264a7f]/15 lg:block" />
                )}
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
