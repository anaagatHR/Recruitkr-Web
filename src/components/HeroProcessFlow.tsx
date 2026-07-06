"use client";

import { Fragment, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, CalendarCheck, MessagesSquare, Search, Send } from "lucide-react";

// The five stages of the RecruitKr journey, in order. This runs as a subtle
// animated ribbon low in the hero so a first-time visitor can see, at a glance,
// how the whole site works end-to-end: search → apply → chat → interview → hired.
const STEPS = [
  { icon: Search, label: "Search jobs" },
  { icon: Send, label: "Apply free" },
  { icon: MessagesSquare, label: "Chat with recruiters" },
  { icon: CalendarCheck, label: "Track & interview" },
  { icon: BadgeCheck, label: "Get hired" },
] as const;

const STEP_MS = 1800;

const HeroProcessFlow = () => {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Reduced motion: light every stage and stop — no cycling.
    if (reduceMotion) {
      setActive(STEPS.length - 1);
      return;
    }
    const id = setInterval(() => {
      setActive((current) => (current + 1) % STEPS.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-4 z-[2] hidden px-6 lg:block"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-center rounded-full border border-slate-200 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-md">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === active;
          const isDone = index < active;

          return (
            <Fragment key={step.label}>
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : { scale: isActive ? 1.15 : 1, opacity: isActive || isDone ? 1 : 0.55 }
                  }
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border ${
                    isActive
                      ? "border-[#69a44f] bg-[#69a44f] text-white shadow-[0_0_18px_rgba(105,164,79,0.5)]"
                      : isDone
                        ? "border-[#69a44f]/60 bg-[#69a44f]/15 text-[#4d7a38]"
                        : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  <Icon size={16} />
                  {isActive && !reduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-[#69a44f]"
                      initial={{ opacity: 0.7, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.8 }}
                      transition={{ duration: STEP_MS / 1000, ease: "easeOut", repeat: Infinity }}
                    />
                  )}
                </motion.div>
                <span
                  className={`whitespace-nowrap text-[11px] font-medium transition-colors duration-300 ${
                    isActive ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div className="relative mx-2 h-px flex-1 self-start bg-slate-200" style={{ marginTop: "18px" }}>
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#69a44f] to-[#e59f56]"
                    initial={false}
                    animate={{ width: index < active ? "100%" : "0%" }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default HeroProcessFlow;
