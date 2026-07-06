"use client";

import { motion, useReducedMotion } from "framer-motion";

// Animated "talent network" that stands in for a hero video: nodes are
// candidates/companies, the lines are matches, and glowing pulses travel along
// them — a living picture of what RecruitKr does. Pure SVG + framer-motion, so
// there is no heavy video file to download and nothing can 404.

type Node = { x: number; y: number; c: string; d: number };

// Percentage coordinates across the hero. Kept a little sparser through the
// middle where the headline and search card sit.
const NODES: Node[] = [
  { x: 8, y: 20, c: "#69a44f", d: 0 },
  { x: 19, y: 44, c: "#e59f56", d: 0.6 },
  { x: 13, y: 70, c: "#8fb3e0", d: 1.2 },
  { x: 29, y: 24, c: "#69a44f", d: 0.3 },
  { x: 33, y: 80, c: "#e59f56", d: 0.9 },
  { x: 48, y: 14, c: "#8fb3e0", d: 1.5 },
  { x: 60, y: 22, c: "#69a44f", d: 0.4 },
  { x: 63, y: 74, c: "#8fb3e0", d: 1.1 },
  { x: 75, y: 40, c: "#e59f56", d: 0.7 },
  { x: 82, y: 66, c: "#69a44f", d: 1.4 },
  { x: 91, y: 26, c: "#8fb3e0", d: 0.2 },
  { x: 88, y: 82, c: "#e59f56", d: 1.0 },
  { x: 50, y: 88, c: "#69a44f", d: 0.5 },
];

// Pairs of node indices to connect with a faint line.
const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [1, 3], [3, 5], [2, 4], [4, 12], [5, 6], [6, 8],
  [7, 12], [7, 9], [8, 9], [8, 10], [9, 11], [10, 8], [3, 0], [6, 5],
];

// A subset of edges that carry a travelling "match" pulse.
const PULSES: Array<[number, number]> = [
  [0, 1], [3, 5], [5, 6], [8, 9], [7, 12], [10, 8],
];

const HeroAnimatedBackground = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* Deep brand gradient base (replaces the old poster image). */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,#123056,transparent_55%),radial-gradient(circle_at_80%_75%,#1c3a24,transparent_55%),linear-gradient(160deg,#060d1c,#0a1730)]" />

      {/* Connective lines — percentage coords so they scale with the hero. */}
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {EDGES.map(([a, b], i) => (
          <line
            key={`edge-${i}`}
            x1={`${NODES[a].x}%`}
            y1={`${NODES[a].y}%`}
            x2={`${NODES[b].x}%`}
            y2={`${NODES[b].y}%`}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={1}
          />
        ))}
      </svg>

      {/* Glowing nodes. */}
      {NODES.map((node, i) => (
        <motion.span
          key={`node-${i}`}
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            marginLeft: -5,
            marginTop: -5,
            backgroundColor: node.c,
            boxShadow: `0 0 14px ${node.c}`,
          }}
          animate={reduceMotion ? undefined : { opacity: [0.4, 1, 0.4], scale: [0.85, 1.25, 0.85] }}
          transition={{ duration: 3.6, delay: node.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Travelling match pulses along a few edges. */}
      {!reduceMotion &&
        PULSES.map(([a, b], i) => (
          <motion.span
            key={`pulse-${i}`}
            className="absolute h-1.5 w-1.5 rounded-full bg-white"
            style={{ marginLeft: -3, marginTop: -3, boxShadow: "0 0 10px rgba(255,255,255,0.9)" }}
            initial={{ left: `${NODES[a].x}%`, top: `${NODES[a].y}%`, opacity: 0 }}
            animate={{
              left: [`${NODES[a].x}%`, `${NODES[b].x}%`],
              top: [`${NODES[a].y}%`, `${NODES[b].y}%`],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 2.6, delay: i * 0.7, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
          />
        ))}
    </div>
  );
};

export default HeroAnimatedBackground;
