"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowUpRight, Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/compat/router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { services } from "@/lib/services";
import { CITIES, cityHeading, cityPath } from "@/lib/locations";

/**
 * Site-wide footer: a close, not a sitemap. It ends on the one thing the
 * site can't do online — meeting the team in Jaipur — with the two offices
 * as a live map that opens from its pin, then the links, then the name.
 *
 * Flat deep-navy ground (no blobs, grid or gradients); motion is one reveal,
 * armed only after mount so everything stays visible without JS and under
 * prefers-reduced-motion.
 */

const INK = "hsl(216 52% 11%)";

const OFFICES = [
  {
    id: "head-office",
    name: "Head Office",
    area: "Jaipur",
    place: "RecruitKr Head Office",
    // shortcut: no public street address yet, so the pin carries it; add the street here when confirmed.
    address: ["RecruitKr Head Office", "Jaipur, Rajasthan"],
    embed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3234.1379471214714!2d75.79982807502302!3d26.888304076661715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db55903d1d3ad%3A0xacb185731ebd12e4!2sRecruitKr%20Head%20Office!5e0!3m2!1sen!2sin!4v1782225290063!5m2!1sen!2sin",
    directions:
      "https://www.google.com/maps/place/RecruitKr+Head+Office/@26.8883041,75.802403,17z/data=!4m6!3m5!1s0x396db55903d1d3ad:0xacb185731ebd12e4!8m2!3d26.8883041!4d75.802403",
  },
  {
    id: "techno-hub",
    name: "Bhamashah Techno Hub",
    area: "Malviya Nagar",
    place: "Bhamashah Techno Hub",
    address: ["Bhamashah Techno Hub, Sansthan Path", "Jhalana Gram, Malviya Nagar, Jaipur 302017"],
    embed: "https://www.google.com/maps?q=Bhamashah%20Techno%20Hub%2C%20Jhalana%20Gram%2C%20Jaipur&z=16&output=embed",
    directions: "https://www.google.com/maps?ftid=0x396db76daaf9e625:0x250da88d0257d375",
  },
] as const;

type Office = (typeof OFFICES)[number];

// Lowercase: mixed-case addresses look like typos and copy badly.
const EMAILS = ["connect@recruitkr.com", "careers@recruitkr.com"];
const PHONES = [
  { label: "Employers", display: "+91 90019 65072", tel: "+919001965072" },
  { label: "Candidates", display: "+91 96363 15150", tel: "+919636315150" },
];

const SOCIAL = [
  { icon: Linkedin, href: "https://www.linkedin.com/company/recruitkr/", label: "RecruitKr on LinkedIn" },
  { icon: Facebook, href: "https://www.facebook.com/share/183yc8uvDV/", label: "RecruitKr on Facebook" },
  {
    icon: Instagram,
    href: "https://www.instagram.com/recruitkr_official?igsh=MWUweW1sNjB0ejk1MA==",
    label: "RecruitKr on Instagram",
  },
];

type FooterLink = { label: string; to: string };

const LINK_SECTIONS: Array<{ title: string; links: FooterLink[]; wide?: boolean }> = [
  {
    title: "Company",
    links: [
      { label: "Home", to: "/" },
      { label: "About Us", to: "/about" },
      { label: "Goal", to: "/goal" },
      { label: "Team", to: "/our-team" },
      { label: "Success Stories", to: "/success-stories" },
      { label: "Blog", to: "/blog" },
      { label: "Contact", to: "/contact" },
      // The internal admin console is deliberately NOT linked from the public
      // footer: it exposed the admin URL to every visitor. Staff reach it directly.
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Browse Jobs", to: "/jobs" },
      { label: "For Candidates", to: "/candidates" },
      { label: "For Employers", to: "/employers" },
      { label: "Partners", to: "/partners" },
      { label: "FAQs", to: "/faqs" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "All Services", to: "/services" },
      ...services.map((s) => ({ label: s.cardTitle, to: `/services/${s.id}` })),
      { label: "Sectors We Serve", to: "/sectors" },
      { label: "Assessment", to: "/assessment" },
      { label: "Training", to: "/training" },
    ],
    wide: true,
  },
  {
    title: "Jobs by city",
    // Every city page, at its canonical /jobs-in-<city> URL.
    links: CITIES.map((city) => ({ label: cityHeading(city), to: cityPath(city.slug) })),
    wide: true,
  },
];

const LEGAL: FooterLink[] = [
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Delete Account", to: "/delete-account" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fc46f] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(216_52%_11%)]";

/**
 * "idle" until mounted (and forever under reduced motion), "armed" once the
 * reveal is primed off-screen, "in" when the element scrolls into view.
 */
function useReveal(ref: RefObject<HTMLElement | null>, threshold = 0.25) {
  const [stage, setStage] = useState<"idle" | "armed" | "in">("idle");
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStage("armed");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStage("in");
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return stage;
}

const visitMailto = (office: Office) =>
  `mailto:connect@recruitkr.com?subject=${encodeURIComponent(`Visit request: ${office.place}`)}&body=${encodeURIComponent(
    `Hello RecruitKr team,\n\nI'd like to meet you at ${office.place}, Jaipur.\n\nPreferred date and time:\nName:\nPhone:\nI'm (hiring / looking for a job):\n`,
  )}`;

function OfficeMap({ stage }: { stage: "idle" | "armed" | "in" }) {
  const [activeId, setActiveId] = useState<Office["id"]>(OFFICES[0].id);
  const office = OFFICES.find((o) => o.id === activeId) ?? OFFICES[0];
  // Address and actions rise in after the map opens; hidden only while armed.
  const riseClass = stage === "in" ? "footer-rise" : stage === "armed" ? "opacity-0" : "";
  const delay = (ms: number) => (stage === "in" ? { animationDelay: `${ms}ms` } : undefined);

  return (
    <div>
      <div role="group" aria-label="Choose an office" className="grid grid-cols-2 gap-2">
        {OFFICES.map((o) => {
          const active = o.id === office.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => setActiveId(o.id)}
              className={`flex min-h-[56px] cursor-pointer flex-col items-start justify-center rounded-xl px-4 py-2.5 text-left transition-colors duration-200 ${focusRing} ${
                active ? "bg-white text-[#0c1c38]" : "bg-white/[0.06] text-white hover:bg-white/[0.12]"
              }`}
            >
              <span className="text-sm font-semibold leading-tight">{o.name}</span>
              <span className={`text-xs ${active ? "text-[#264a7f]" : "text-slate-300"}`}>{o.area}</span>
            </button>
          );
        })}
      </div>

      {/* Keyed by office: switching remounts the panel, so the map opens
          again from its pin — the reveal is the location arriving. */}
      <div
        key={office.id}
        className={`relative mt-3 aspect-[16/11] overflow-hidden rounded-2xl bg-[#16294a] sm:aspect-[16/9] ${
          stage === "in" ? "footer-map-reveal" : stage === "armed" ? "[clip-path:circle(0%_at_50%_50%)]" : ""
        }`}
      >
        <iframe
          title={`Map showing ${office.place}, Jaipur`}
          src={office.embed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>

      <div key={`${office.id}-details`} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <address className="not-italic">
          {office.address.map((line, i) => (
            <span
              key={line}
              style={delay(250 + i * 80)}
              className={`block text-sm text-slate-200 first:text-base first:font-semibold first:text-white ${riseClass}`}
            >
              {line}
            </span>
          ))}
        </address>
        <div className={`flex flex-wrap gap-2 ${riseClass}`} style={delay(420)}>
          <a
            href={office.directions}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-white/[0.08] px-4 text-sm font-semibold text-white transition-colors hover:bg-white/[0.16] ${focusRing}`}
          >
            <MapPin size={16} aria-hidden /> Get directions
          </a>
          <a
            href={visitMailto(office)}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#69a44f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#5b9243] ${focusRing}`}
          >
            Plan a visit <ArrowUpRight size={16} aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}

function LinkList({ links }: { links: FooterLink[] }) {
  return (
    <ul className="grid gap-0.5">
      {links.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            prefetch={false}
            className={`-mx-2 inline-flex min-h-[36px] items-center rounded-md px-2 text-sm text-slate-300 transition-colors hover:text-white ${focusRing}`}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const Footer = () => {
  const visitRef = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const visitStage = useReveal(visitRef, 0.2);
  const markStage = useReveal(markRef, 0.35);

  return (
    <footer className="relative overflow-hidden text-white" style={{ backgroundColor: INK }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Get in touch / meet in person */}
        <section
          ref={visitRef}
          aria-labelledby="footer-meet"
          className="grid gap-10 pb-16 pt-16 sm:pt-20 lg:grid-cols-12 lg:gap-12 lg:pb-24 lg:pt-28"
        >
          <div className="lg:col-span-5">
            <h2
              id="footer-meet"
              className="heading-plain font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
            >
              Let&apos;s meet in Jaipur.
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-200">
              Hiring for a role, or looking for your next job? Call, write, or come and see us at either of our
              offices. Let us know before you visit so the right recruiter is there to meet you.
            </p>

            <dl className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {PHONES.map((phone) => (
                <div key={phone.tel}>
                  <dt className="text-sm text-slate-300">{phone.label}</dt>
                  <dd>
                    <a
                      href={`tel:${phone.tel}`}
                      className={`mt-0.5 inline-flex min-h-[44px] items-center gap-2 rounded-md font-display text-xl font-semibold text-white transition-colors hover:text-[#8fc46f] ${focusRing}`}
                    >
                      <Phone size={18} aria-hidden className="text-[#8fc46f]" />
                      {phone.display}
                    </a>
                  </dd>
                </div>
              ))}
              {EMAILS.map((email, i) => (
                <div key={email}>
                  <dt className="text-sm text-slate-300">{i === 0 ? "General & employers" : "Careers"}</dt>
                  <dd>
                    <a
                      href={`mailto:${email}`}
                      className={`mt-0.5 inline-flex min-h-[44px] items-center gap-2 rounded-md text-base font-semibold text-white transition-colors hover:text-[#8fc46f] ${focusRing}`}
                    >
                      <Mail size={18} aria-hidden className="text-[#8fc46f]" />
                      {email}
                    </a>
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              to="/contact"
              className={`mt-8 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#0c1c38] transition-colors hover:bg-[#e6eef9] ${focusRing}`}
            >
              Send us a message <ArrowUpRight size={16} aria-hidden />
            </Link>
          </div>

          <div className="lg:col-span-7">
            <h3 className="font-display text-lg font-semibold text-white">Visit us in person</h3>
            <p className="mb-4 mt-1 text-sm text-slate-300">Two offices in Jaipur. Pick one to see where it is.</p>
            <OfficeMap stage={visitStage} />
          </div>
        </section>

        {/* Links: grid on desktop, accordion on phones (CSS-switched, no hydration flash) */}
        <nav aria-label="Footer" className="pb-12">
          <div className="hidden gap-10 rounded-3xl bg-white/[0.04] p-8 md:grid md:grid-cols-2 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,1.6fr)] lg:p-10">
            {LINK_SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="heading-plain mb-3 text-sm font-semibold text-white">{section.title}</h2>
                {section.wide ? (
                  <div className="columns-2 gap-6 [&_ul]:block [&_li]:break-inside-avoid">
                    <LinkList links={section.links} />
                  </div>
                ) : (
                  <LinkList links={section.links} />
                )}
              </div>
            ))}
          </div>

          <Accordion type="single" collapsible className="grid gap-2 md:hidden">
            {LINK_SECTIONS.map((section) => (
              <AccordionItem key={section.title} value={section.title} className="rounded-2xl border-0 bg-white/[0.05] px-4">
                <AccordionTrigger className="min-h-[52px] py-3 text-left text-base font-semibold text-white no-underline hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <LinkList links={section.links} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>

        {/* Social + legal */}
        <div className="flex flex-col-reverse gap-6 pb-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-300" suppressHydrationWarning>
            &copy; {new Date().getFullYear()} RecruitKr · Anaagat Humanpower Private Limited
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`inline-flex min-h-[44px] items-center text-sm text-slate-300 underline-offset-4 transition-colors hover:text-white hover:underline ${focusRing}`}
              >
                {item.label}
              </Link>
            ))}
            <span className="flex gap-2">
              {SOCIAL.map(({ icon: Icon, href, label }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.08] text-white transition-colors hover:bg-[#69a44f] ${focusRing}`}
                >
                  <Icon size={18} aria-hidden />
                </a>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* The name returns at full width and rises into place as it scrolls in.
          Uneven padding is optical: the "R" carries its own left side-bearing. */}
      <div
        ref={markRef}
        aria-hidden
        data-armed={markStage !== "idle" || undefined}
        data-in={markStage === "in" || undefined}
        className="footer-wordmark flex select-none justify-between overflow-hidden pb-2 pl-[1vw] pr-[4.4vw] font-display text-[18vw] font-extrabold leading-[0.78] tracking-[-0.05em]"
      >
        {"RecruitKr".split("").map((ch, i) => (
          <span
            key={i}
            className={i >= 7 ? "text-[#69a44f]" : "text-[#264a7f]"}
            style={{ transitionDelay: `${i * 45}ms` }}
          >
            {ch}
          </span>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
