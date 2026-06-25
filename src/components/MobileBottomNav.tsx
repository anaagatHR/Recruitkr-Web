"use client";

import { Building2, Home, Search, Sparkles, User, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { Link } from "@/compat/router";
import { cn } from "@/lib/utils";

type BottomNavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Match the path itself and any nested route under it. */
  match: (pathname: string) => boolean;
};

const items: BottomNavItem[] = [
  { label: "Home", path: "/", icon: Home, match: (p) => p === "/" },
  { label: "Jobs", path: "/jobs", icon: Search, match: (p) => p.startsWith("/jobs") },
  { label: "Companies", path: "/companies", icon: Building2, match: (p) => p.startsWith("/companies") },
  { label: "Applied", path: "/applications", icon: Sparkles, match: (p) => p.startsWith("/applications") },
  { label: "Profile", path: "/login", icon: User, match: (p) => p.startsWith("/login") || p.startsWith("/signup") },
];

/**
 * Routes that own their full-height chrome (their own headers / chat composer /
 * sidebars), where a global bottom bar would either collide or add noise.
 */
const HIDDEN_PREFIXES = ["/dashboard", "/messages", "/forgot-password", "/reset-password"];

/**
 * Thumb-friendly bottom navigation for phones/tablets (hidden from `lg` up,
 * where the desktop navbar takes over). Renders an in-flow spacer so page
 * content/footer always clears the fixed bar, and respects the iOS safe area.
 * The floating chat bot already sits at `bottom-20` to clear this bar.
 */
const MobileBottomNav = memo(function MobileBottomNav() {
  const pathname = usePathname() || "/";

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <>
      {/* Keeps the page footer / last content clear of the fixed bar. */}
      <div
        aria-hidden
        className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden"
      />

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.18)] backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {items.map(({ label, path, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={label} className="flex-1">
                <Link
                  to={path}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 pt-1.5 pb-1 text-[0.6875rem] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.4 : 1.9}
                    className="shrink-0"
                  />
                  <span className="leading-none">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
});

export default MobileBottomNav;
