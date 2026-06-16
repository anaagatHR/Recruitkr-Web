"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Building2, GraduationCap, Smile, type LucideIcon } from "lucide-react";

const stats: { value: string; label: string; color: string; icon: LucideIcon }[] = [
  { value: "100+", label: "Candidates Placed", color: "#264a7f", icon: Users },
  { value: "50", label: "Hiring Companies", color: "#69a44f", icon: Building2 },
  { value: "200+", label: "Interns Trained", color: "#e59f56", icon: GraduationCap },
  { value: "100+", label: "Placement Satisfaction", color: "#264a7f", icon: Smile },
];

// Splits "10,000+" -> { target: 10000, suffix: "+" }, "94%" -> { target: 94, suffix: "%" }
function parseStat(value: string) {
  const match = value.match(/^([\d.,]+)(.*)$/);
  const numberPart = match ? match[1] : value;
  const suffix = match ? match[2] : "";
  const target = Number(numberPart.replace(/,/g, "")) || 0;
  return { target, suffix };
}

function AnimatedCounter({ value, start }: { value: string; start: boolean }) {
  const { target, suffix } = parseStat(value);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

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

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target]);

  return (
    <span>
      {count.toLocaleString("en-US")}
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
    <section ref={sectionRef} className="py-6 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-14">
          
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">
             Candidates Placed
          </h2>
          {/* Tri-color underline (navy → green → amber) */}
          <span
            aria-hidden="true"
            className="mx-auto mt-4 block h-1 w-24 rounded-full bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56]"
          />
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4">
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
                  <AnimatedCounter value={stat.value} start={started} />
                </div>
                <div className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">
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
