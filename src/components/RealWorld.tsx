import { Quote } from "lucide-react";

// Only the three logo colours are used across this section.
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const stories = [
  {
    quote:
      "From a small town with no connections to a full-time developer role — RecruitKr made it possible.",
    name: "Suresh Kumar",
    role: "Software Developer",
    color: NAVY,
  },
  {
    quote:
      "I had the skills but no one gave me a chance. Here I got real projects and my first job offer.",
    name: "Anjali Mehta",
    role: "Data Analyst",
    color: GREEN,
  },
  {
    quote:
      "The mentorship changed everything. I walked into interviews confident and ready.",
    name: "Imran Khan",
    role: "Support Engineer",
    color: AMBER,
  },
];

function RealWorld() {
  return (
    <section className="bg-white py-10 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: NAVY }}>
            Stories of Real-World People
          </h2>
          <span
            aria-hidden="true"
            className="mx-auto mt-4 block h-1 w-24 rounded-full"
            style={{ background: `linear-gradient(to right, ${NAVY}, ${GREEN}, ${AMBER})` }}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <article
              key={story.name}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            >
              {/* Top accent bar that grows on hover */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                style={{ backgroundColor: story.color }}
              />

              {/* Soft colour glow on hover */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25"
                style={{ backgroundColor: story.color }}
              />

              {/* Quote mark */}
              <Quote
                className="mb-4 transition-transform duration-300 group-hover:scale-110"
                size={34}
                style={{ color: story.color }}
                fill="currentColor"
                strokeWidth={0}
              />

              <p className="relative text-[15px] leading-relaxed text-slate-700">
                {story.quote}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: story.color }}
                >
                  {story.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold" style={{ color: NAVY }}>
                    {story.name}
                  </h3>
                  <p className="truncate text-xs font-medium" style={{ color: story.color }}>
                    {story.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default RealWorld;
