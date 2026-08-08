"use client";
import {
  Briefcase,
  Mail,
  Menu,
  Newspaper,
  Trophy,
  User,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { memo, useCallback, useState } from "react";
import logoImage from "@/assets/logo-tagline.png";
import { Link, NavLink } from "@/compat/router";

const navItems: { label: string; path: string; icon: LucideIcon }[] = [
  { label: "Candidate", path: "/candidates", icon: UserRound },
  { label: "Employer", path: "/employers", icon: Briefcase },
  { label: "Assessment", path: "/assessment", icon: Newspaper },
  { label: "Training", path: "/training", icon: Mail },
  { label: "Partners", path: "/partners", icon: Trophy },
  { label: "Our Team", path: "/our-team", icon: Users },
];

const navLinkClass = (isActive: boolean) =>
  `relative text-[0.9rem] font-medium tracking-tight transition-colors hover:text-primary ${isActive ? "text-primary" : "text-foreground/70"
  } after:absolute after:left-0 after:-bottom-1.5 after:h-[2px] after:rounded-full after:bg-gradient-to-r after:from-[#264a7f] after:to-[#69a44f] after:transition-all after:duration-300 ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
  }`;

const Navbar = memo(function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleMenu = useCallback(() => setOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/40 bg-white/95 shadow-soft-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/90 dark:border-white/10 dark:bg-[#0d1a30]/90">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">

        {/* Full logo with the "Your Hiring Partner" tagline baked in, on a
            genuinely transparent background (white removed) — no white box,
            works on any navbar colour, light or dark. */}
        <Link to="/home" aria-label="RecruitKr home" className="flex shrink-0 items-center">
          {/* next/image, not a raw <img>: the source PNG is 912x391 (186 KB) but
              this renders at ~168x72, and it is the LCP element on every page.
              A bare <img src={logoImage.src}> ships the full-size PNG and cost
              ~1.8s of a 4.5s mobile LCP. Passing the static import lets Next
              serve a correctly-sized WebP/AVIF. `priority` replaces the old
              eager + fetchPriority="high" pair. */}
          <Image
            src={logoImage}
            alt="RecruitKr — Your Hiring Partner"
            width={168}
            height={72}
            priority
            className="h-16 w-auto object-contain sm:h-[4.5rem]"
          />
        </Link>

        {/* Nav Links (desktop) */}
        <div className="hidden items-center gap-7 text-[#264a7f] lg:flex xl:gap-8 dark:text-foreground">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 whitespace-nowrap ${navLinkClass(isActive)}`
                }
              >
                <Icon size={16} />
                {item.label}
              </NavLink>
            );
          })}

          {/* Profile (right side, after Team) */}
          <NavLink
            to="/login"
            className="sheen glow-navy group ml-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#264a7f] to-[#69a44f] px-5 py-2.5 text-[0.9rem] font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
          >
            <User size={16} />
            Profile
          </NavLink>
        </div>

        {/* Mobile actions: profile + menu */}
        <div className="flex items-center gap-1 lg:hidden">
          <Link
            to="/login"
            aria-label="Profile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#264a7f] transition-colors hover:bg-muted hover:text-primary"
            onClick={closeMenu}
          >
            <User size={22} />
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#264a7f] transition-colors hover:bg-muted hover:text-primary"
            onClick={toggleMenu}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile dropdown */}
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-40 bg-black/20 sm:top-20 lg:hidden"
            onClick={closeMenu}
          />
          <div
            id="mobile-nav-menu"
            className="animate-pop-in relative z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border/60 bg-white/90 px-3 py-3 shadow-soft-lg backdrop-blur-xl dark:bg-[#0d1a30]/90 lg:hidden"
          >
            {[...navItems, { label: "Profile", path: "/login", icon: User }].map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex min-h-[3rem] items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium transition-colors hover:bg-muted hover:text-primary ${
                      isActive ? "bg-primary/5 text-primary" : "text-foreground/80"
                    }`
                  }
                  onClick={closeMenu}
                >
                  <Icon size={18} className="shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </>
      )}
    </nav>
  );
});

export default Navbar;
