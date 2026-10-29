"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Building2, GraduationCap, Smile, type LucideIcon } from "lucide-react";

/**
 * Each figure carries its own suffix, so "Placement Satisfaction" reads
 * "100%" rather than the "100+" that the shared-suffix version produced —
 * a satisfaction score with a plus sign means nothing. These are company
 * track-record numbers (placements made over time), not the live board
 * count, which lives in the hero and comes from /api/v1/stats.
 */
type Stat = { value: number; suffix: string; label: string; color: string; icon: LucideIcon };

const stats: Stat[] = [
  { value: 100, suffix: "+", label: "Candidates Placed", color: "#264a7f", icon: Users },
  { value: 50, suffix: "", label: "Hiring Companies", color: "#69a44f", icon: Building2 },
  { value: 200, suffix: "+", label: "Interns Trained", color: "#e59f56", icon: GraduationCap },
  { value: 100, suffix: "%", label: "Placement Satisfaction", color: "#264a7f", icon: Smile },
];

/**
 * Server-renders the FINAL value and only animates on the client once the
 * section scrolls into view. The old version initialised at 0, so the HTML
 * Google (and anyone without JS) received said "0+", "0", "0+", "0+" across
 * the credibility section.
 */
function AnimatedCounter({ target, suffix, start }: { target: number; suffix: string; start: boolean }) {
  const [count, setCount] = useState(target);
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!start || prefersReducedMotion) return;

    const duration = 1600; // ms
    let frame: number;
    let startTime: number | null = null;

    const tick = (now: number) => {
      if (startTime === null) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      // easeOutCubic for a natural slow-down
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    setCount(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, prefersReducedMotion]);

  return (
    <span>
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

function Placement() {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Start the 0 -> N count-up the first time the section scrolls into
        // view, then stop observing so it stays at the final number.
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-14 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Same eyebrow → heading → subtitle header as the other sections, so
            the page reads as one system rather than four different designs. */}
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e59f56]/25 bg-[#e59f56]/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#c07c33]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#e59f56]" />
            By the numbers
          </span>
          <h2 className="mt-4 font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:mt-5 sm:text-3xl lg:text-4xl">
            Candidates Placed
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Real hires, real companies — the results behind the roles you see on the board.
          </p>
          {/* Tri-color underline (navy → green → amber) */}
          <span
            aria-hidden="true"
            className="mx-auto mt-5 block h-1 w-24 rounded-full bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 text-center transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:rounded-2xl sm:p-6"
              >
                {/* Soft brand-tinted glow that appears on hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ backgroundColor: stat.color }}
                />

                {/* Icon badge in the matching brand color */}
                <div
                  className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 sm:mb-3 sm:h-12 sm:w-12 sm:rounded-xl"
                  style={{ backgroundColor: `${stat.color}1a`, color: stat.color }}
                >
                  <Icon className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={2.2} />
                </div>

                <div
                  className="text-xl font-extrabold tracking-tight sm:text-3xl md:text-4xl"
                  style={{ color: stat.color }}
                >
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} start={started} />
                </div>
                <div className="mt-1 text-xs font-medium leading-tight text-muted-foreground sm:text-sm">
                  {stat.label}
                </div>

                {/* Bottom brand accent bar */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
                  style={{ backgroundColor: stat.color }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Placement;
