"use client";
import { type ReactNode } from "react";

type DeferredSectionProps = {
  children: ReactNode;
  className?: string;
  fallback?: ReactNode;
  rootMargin?: string;
};

/** Renders children immediately — kept for backwards compatibility with older pages. */
const DeferredSection = ({ children, className }: DeferredSectionProps) => {
  return <div className={className}>{children}</div>;
};

export default DeferredSection;
