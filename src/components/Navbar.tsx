"use client";
import {
  Briefcase,
  Info,
  Mail,
  Menu,
  Newspaper,
  Trophy,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { memo, useCallback, useState } from "react";
import { Link, NavLink } from "@/compat/router";

const navItems: { label: string; path: string; icon: LucideIcon }[] = [
  { label: "About", path: "/about", icon: Info },
  { label: "Jobs", path: "/jobs", icon: Briefcase },
  { label: "Blogs", path: "/blog", icon: Newspaper },
  { label: "Contact us", path: "/contact", icon: Mail },
  { label: "Success Stories", path: "/success-stories", icon: Trophy },
  { label: "Team", path: "/our-team", icon: Users },
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
 

<nav className="bg-white border-b border-[#264a7f] fixed top-0 left-0 right-0 z-50 shadow-sm">
  {/* Tri-color brand accent strip: navy → green → amber */}

  <div className="max-w-7xl mx-auto flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">

    {/* Logo */}
    <Link to="/" aria-label="RecruitKr home" className="flex items-center shrink-0">
      <img
        src="/assets/logo.png"
        alt="RecruitKr"
        loading="eager"
        fetchPriority="high"
        className="h-24 w-auto -my-4 object-contain sm:h-28 sm:-my-6 lg:h-36 lg:-my-10"
      />
    </Link>

    {/* Nav Links (desktop) */}
    <div className="hidden lg:flex items-center text-[#264a7f] gap-8 xl:gap-7">
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
    <div className="flex items-center gap-4 lg:hidden">
      <Link
        to="/login"
        aria-label="Profile"
        className="text-[#264a7f] transition-colors hover:text-primary"
        onClick={closeMenu}
      >
        <User size={24} />
      </Link>
      <button
        className="text-foreground"
        onClick={toggleMenu}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>

  </div>

  {/* Mobile dropdown */}
  {open && (
    <div className="border-t border-border bg-white px-4 py-3 shadow-lg lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-3 text-sm font-medium transition-colors hover:bg-muted hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
            onClick={closeMenu}
          >
            <Icon size={16} />
            {item.label}
          </NavLink>
        );
      })}
    </div>
  )}
</nav>
  );
});

export default Navbar;
