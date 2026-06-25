"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/** Brand easing — a soft "ease-out-expo" curve that feels premium. */
const EASE = [0.22, 1, 0.36, 1] as const;

/** Single child fade + slide-up. Used inside RevealGroup for staggered grids. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before this element animates in. */
  delay?: number;
  /** Pixels to travel on the Y axis (default 24). */
  y?: number;
  /** Render as a different element while keeping motion (e.g. "section"). */
  as?: "div" | "section" | "li" | "span";
};

/**
 * Reveals its children with a fade + slide-up the first time they scroll into
 * view. Honors the user's reduced-motion preference automatically.
 */
export function Reveal({ children, className, delay = 0, y = 24, as = "div" }: RevealProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  /** Seconds between each child's entrance (default 0.08). */
  stagger?: number;
  delay?: number;
  as?: "div" | "ul";
};

/**
 * Wraps a grid/list so its {@link RevealItem} children animate in one after
 * another as the group scrolls into view.
 */
export function RevealGroup({ children, className, stagger = 0.08, delay = 0, as = "div" }: RevealGroupProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </MotionTag>
  );
}

type RevealItemProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
};

/** A staggered child of {@link RevealGroup}. */
export function RevealItem({ children, className, as = "div" }: RevealItemProps) {
  const MotionTag = motion[as];
  return (
    <MotionTag className={className} variants={fadeUp}>
      {children}
    </MotionTag>
  );
}
