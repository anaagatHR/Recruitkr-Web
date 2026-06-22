"use client";

import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  ChevronRight,
  LogIn,
  MapPin,
  Star,
  Video,
  Headset,
  type LucideIcon,
} from "lucide-react";

import { Link } from "@/compat/router";
import { apiGet } from "@/lib/api";
 

type RatingCard = { title: string; subtitle: string; rating: number };
type VideoItem = { name: string; url: string; fileId?: string };

// Only the three logo colours are used here (navy, green, amber).
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const jobProfiles: RatingCard[] = [
  { title: "Job Profile", subtitle: "Recruiter Rating", rating: 4 },
  { title: "Candidate Rating", subtitle: "Candidate Rating", rating: 5 },
  { title: "Accuracy Rating", subtitle: "Listing Rating", rating: 4 },
  { title: "Numerical Rating", subtitle: "Score Rating", rating: 3 },
];

const processSteps: { title: string; desc: string; icon: LucideIcon; color: string }[] = [
  { title: "Candidate Login", desc: "Sign in to your candidate account", icon: LogIn, color: NAVY },
  { title: "Virtual Assistance", desc: "Get guided support every step", icon: Headset, color: GREEN },
  { title: "Interview in VC", desc: "Attend the video call interview", icon: Video, color: AMBER },
  { title: "Walk-in Interview", desc: "Meet the employer in person", icon: MapPin, color: NAVY },
  { title: "Candidate Card", desc: "Receive your verified profile card", icon: BadgeCheck, color: GREEN },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < rating ? "currentColor" : "none"}
          className={i < rating ? "" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}

export default function JobShowcase() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const sliderRef = useRef<HTMLDivElement>(null);

  // 👇 THIS IS YOUR VIDEO FETCH useEffect (yaha lagana hai)
  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await apiGet<{ data: VideoItem[] }>("/uploads/videos")
    setVideos(res || []);
      } catch (err) {
        console.log("Video fetch error:", err);
      }
    }

    fetchVideos();
  }, []);

  // 👇 already existing slider effect (isko rehne do)
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const interval = setInterval(() => {
      slider.scrollBy({
        left: 300,
        behavior: "smooth",
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

return (
  <section className="bg-white py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Available Job Profiles */}
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Available Jobs 
          </h2>
        </div>

      <div  
  ref={sliderRef}
  className="mb-14 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
>
          {jobProfiles.map((card) => (
            <div
              key={card.title}
              className="min-w-[280px] shrink-0 snap-center rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-3 flex items-start justify-between">
                <h3 className="text-base font-bold text-foreground">{card.title}</h3>
                <span className="rounded-md bg-[#22c198]/15 px-2 py-0.5 text-[10px] font-semibold text-[#1a9c7a]">
                  Active
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{card.subtitle}</p>
              <Stars rating={card.rating} />
            </div> 
          ))}
        </div>

        {/* Few Job Videos */}
        <h2 className="mb-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Few Job Videos
        </h2>

        {videos.length > 0 && (
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden">
            {videos.map((video) => (
              <div
                key={video.fileId ?? video.url}
                className="relative aspect-video w-[280px] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-slate-900 shadow-sm sm:w-[420px] lg:w-[520px]"
              >
                <video
                  src={video.url}
                  controls
                  controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                  disablePictureInPicture
                  preload="metadata"
                  playsInline
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {videos.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">No videos yet.</p>
        )}

        {videos.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Link
              to="/success-stories"
              className="rounded-full bg-[#22c198] px-8 py-2.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:bg-[#1a9c7a] hover:shadow-lg"
            >
              Show more
            </Link>
          </div>
        )}

        {/* How You Work in the Real World */}
        <h2 className="mb-6 mt-14 text-2xl font-extrabold tracking-tight sm:text-3xl">
          How You Work in the Real World
        </h2>

        <div className="flex items-start justify-between gap-1 sm:gap-2">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === processSteps.length - 1;
            return (
              <div key={step.title} className="flex flex-1 items-start">
                {/* Step */}
                <div className="group flex flex-1 flex-col items-center text-center">
                  <div className="relative">
                    {/* Pulsing ring */}
                    <span
                      className="absolute inset-0 animate-ping rounded-2xl opacity-20"
                      style={{ backgroundColor: step.color }}
                    />
                    <div
                      className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 sm:h-16 sm:w-16"
                      style={{ backgroundColor: step.color }}
                    >
                      <Icon className="h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.2} />
                      <span
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold text-white sm:h-6 sm:w-6 sm:text-[11px]"
                        style={{ backgroundColor: step.color }}
                      >
                        {index + 1}
                      </span>
                    </div>
                  </div>
                  <h3
                    className="mt-2 text-[10px] font-bold leading-tight sm:mt-3 sm:text-sm"
                    style={{ color: NAVY }}
                  >
                    {step.title}
                  </h3>
                  <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{step.desc}</p>
                </div>

                {/* Animated connector between steps (aligned with the icon row) */}
                {!isLast && (
                  <ChevronRight
                    className="mt-3 shrink-0 animate-pulse sm:mt-5"
                    size={20}
                    style={{ color: step.color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}