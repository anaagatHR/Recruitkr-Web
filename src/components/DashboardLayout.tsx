"use client";

import { type ComponentType, type ReactNode } from "react";
import { LogOut, MessageSquare } from "lucide-react";
import { Link } from "@/compat/router";
import { cn } from "@/lib/utils";
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
  /** When set, sidebar/mobile Messages opens the in-dashboard tab instead of /messages. */
  onMessagesClick?: () => void;
  /** Hide the standalone Messages shortcut (e.g. when nav already has a chat item). */
  showMessagesShortcut?: boolean;
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
  onMessagesClick,
  showMessagesShortcut = true,
  userLabel,
  headerExtra,
  children,
}: DashboardLayoutProps<K>) {
  return (
    <div className="dashboard-theme flex min-h-screen w-full lg:h-screen lg:overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <OptimizedLogo
            className="block h-9 w-auto"
            imgClassName="h-9 w-auto object-contain object-left"
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

        {showMessagesShortcut && (
          <Link
            to="/messages"
            onClick={(event) => {
              if (!onMessagesClick) return;
              event.preventDefault();
              onMessagesClick();
            }}
            className="mx-3 mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <MessageSquare size={18} className="shrink-0" />
            Messages
          </Link>
        )}

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
        </header>

        <main
          className={cn(
            // On desktop the shell is viewport-height; content scrolls inside main
            // (not the page) so the embedded chat fits exactly with no page scroll.
            "min-h-0 flex-1 lg:overflow-y-auto",
            // Mobile clears the fixed bottom nav (pb-24); desktop uses normal padding.
            onMessagesClick
              ? "flex flex-col px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6"
              : "space-y-6 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6",
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation — Instagram/WhatsApp style, large touch targets */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition active:scale-95",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition",
                    active ? "text-white" : "",
                  )}
                  style={active ? { background: "var(--brand-gradient)" } : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                </span>
                <span className="w-full truncate text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
