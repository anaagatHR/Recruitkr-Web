"use client";

import { useRef, useEffect, useState } from "react";
import { fetchHomeStories, type HomeStory } from "@/lib/videos";

const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";
const brandColors = [NAVY, GREEN, AMBER];

// Shown only until real stories exist (managed from the CRM → Web Panel → Home Stories).
const fallbackReviews: HomeStory[] = [
  { id: "f1", name: "Rahul Sharma", role: "Frontend Intern", text: "I was rejected by many companies. Here I got real project experience and confidence.", link: "", image: "", video: "" },
  { id: "f2", name: "Priya Patel", role: "Java Trainee", text: "The mentorship and practical training helped me become interview ready.", link: "", image: "", video: "" },
  { id: "f3", name: "Aman Verma", role: "Full Stack Intern", text: "Working on live projects gave me real-world experience.", link: "", image: "", video: "" },
  { id: "f4", name: "Neha Singh", role: "Backend Intern", text: "Amazing learning environment and supportive mentors.", link: "", image: "", video: "" },
];

export default function ReviewsSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const [stories, setStories] = useState<HomeStory[] | null>(null);

  useEffect(() => {
    fetchHomeStories().then(setStories).catch(() => setStories([]));
  }, []);

  const items = stories && stories.length ? stories : fallbackReviews;
  const cards = [...items, ...items];

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const step = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 2) el.scrollTo({ left: 0, behavior: "auto" });
      else el.scrollBy({ left: 1, behavior: "auto" });
    };
    intervalRef.current = window.setInterval(step, 16);
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [stories]);

  return (
    <section className="sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2
            className="text-3xl font-extrabold md:text-4xl"
            style={{
              background: `linear-gradient(90deg, ${NAVY}, ${GREEN})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            Success Stories (Candidates)
          </h2>
          <span
            className="mx-auto mt-4 block h-1 w-24 rounded-full"
            style={{ background: `linear-gradient(to right, ${NAVY}, ${GREEN}, ${AMBER})` }}
          />
        </div>

        {/* SLIDER */}
        <div ref={sliderRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 pt-2">
          {cards.map((card, index) => {
            const color = brandColors[index % brandColors.length];
            const Wrapper: React.ElementType = card.link ? "a" : "div";
            const wrapperProps = card.link ? { href: card.link, target: "_blank", rel: "noopener noreferrer" } : {};
            return (
              <Wrapper
                key={`${card.id}-${index}`}
                {...wrapperProps}
                className="group relative flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-0 shadow-sm transition hover:-translate-y-2 hover:shadow-2xl sm:w-[280px]"
              >
                {card.text ? (
                  <div className="p-5 pb-3">
                    <p className="text-[15px] leading-7 text-slate-700">{card.text}</p>
                  </div>
                ) : null}

                {card.video ? (
                  <div className="relative h-[360px] overflow-hidden bg-black">
                    <video className="h-full w-full object-cover" src={card.video} autoPlay muted loop playsInline preload="metadata" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                  </div>
                ) : card.image ? (
                  <div className="relative h-[360px] overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="h-full w-full object-cover" src={card.image} alt={card.name || "Success story"} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent" />
                  </div>
                ) : null}

                <div className="p-5 pt-4">
                  <div className="mt-1 flex items-center gap-3 border-t border-slate-200 pt-5">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {(card.name || "R").charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: NAVY }}>{card.name || "Candidate"}</h3>
                      {card.role ? <p className="text-xs font-medium" style={{ color }}>{card.role}</p> : null}
                    </div>
                  </div>
                </div>
              </Wrapper>
            );
          })}
        </div>
      </div>
    </section>
  );
}
