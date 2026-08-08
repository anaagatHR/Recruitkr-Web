"use client";

import { type LucideIcon, ArrowRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Link } from "@/compat/router";

/** Logo navy / green / amber, cycled across the feature and step cards. */
const ACCENTS = ["#264a7f", "#69a44f", "#e59f56"];

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
  /** Optional custom section(s) rendered between the hero and the features. */
  beforeFeatures?: React.ReactNode;
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
  beforeFeatures,
  children,
  closingTitle,
  closingSubtitle,
}: MarketingPageProps) {
  // The whole headline is plain white on the navy hero.
  //
  // The highlighted words are still marked up separately, but they carry no
  // colour of their own — they used to be a gradient clipped to the text, which
  // relied on `text-transparent`, so anything that stopped the background from
  // painting (forced-colours mode, a failed gradient) left a blank gap where
  // the words should be. Solid white has no such failure mode.
  const titleNode = highlight ? (
    <>
      {title.split(highlight)[0]}
      <span className="text-white">{highlight}</span>
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
          {/* Every line in the hero is solid white — no translucent tints. The
              eyebrow, subtitle and stat labels used to sit at 65–80% opacity,
              which greyed them against the navy. */}
          <RevealItem className="text-[11px] font-bold uppercase tracking-[0.28em] text-white sm:text-xs">{eyebrow}</RevealItem>
          <RevealItem as="div" className="mt-3 font-heading text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
            {/* `text-white` has to sit on the <h1> itself, not on the wrapper.
                index.css paints every h1/h2 in the brand gradient via
                `bg-clip-text text-transparent`, and that base rule beats an
                inherited colour — the headline came out gradient-coloured with
                only the highlighted span white. */}
            <h1 className="text-white">{titleNode}</h1>
          </RevealItem>
          <RevealItem className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white sm:text-base">{subtitle}</RevealItem>
          <RevealItem className="mx-auto mt-7 flex max-w-md flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
            <Cta cta={primaryCta} variant="solid" />
            {secondaryCta && <Cta cta={secondaryCta} variant="outline" />}
          </RevealItem>

          {/* Column count follows the data. It was hardcoded to 3, so a page
              supplying two stats left an empty third cell and the row read as
              off-centre. */}
          {stats && stats.length > 0 && (
            <RevealItem
              className={`mt-10 grid gap-3 border-t border-white/15 pt-8 sm:gap-6 ${
                stats.length === 1 ? "grid-cols-1" : stats.length === 2 ? "grid-cols-2" : "grid-cols-3"
              }`}
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-extrabold text-white sm:text-3xl">{s.value}</div>
                  <div className="mt-1 text-[11px] font-medium text-white sm:text-sm">{s.label}</div>
                </div>
              ))}
            </RevealItem>
          )}
        </RevealGroup>
      </section>

      {/* Custom sections rendered before the features (e.g. candidate journey) */}
      {beforeFeatures}

      {/* Features. Same card treatment as the home page's "Why RecruitKr"
          block: a tinted band, the three brand accents cycling across the grid,
          and each card lighting up in its own colour on hover rather than all
          six going the same washed-out primary. */}
      <section className="border-y border-slate-100 bg-slate-50 py-10 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal as="div" className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              {featuresTitle}
            </h2>
            <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] sm:mt-5 sm:w-16" />
          </Reveal>

          {/* On a phone each feature is a single compact row — icon on the left,
              title and one line of description on the right — so all six fit in
              roughly one screen instead of scrolling through six tall cards.
              From `sm` up the same markup becomes the stacked card grid. */}
          <RevealGroup className="mt-6 grid grid-cols-1 gap-2 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {features.map((f, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <RevealItem key={f.title} className="h-full">
                  <div
                    style={{ "--accent": accent } as React.CSSProperties}
                    className="group relative flex h-full items-center gap-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2.5 transition-all duration-300 hover:-translate-y-1.5 hover:border-[color:var(--accent)] hover:shadow-[0_22px_45px_-26px_var(--accent)] sm:block sm:rounded-3xl sm:p-5"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-[color:var(--accent)] opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-[0.14]"
                    />
                    {/* The index marker would collide with the text in the
                        single-row phone layout, so it only appears once the
                        card stacks. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-4 top-3 hidden font-heading text-xl font-extrabold text-slate-900/[0.07] sm:block"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <span
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 sm:mb-3.5 sm:h-12 sm:w-12 sm:rounded-2xl"
                      style={{
                        backgroundColor: `${accent}14`,
                        color: accent,
                        boxShadow: `inset 0 0 0 1px ${accent}29`,
                      }}
                    >
                      <f.icon className="h-[18px] w-[18px] sm:h-[22px] sm:w-[22px]" strokeWidth={2.1} />
                    </span>
                    <span className="relative min-w-0 flex-1 sm:block">
                      <h3 className="font-heading text-[13px] font-bold leading-tight text-slate-900 sm:text-base">
                        {f.title}
                      </h3>
                      {/* One line on a phone, full text from `sm` up. */}
                      <p className="mt-0.5 line-clamp-1 text-[11px] leading-[1.45] text-slate-600 sm:mt-1.5 sm:line-clamp-none sm:text-sm sm:leading-6">
                        {f.description}
                      </p>
                    </span>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </section>

      {/* Steps */}
      {steps && steps.length > 0 && (
        // White, so it alternates against the tinted features band above.
        <section className="bg-white py-10 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal as="div" className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {stepsTitle}
              </h2>
              <span className="mx-auto mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] sm:mt-5 sm:w-16" />
            </Reveal>
            {/* Compact numbered rows on a phone, stacked cards from `sm` up —
                same approach as the features grid above. */}
            <RevealGroup className="mt-6 grid gap-2 sm:mt-12 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {steps.map((step, i) => {
                const accent = ACCENTS[i % ACCENTS.length];
                return (
                  <RevealItem key={step.title} className="h-full">
                    <div
                      style={{ "--accent": accent } as React.CSSProperties}
                      className="group flex h-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--accent)] hover:shadow-[0_22px_45px_-26px_var(--accent)] sm:block sm:rounded-3xl sm:p-5"
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9 sm:text-sm"
                        style={{ backgroundColor: accent }}
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 sm:block">
                        <h3 className="font-heading text-[13px] font-bold leading-tight text-slate-900 sm:mt-3.5 sm:text-base">
                          {step.title}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-[11px] leading-[1.45] text-slate-600 sm:mt-1.5 sm:line-clamp-none sm:text-sm sm:leading-6">
                          {step.description}
                        </p>
                      </span>
                    </div>
                  </RevealItem>
                );
              })}
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
            <p className="mx-auto mt-3 max-w-xl text-sm text-white sm:text-base">{closingSubtitle}</p>
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
