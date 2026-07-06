"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Briefcase, UserRound } from "lucide-react";

// Light, animated "hiring" scene that replaces the old hero video: people
// (candidates + recruiters) float around job hubs and connect to them, with a
// glowing pulse travelling along each link to show a match being made. Pure
// SVG + framer-motion — no video file to 404 or download.

const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

// Two job hubs (briefcase) placed low-left and upper-right, away from the
// headline and search card.
const HUBS = [
  { x: 24, y: 72 },
  { x: 74, y: 28 },
];

// People avatars. `hub` picks which job they connect to; `c` is the accent.
const PEOPLE = [
  { x: 9, y: 84, hub: 0, c: GREEN, d: 0.0 },
  { x: 7, y: 52, hub: 0, c: AMBER, d: 0.8 },
  { x: 21, y: 40, hub: 0, c: NAVY, d: 1.5 },
  { x: 40, y: 86, hub: 0, c: AMBER, d: 0.4 },
  { x: 59, y: 13, hub: 1, c: GREEN, d: 1.1 },
  { x: 89, y: 19, hub: 1, c: NAVY, d: 0.3 },
  { x: 93, y: 50, hub: 1, c: AMBER, d: 1.3 },
  { x: 62, y: 40, hub: 1, c: GREEN, d: 0.6 },
  { x: 85, y: 76, hub: 1, c: NAVY, d: 1.7 },
];

const HeroAnimatedBackground = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* Soft, bright brand gradient base. */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(105,164,79,0.14),transparent_50%),radial-gradient(circle_at_82%_30%,rgba(38,74,127,0.14),transparent_50%),linear-gradient(160deg,#ffffff,#eef4fb_55%,#eef6ef)]" />

      {/* Links from each person to their job hub. */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {PEOPLE.map((p, i) => {
          const hub = HUBS[p.hub];
          return (
            <line
              key={`link-${i}`}
              x1={`${p.x}%`}
              y1={`${p.y}%`}
              x2={`${hub.x}%`}
              y2={`${hub.y}%`}
              stroke="rgba(38,74,127,0.16)"
              strokeWidth={1}
            />
          );
        })}
      </svg>

      {/* Job hubs. */}
      {HUBS.map((hub, i) => (
        <div
          key={`hub-${i}`}
          className="absolute flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg"
          style={{
            left: `${hub.x}%`,
            top: `${hub.y}%`,
            marginLeft: -22,
            marginTop: -22,
            background: `linear-gradient(135deg, ${NAVY}, ${GREEN})`,
            boxShadow: "0 10px 26px rgba(38,74,127,0.28)",
          }}
        >
          <Briefcase size={20} />
          {!reduceMotion && (
            <motion.span
              className="absolute inset-0 rounded-2xl border-2"
              style={{ borderColor: GREEN }}
              initial={{ opacity: 0.5, scale: 1 }}
              animate={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: i * 0.6 }}
            />
          )}
        </div>
      ))}

      {/* People avatars — gently floating. */}
      {PEOPLE.map((p, i) => (
        <motion.div
          key={`person-${i}`}
          className="absolute flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white shadow-md"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            marginLeft: -16,
            marginTop: -16,
            borderColor: p.c,
            color: p.c,
          }}
          animate={reduceMotion ? undefined : { y: [0, -6, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 4.5, delay: p.d, repeat: Infinity, ease: "easeInOut" }}
        >
          <UserRound size={16} />
        </motion.div>
      ))}

      {/* Match pulses travelling person -> job hub. */}
      {!reduceMotion &&
        PEOPLE.map((p, i) => {
          if (i % 2 !== 0) return null; // pulse on every other link, keeps it calm
          const hub = HUBS[p.hub];
          return (
            <motion.span
              key={`pulse-${i}`}
              className="absolute h-2 w-2 rounded-full"
              style={{
                marginLeft: -4,
                marginTop: -4,
                backgroundColor: p.c,
                boxShadow: `0 0 10px ${p.c}`,
              }}
              initial={{ left: `${p.x}%`, top: `${p.y}%`, opacity: 0 }}
              animate={{
                left: [`${p.x}%`, `${hub.x}%`],
                top: [`${p.y}%`, `${hub.y}%`],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.4,
                delay: i * 0.5,
                repeat: Infinity,
                repeatDelay: 1.6,
                ease: "easeInOut",
              }}
            />
          );
        })}
    </div>
  );
};

export default HeroAnimatedBackground;
