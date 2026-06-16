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
  return (
    <section className=" sm:py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: NAVY }}>
            Student Success Stories
          </h2>
          <span
            aria-hidden="true"
            className="mx-auto mt-4 block h-1 w-24 rounded-full"
            style={{ background: `linear-gradient(to right, ${NAVY}, ${GREEN}, ${AMBER})` }}
          />
        </div>

        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 pt-2 snap-x sm:gap-6">
          {reviews.map((review, index) => {
            const color = brandColors[index % brandColors.length];
            return (
              <div
                key={index}
                className="group relative flex min-w-[280px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl sm:min-w-[340px]"
              >
                {/* Top accent bar that grows on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-1.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ backgroundColor: color }}
                />
                {/* Soft colour glow on hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25"
                  style={{ backgroundColor: color }}
                />

                <Quote
                  className="mb-4 transition-transform duration-300 group-hover:scale-110"
                  size={32}
                  style={{ color }}
                  fill="currentColor"
                  strokeWidth={0}
                />

                <p className="flex-1 text-[15px] leading-relaxed text-slate-700">
                  {review.review}
                </p>

                <div className="mt-5 flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} style={{ color: AMBER }} fill="currentColor" />
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: color }}
                  >
                    {review.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold" style={{ color: NAVY }}>
                      {review.name}
                    </h3>
                    <p className="truncate text-xs font-medium" style={{ color }}>
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
