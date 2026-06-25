"use client";

import { useRef, useEffect } from "react";
import { PlayCircle } from "lucide-react";

const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";
const brandColors = [NAVY, GREEN, AMBER];

const reviews = [
  {
    name: "Rahul Sharma",
    role: "Frontend Intern",
    review:
      "I was rejected by many companies. Here I got real project experience and confidence.",
  },
  {
    name: "Priya Patel",
    role: "Java Trainee",
    review:
      "The mentorship and practical training helped me become interview ready.",
  },
  {
    name: "Aman Verma",
    role: "Full Stack Intern",
    review: "Working on live projects gave me real-world experience.",
  },
  {
    name: "Neha Singh",
    role: "Backend Intern",
    review: "Amazing learning environment and supportive mentors.",
  },
];

export default function ReviewsSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;

    const step = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll - 2) {
        el.scrollTo({ left: 0, behavior: "auto" });
      } else {
        el.scrollBy({ left: 1, behavior: "auto" });
      }
    };

    intervalRef.current = window.setInterval(step, 16);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, []);

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
            style={{
              background: `linear-gradient(to right, ${NAVY}, ${GREEN}, ${AMBER})`,
            }}
          />
        </div>

        {/* SLIDER */}
        <div
          ref={sliderRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 pt-2"
        >
          {[...reviews, ...reviews].map((review, index) => {
            const color = brandColors[index % brandColors.length];

            return (
              <div
                key={index}
                className="group relative flex w-[240px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-0 shadow-sm transition hover:-translate-y-2 hover:shadow-2xl sm:w-[280px]"
              >
                <div className="p-5">
                  <p className="text-[15px] leading-7 text-slate-700">
                    {review.review}
                  </p>
                </div>

                <div className="relative h-[360px] overflow-hidden">
                  <video
                    className="h-full w-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    style={{
                      objectPosition: "center top",
                      transform: "rotate(90deg) scale(1.45)",
                      transformOrigin: "center center",
                    }}
                  >
                    <source src="https://www.w3schools.com/html/mov_bbb.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent" />
                </div>

                <div className="p-5 pt-4">

                  <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-5">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-full font-bold text-white"
                      style={{ backgroundColor: color }}
                    >
                      {review.name.charAt(0)}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold" style={{ color: NAVY }}>
                        {review.name}
                      </h3>
                      <p className="text-xs font-medium" style={{ color }}>
                        {review.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}