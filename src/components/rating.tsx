"use client";

import { useRef, useEffect } from "react";
import { Quote, Star } from "lucide-react";

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoSlide = () => {
    stopAutoSlide();

    intervalRef.current = setInterval(() => {
      if (!sliderRef.current) return;

      const el = sliderRef.current;

      const maxScroll = el.scrollWidth - el.clientWidth;

      if (el.scrollLeft >= maxScroll) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: 550, behavior: "smooth" });
      }
    }, 2500);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  return (
    <section className="sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2
            className="text-3xl font-extrabold md:text-4xl"
            style={{ color: NAVY }}
          >
            Student Success Stories
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
          onMouseEnter={stopAutoSlide}
          onMouseLeave={startAutoSlide}
          className="flex gap-5 overflow-x-auto scroll-smooth scrollbar-hide pb-4 pt-2"
        >
          {reviews.map((review, index) => {
            const color = brandColors[index % brandColors.length];

            return (
              <div
                key={index}
                className="group relative flex min-w-[280px] flex-shrink-0 flex-col rounded-3xl border bg-white p-7 shadow-sm transition hover:-translate-y-2 hover:shadow-2xl sm:min-w-[340px]"
              >
                {/* Top bar */}
                <span
                  className="absolute inset-x-0 top-0 h-1.5 scale-x-0 origin-left transition group-hover:scale-x-100"
                  style={{ backgroundColor: color }}
                />

                {/* Quote icon */}
                <Quote
                  size={32}
                  style={{ color }}
                  fill="currentColor"
                  strokeWidth={0}
                />

                {/* Review text */}
                <p className="mt-3 text-[15px] text-slate-700">
                  {review.review}
                </p>

                {/* Stars */}
                <div className="mt-4 flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={16}
                      style={{ color: AMBER }}
                      fill="currentColor"
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center gap-3 border-t pt-5">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-white"
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
            );
          })}
        </div>

      </div>
    </section>
  );
}