"use client";

import { type ComponentType, type ReactNode } from "react";
import { LogOut, MessageSquare } from "lucide-react";
import { Link } from "@/compat/router";
import OptimizedLogo from "@/components/OptimizedLogo";
import ThemeToggle from "@/components/ThemeToggle";

export type DashboardNavItem<K extends string = string> = {
  key: K;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
};

type DashboardLayoutProps<K extends string> = {
  /** Small label above the nav, e.g. "Candidate" / "Employer". */
  eyebrow: string;
  title: string;
  subtitle?: string;
  navItems: DashboardNavItem<K>[];
  activeKey: K;
  onSelect: (key: K) => void;
  onLogout: () => void;
  /** Shown as a small pill in the top bar (email / name). */
  userLabel?: string;
  /** Extra node in the top bar, e.g. a live-status badge. */
  headerExtra?: ReactNode;
  children: ReactNode;
};

const navButtonBase =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition";

/**
 * Shared sidebar shell for both dashboards. Brand gradient marks the active
 * item; surfaces/text use theme tokens so it flips with the light/dark toggle.
 */
export default function DashboardLayout<K extends string>({
  eyebrow,
  title,
  subtitle,
  navItems,
  activeKey,
  onSelect,
  onLogout,
  userLabel,
  headerExtra,
  children,
}: DashboardLayoutProps<K>) {
  return (
    <div className="dashboard-theme flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
 <OptimizedLogo
  className="block h-36 w-auto mb-4"
  imgClassName="h-36 w-auto object-contain object-left"
/>
        </div>

        <p className="px-5 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#264a7f] dark:text-[#7da7df]">
          {eyebrow}
        </p>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={active ? "page" : undefined}
                className={`${navButtonBase} ${
                  active
                    ? "text-white shadow-[0_14px_30px_rgba(38,74,127,0.24)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                style={active ? { background: "var(--brand-gradient)" } : undefined}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <Link
          to="/messages"
          className="mx-3 mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <MessageSquare size={18} className="shrink-0" />
          Messages
        </Link>

        <button
          type="button"
          onClick={onLogout}
          className="m-3 flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <LogOut size={18} className="shrink-0" />
          Logout
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-[120px] items-center lg:hidden">
                <OptimizedLogo
                  className="block h-full w-full"
                  imgClassName="h-full w-full object-contain object-left"
                />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-foreground sm:text-lg">{title}</h1>
                {subtitle && (
                  <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {headerExtra}
              {userLabel && (
                <span className="hidden max-w-[180px] truncate rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground md:inline-block">
                  {userLabel}
                </span>
              )}
              <ThemeToggle />
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground lg:hidden"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Mobile / tablet nav row */}
          <div className="-mx-4 mt-3 overflow-x-auto px-4 lg:hidden">
            <div className="flex min-w-max items-center gap-2 pb-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelect(item.key)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-transparent text-white"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
                    style={active ? { background: "var(--brand-gradient)" } : undefined}
                  >
                    <Icon size={15} className="shrink-0" />
                    {item.label}
                  </button>
                );
              })}
              <Link
                to="/messages"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
              >
                <MessageSquare size={15} className="shrink-0" />
                Messages
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
