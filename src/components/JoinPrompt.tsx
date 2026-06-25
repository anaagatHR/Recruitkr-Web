"use client";

/**
 * JoinPrompt — the conversion nudge for the visitor journey.
 *
 * The site stays fully public (good for SEO and for letting visitors read our
 * results and build trust first). Once a visitor has actually engaged — spent a
 * little time on the page or scrolled past the results — we surface a single,
 * dismissible prompt asking them to join as a Candidate or an Employer. Both
 * choices route into the existing signup flow, which stores the lead (name,
 * email, mobile, role) in the database. Logged-in users and auth pages never
 * see it, and once a visitor dismisses or signs up we don't nag again.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/compat/router";
import { getSession } from "@/lib/auth";

const SEEN_KEY = "recruitkr.joinPrompt.seen";
const ENGAGE_DELAY_MS = 20000; // ~20s on the site = had time to read our results.
const SCROLL_TRIGGER = 0.55; // …or scrolled past ~55% of the page.

// Don't prompt on flows where a join CTA is redundant or in the way.
const SUPPRESSED_PREFIXES = [
  "/login",
  "/signup",
  "/dashboard",
  "/forgot-password",
  "/reset-password",
];

const NAVY = "#264a7f";
const GREEN = "#69a44f";

export default function JoinPrompt() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const suppressed = SUPPRESSED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  useEffect(() => {
    if (suppressed) return;
    if (getSession()) return; // already a member — nothing to capture.

    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      // localStorage can throw in private mode; just fall through and show once.
    }

    let done = false;
    const trigger = () => {
      if (done) return;
      done = true;
      cleanup();
      setOpen(true);
    };

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      if (window.scrollY / scrollable >= SCROLL_TRIGGER) trigger();
    };

    const timer = window.setTimeout(trigger, ENGAGE_DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });

    function cleanup() {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    }

    return cleanup;
  }, [pathname, suppressed]);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-prompt-title"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
        >
          ✕
        </button>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: GREEN }}>
            12,000+ hired · 50,000+ candidates
          </p>
          <h2 id="join-prompt-title" className="mt-2 font-heading text-2xl font-bold">
            Liked what you saw? Join RecruitKr free
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your free account to apply to jobs or hire verified, job-ready
            candidates. Takes less than a minute.
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            to="/signup"
            onClick={dismiss}
            className="btn-gradient w-full rounded-xl py-3.5 text-center text-sm font-bold transition hover:scale-[1.02]"
          >
            I&apos;m looking for a job
          </Link>
          <Link
            to="/signup/employer"
            onClick={dismiss}
            className="w-full rounded-xl border-2 py-3 text-center text-sm font-bold transition hover:bg-muted"
            style={{ borderColor: NAVY, color: NAVY }}
          >
            I&apos;m hiring
          </Link>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already a member?{" "}
          <Link to="/login" onClick={dismiss} className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 block w-full text-center text-xs text-muted-foreground hover:underline"
        >
          Keep browsing
        </button>
      </div>
    </div>
  );
}
