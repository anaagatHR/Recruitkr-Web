import type { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Plain, readable shell for legal pages (privacy policy, account deletion).
 *
 * Deliberately a server component with no animation: these pages are read by
 * Google Play reviewers and crawlers, so the full text must be in the HTML on
 * first load, not revealed on scroll.
 */
export default function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  /** Human-readable "last updated" date, e.g. "24 October 2026". */
  updated: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6">
        <header className="border-b border-border pb-6">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
          {intro ? <div className="mt-4 space-y-3 text-base leading-relaxed text-foreground/90">{intro}</div> : null}
        </header>
        <div className="mt-8 space-y-10 text-[15px] leading-relaxed text-foreground/90">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export function LegalSubheading({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-base font-semibold text-foreground">{children}</h3>;
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">{children}</ul>;
}

export function LegalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-medium text-[#264a7f] underline underline-offset-2 hover:text-[#69a44f] dark:text-[#8fb4e8]">
      {children}
    </a>
  );
}
