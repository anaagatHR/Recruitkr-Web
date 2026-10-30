"use client";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@/compat/router";
import { displayCompany, fetchJobs, homepageEligible, jobPath, type Job } from "@/lib/jobs";
import { formatCount, useSiteStats } from "@/lib/stats";

/**
 * The hero is one sentence the visitor finishes: "Find me a [role] job in
 * [city]". The green words are real <select>s, so a candidate who would never
 * type a search can still pick a role and a city with two taps; until they
 * touch one, the blanks cycle through examples (and the inline photo swaps
 * with them) so the page reads as alive rather than as a form.
 *
 * Replaces the full-bleed photo slider + centred copy + stat tiles, which the
 * brief called out as the generic pattern.
 */

// Entry-level roles the board actually carries most of; tweak freely.
const ROLES = [
  "Sales",
  "Telecaller",
  "Accountant",
  "Receptionist",
  "Data entry",
  "Teacher",
  "Driver",
  "Marketing",
  "HR",
  "Delivery",
];

// Used until live stats arrive, and to pad the list when they do.
const FALLBACK_CITIES = ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Delhi NCR", "Remote"];

const PHOTOS = [
  { src: "/assets/hero-team-1.jpg", alt: "Hiring team shaking hands with a candidate" },
  { src: "/assets/hero-team-2.jpg", alt: "Colleagues smiling together around a laptop" },
  { src: "/assets/hero-team-3.jpg", alt: "Recruiter and candidate shaking hands after an interview" },
  { src: "/assets/hero-team-4.jpg", alt: "Candidate signing an offer letter" },
];

const CYCLE_MS = 2600;

const jobsHref = (role: string, city: string) =>
  `/jobs?search=${encodeURIComponent(role)}&location=${encodeURIComponent(city === "Remote" ? "" : city)}${
    city === "Remote" ? "&mode=Remote" : ""
  }`;

/** An inline blank in the headline: the visible word is decorative, the
 *  native <select> stacked over it does the work (and opens the OS picker on
 *  phones, which beats any custom dropdown for a first-time user). */
function Blank({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <span className="relative inline-flex items-baseline whitespace-nowrap rounded-[0.18em] align-baseline has-[:focus-visible]:ring-[0.06em] has-[:focus-visible]:ring-[#264a7f] has-[:focus-visible]:ring-offset-[0.06em]">
      <span
        aria-hidden
        className="relative inline-flex items-baseline gap-[0.12em] rounded-[0.18em] bg-[#69a44f]/15 px-[0.14em] text-[#3f7a2a] underline decoration-[#69a44f] decoration-dotted decoration-[0.06em] underline-offset-[0.14em] transition-colors duration-300 group-hover/blank:bg-[#69a44f]/25"
      >
        {/* Keyed so each new word re-runs the rise-in; one element at a time,
            so no ghost of the old word. */}
        <span key={value} className="inline-block animate-[word-in_0.4s_cubic-bezier(0.22,1,0.36,1)] motion-reduce:animate-none">
          {value}
        </span>
        <ChevronDown className="h-[0.45em] w-[0.45em] self-center text-[#69a44f]" strokeWidth={3} />
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Chromium paints a select's text even at opacity 0 / transparent colour,
        // so the text is pushed out of view with text-indent instead.
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0 -indent-[9999px] [&>option]:indent-0 [&>option]:text-base"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </span>
  );
}

/** The photo stamp inside the sentence; crossfades with the blanks and
 *  stretches wide on hover so the picture can actually be seen. */
function PhotoStamp({ index }: { index: number }) {
  return (
    <span className="relative inline-block h-[0.72em] w-[1.75em] cursor-pointer overflow-hidden rounded-full align-[-0.06em] shadow-md ring-2 ring-white transition-[width] duration-500 ease-out hover:w-[3.4em]">
      {PHOTOS.map((p, i) => (
        <Image
          key={p.src}
          src={p.src}
          alt={i === index ? p.alt : ""}
          fill
          sizes="320px"
          quality={70}
          priority={i === 0}
          className={`object-cover object-center transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
        />
      ))}
    </span>
  );
}

/** A dark band of real, open listings sliding along the hero's bottom edge. */
function LiveJobsTicker() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    let active = true;
    fetchJobs().then(({ jobs }) => {
      if (active) setJobs(jobs.filter(homepageEligible).slice(0, 14));
    });
    return () => {
      active = false;
    };
  }, []);

  const items = jobs.length ? [...jobs, ...jobs] : [];

  return (
    <div className="relative z-10 flex h-14 items-center overflow-hidden bg-[#1c3357] text-sm text-white">
      <span className="z-10 flex h-full shrink-0 items-center gap-2 bg-[#1c3357] pl-4 pr-5 font-semibold sm:pl-6 lg:pl-8">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9bd47f] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#9bd47f]" />
        </span>
        Live
      </span>
      {items.length ? (
        <ul className="flex w-max animate-[marquee_45s_linear_infinite] items-center gap-10 pr-10 hover:[animation-play-state:paused] motion-reduce:animate-none">
          {items.map((job, i) => (
            <li key={`${job.id}-${i}`} aria-hidden={i >= jobs.length}>
              <Link
                to={jobPath(job)}
                className="group/item inline-flex items-center gap-2 whitespace-nowrap rounded-full py-1 transition-colors hover:text-[#9bd47f]"
              >
                <span className="font-semibold">{job.title}</span>
                <span className="text-white/60">·</span>
                <span className="text-white/80">{displayCompany(job)}</span>
                <span className="text-white/60">·</span>
                <span className="text-white/80">{job.location}</span>
                <ArrowRight size={14} className="-translate-x-1 opacity-0 transition-all group-hover/item:translate-x-0 group-hover/item:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-white/60">Fetching today&rsquo;s openings…</span>
      )}
    </div>
  );
}

const HeroSection = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { stats, loading } = useSiteStats();

  const [role, setRole] = useState(ROLES[0]);
  const [city, setCity] = useState(FALLBACK_CITIES[0]);
  const [photo, setPhoto] = useState(0);
  const [touched, setTouched] = useState(false);
  const [keyword, setKeyword] = useState("");

  // Cities come from where the live jobs actually are, so the examples we
  // cycle through are ones a click will find something under.
  const cities = useMemo(() => {
    const live = Object.entries(stats?.byLocation ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
    const list = Array.from(new Set([...live, ...FALLBACK_CITIES])).slice(0, 9);
    if (!list.includes(city)) list.unshift(city);
    return list;
  }, [stats, city]);

  useEffect(() => {
    if (touched || reduceMotion) return;
    const id = window.setInterval(() => {
      setRole((r) => ROLES[(ROLES.indexOf(r) + 1) % ROLES.length]);
      setCity((c) => {
        const i = cities.indexOf(c);
        return cities[(i + 1) % cities.length];
      });
      setPhoto((p) => (p + 1) % PHOTOS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [touched, reduceMotion, cities]);

  const pick = (set: (v: string) => void) => (v: string) => {
    setTouched(true);
    set(v);
  };

  const searchKeyword = () => {
    const q = keyword.trim();
    navigate(q ? `/jobs?search=${encodeURIComponent(q)}` : "/jobs");
  };

  const openings = stats && stats.activeJobs > 0 ? `${formatCount(stats.activeJobs)} verified openings` : loading ? "Verified openings" : "Openings updated daily";
  const companies = stats && stats.companies > 0 ? `${formatCount(stats.companies)} hiring companies` : "Verified employers only";

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-200 bg-[#f6f2ea] pt-24 sm:pt-32">
      {/* Faint ruled lines, like the notebook a job hunt gets planned in. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_47px,rgba(28,51,87,0.07)_47px,rgba(28,51,87,0.07)_48px)]"
      />

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#264a7f] sm:text-sm">
          <span>{openings}</span>
          <span aria-hidden className="text-[#e59f56]">
            ✦
          </span>
          <span>{companies}</span>
          <span aria-hidden className="text-[#e59f56]">
            ✦
          </span>
          <span>₹0 for job seekers</span>
        </p>

        <h1 className="group/blank mt-6 max-w-6xl font-heading text-[clamp(2.3rem,8.2vw,6rem)] font-extrabold leading-[1.08] tracking-tight text-[#1c3357] sm:mt-8">
          Find me a <Blank label="Job role" value={role} options={ROLES} onChange={pick(setRole)} /> job in{" "}
          <Blank label="City" value={city} options={cities} onChange={pick(setCity)} /> <PhotoStamp index={photo} />{" "}
          <span className="text-[#69a44f]">that&rsquo;s verified &amp; free.</span>
        </h1>

        <p className="mt-4 text-sm text-slate-600 sm:text-base">
          Tap the green words to change them. Chat with the recruiter directly once you apply.
        </p>

        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <Link
            to={jobsHref(role, city)}
            className="sheen group inline-flex items-center justify-center gap-3 rounded-full bg-[#1c3357] px-7 py-4 text-base font-semibold text-white shadow-lg shadow-[#1c3357]/20 transition-transform duration-300 hover:-translate-y-1 sm:text-lg"
          >
            Show {role} jobs in {city}
            <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>

          <div className="flex min-w-0 flex-1 items-center gap-3 border-b-2 border-slate-300 pb-2 focus-within:border-[#264a7f] sm:max-w-sm">
            {/* 16px floor so iOS Safari doesn't zoom on focus. */}
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchKeyword()}
              placeholder="or type a skill, title or company"
              enterKeyHint="search"
              autoComplete="off"
              aria-label="Search jobs by skill, title or company"
              className="w-full min-w-0 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={searchKeyword}
              aria-label="Search"
              className="shrink-0 rounded-full p-1 text-[#264a7f] transition-transform hover:translate-x-1"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <LiveJobsTicker />
    </section>
  );
};

export default HeroSection;
