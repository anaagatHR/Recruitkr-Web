"use client";

import { type LucideIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Link } from "@/compat/router";

export type MarketingFeature = { icon: LucideIcon; title: string; description: string };
export type MarketingStep = { title: string; description: string };
export type MarketingStat = { value: string; label: string };
export type MarketingCta = { label: string; to: string };

export type MarketingPageProps = {
  eyebrow: string;
  title: string;
  /** Word(s) in the title rendered with the brand gradient. */
  highlight?: string;
  subtitle: string;
  primaryCta: MarketingCta;
  secondaryCta?: MarketingCta;
  stats?: MarketingStat[];
  featuresTitle?: string;
  features: MarketingFeature[];
  steps?: MarketingStep[];
  stepsTitle?: string;
  /** Optional custom section(s) rendered between the steps and the closing CTA. */
  children?: React.ReactNode;
  closingTitle: string;
  closingSubtitle: string;
};

const Cta = ({ cta, variant }: { cta: MarketingCta; variant: "solid" | "outline" }) => (
  <Link
    to={cta.to}
    className={
      variant === "solid"
        ? "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#264a7f] shadow-sm transition hover:bg-white/95 sm:w-auto"
        : "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
    }
  >
    {cta.label}
    <ArrowRight size={16} />
  </Link>
);

/**
 * Reusable, mobile-first marketing page shell (hero + stats + features + steps +
 * closing CTA). Uses the shared Navbar/Footer and the brand drift-gradient hero.
 */
export default function MarketingPage({
  eyebrow,
  title,
  highlight,
  subtitle,
  primaryCta,
  secondaryCta,
  stats,
  featuresTitle = "What you get",
  features,
  steps,
  stepsTitle = "How it works",
  children,
  closingTitle,
  closingSubtitle,
}: MarketingPageProps) {
  const titleNode = highlight ? (
    <>
      {title.split(highlight)[0]}
      <span className="bg-gradient-to-r from-[#bcd0ee] via-white to-[#c9e6b6] bg-clip-text text-transparent">
        {highlight}
      </span>
      {title.split(highlight)[1]}
    </>
  ) : (
    title
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#16305a] pt-20">
        <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 2px, transparent 2px 22px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(13,26,48,.25) 0%, rgba(13,26,48,.1) 45%, rgba(13,26,48,.55) 100%)" }}
        />
        <RevealGroup stagger={0.1} className="relative z-10 mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
          <RevealItem className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/70 sm:text-xs">{eyebrow}</RevealItem>
          <RevealItem as="div" className="mt-3 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
            <h1>{titleNode}</h1>
          </RevealItem>
          <RevealItem className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">{subtitle}</RevealItem>
          <RevealItem className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
            <Cta cta={primaryCta} variant="solid" />
            {secondaryCta && <Cta cta={secondaryCta} variant="outline" />}
          </RevealItem>

          {stats && stats.length > 0 && (
            <RevealItem className="mt-10 grid grid-cols-3 gap-3 border-t border-white/15 pt-8 sm:gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-extrabold text-white sm:text-3xl">{s.value}</div>
                  <div className="mt-1 text-[11px] font-medium text-white/65 sm:text-sm">{s.label}</div>
                </div>
              ))}
            </RevealItem>
          )}
        </RevealGroup>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal as="div">
          <h2 className="text-center font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {featuresTitle}
          </h2>
        </Reveal>
        <RevealGroup className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <RevealItem
              key={f.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <f.icon size={20} />
              </span>
              <h3 className="mt-4 text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* Steps */}
      {steps && steps.length > 0 && (
        <section className="bg-muted/40 py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal as="div">
              <h2 className="text-center font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {stepsTitle}
              </h2>
            </Reveal>
            <RevealGroup className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <RevealItem key={step.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-base font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      )}

      {/* Custom sections (e.g. profile video, reviews) */}
      {children}

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal className="relative overflow-hidden rounded-3xl bg-[#16305a] p-8 text-center sm:p-12">
          <div aria-hidden className="hero-drift pointer-events-none absolute inset-0" />
          <div className="relative z-10">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {closingTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">{closingSubtitle}</p>
            <div className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
              <Cta cta={primaryCta} variant="solid" />
              {secondaryCta && <Cta cta={secondaryCta} variant="outline" />}
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}

/** Small inline list item used by some marketing screens. */
export const MarketingCheck = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#69a44f]" />
    {children}
  </li>
);
