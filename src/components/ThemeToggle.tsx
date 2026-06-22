"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

/**
 * Light/dark toggle. Rendered inside the dashboards. Waits for mount before
 * showing the icon so the server/client markup matches (next-themes only knows
 * the real theme on the client).
 */
const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={
        "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-[0_8px_24px_rgba(38,74,127,0.15)] transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#264a7f] " +
        className
      }
    >
      {mounted ? (
        isDark ? <Sun size={18} className="text-[#e59f56]" /> : <Moon size={18} className="text-[#264a7f]" />
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
};

export default ThemeToggle;
