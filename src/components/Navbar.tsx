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
import { memo, useCallback, useState } from "react";
import logoImage from "@/assets/logo.jpeg";
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
  `relative text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"
  } after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-primary after:transition-all after:duration-300 ${isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
  }`;

const Navbar = memo(function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleMenu = useCallback(() => setOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[#264a7f]/80 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link to="/" aria-label="RecruitKr home" className="flex shrink-0 items-center">
          <img
            src={logoImage.src}
            alt="RecruitKr"
            loading="eager"
            fetchPriority="high"
            className="h-12 w-auto object-contain sm:h-16"
          />
        </Link>

        {/* Nav Links (desktop) */}
        <div className="hidden items-center gap-8 text-[#264a7f] lg:flex xl:gap-7">
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
            className={({ isActive }) =>
              `inline-flex items-center gap-1.5 whitespace-nowrap ${navLinkClass(isActive)}`
            }
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
            className="animate-pop-in relative z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-white px-3 py-2 shadow-lg lg:hidden"
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
