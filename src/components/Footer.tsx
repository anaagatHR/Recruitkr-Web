"use client";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import Image from "next/image";
import logoImage from "@/assets/logo-tagline.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "@/compat/router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const socialLinks = [
  {
    icon: Linkedin,
    href: "https://www.linkedin.com/company/recruitkr/",
    label: "LinkedIn",
  },
  {
    icon: Facebook,
    href: "https://www.facebook.com/share/183yc8uvDV/",
    label: "Facebook",
  },
  {
    icon: Instagram,
    href: "https://www.instagram.com/recruitkr_official?igsh=MWUweW1sNjB0ejk1MA==",
    label: "Instagram",
  },
];

const linkSections = [
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
      { label: "Admin", to: "https://recruitkr-business-os.vercel.app/", external: true },
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
      { label: "Assessment", to: "/assessment" },
      { label: "Training", to: "/training" },
    ],
  },
];

const contactEmails = ["Careers@recruitkr.com", "Connect@recruitkr.com"];
const contactPhones = [
  { label: "Recruiters / Employers", display: "+91 90019 65072", tel: "+919001965072" },
  { label: "Candidates / Job Seekers", display: "+91 96363 15150", tel: "+919636315150" },
];
const footerLinkClass =
  "flex min-w-0 items-center rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-all duration-200 hover:translate-x-0.5 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1c38]";
const mobileSectionTriggerClass =
  "rounded-2xl px-4 text-left text-sm font-semibold uppercase tracking-[0.16em] text-white no-underline hover:no-underline";
const contactLinkClass =
  "flex min-w-0 items-start gap-3 rounded-xl px-3 py-2.5 text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1c38]";

type FooterLinkItem = { label: string; to: string; external?: boolean };

// Footer nav links are internal router links by default; items flagged
// `external` (e.g. the Admin / Business OS link) render as a plain anchor that
// opens in a new tab.
const FooterNavLink = ({ item }: { item: FooterLinkItem }) =>
  item.external ? (
    <a href={item.to} target="_blank" rel="noreferrer" className={footerLinkClass}>
      <span>{item.label}</span>
    </a>
  ) : (
    <Link to={item.to} className={footerLinkClass}>
      <span>{item.label}</span>
    </Link>
  );

const Footer = () => {
  const isMobile = useIsMobile();

  return (
    <footer className="bg-deep-navy relative overflow-hidden border-t border-white/10 text-white">
      {/* Soft brand glow accents so the deep navy reads rich, not flat. */}
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#69a44f]/12 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#264a7f]/50 blur-3xl" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-[0.06]" />
      <div className="container relative mx-auto px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-6">
          <div className="flex flex-col flex-wrap items-center gap-4 text-center animate-fade-up sm:flex-row sm:flex-nowrap sm:gap-6 sm:text-left">
            {/* Soft white rounded chip so the navy logo art reads crisply
                against the deep-navy footer, in its true brand colours. */}
            <div className="flex shrink-0 items-center animate-float rounded-2xl bg-white/95 px-4 py-2.5 shadow-soft-md ring-1 ring-white/50">
              {/* next/image for the same reason as the navbar. This one stays
                  lazy (it is below the fold), but it must not request the raw
                  912x391 PNG: that is a separate 186 KB download from the
                  navbar's optimised copy, since they resolve to different URLs. */}
              <Image
                src={logoImage}
                alt="RecruitKr"
                width={131}
                height={56}
                loading="lazy"
                className="block h-11 w-auto object-contain sm:h-11 md:h-12 lg:h-14"
              />
            </div>

            <p className="text-sm leading-relaxed text-slate-300 animate-fade-up-delay-1 sm:flex-1 sm:px-4 lg:text-center">
              Your End-to-End Hiring and HR Partner from recruitment to retention.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 animate-fade-up-delay-2 sm:justify-end">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition duration-200 hover:-translate-y-1 hover:scale-110 hover:border-[#69a44f]/60 hover:bg-[#69a44f]/15 hover:text-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1c38]"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {isMobile ? (
            <div className="pt-1">
              <Accordion type="single" collapsible className="grid gap-3">
                {linkSections.map((section) => (
                  <AccordionItem
                    key={section.title}
                    value={section.title}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0"
                  >
                    <AccordionTrigger className={mobileSectionTriggerClass}>{section.title}</AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1">
                      <nav className="grid gap-2">
                        {section.links.map((item) => (
                          <FooterNavLink key={item.label} item={item} />
                        ))}
                      </nav>
                    </AccordionContent>
                  </AccordionItem>
                ))}

                <AccordionItem value="contact" className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-0">
                  <AccordionTrigger className={mobileSectionTriggerClass}>Contact</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1">
                    <div className="grid gap-2 text-sm">
                      {contactEmails.map((email) => (
                        <a key={email} href={`mailto:${email}`} className={contactLinkClass}>
                          <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                          <span className="min-w-0 break-words">{email}</span>
                        </a>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3">
                      {contactPhones.map((phone) => (
                        <div key={phone.tel} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{phone.label}</p>
                          <a
                            href={`tel:${phone.tel}`}
                            className="mt-2 inline-flex items-center gap-2 text-sm text-slate-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1c38]"
                          >
                            <Phone size={16} className="shrink-0 opacity-90" /> {phone.display}
                          </a>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {linkSections.map((section) => (
                <div key={section.title}>
                  {/* h2, not h4: these are the first headings after the page's
                      own, so h4 skipped a level. `heading-plain` opts out of the
                      base layer's brand gradient, which would otherwise repaint
                      the green and lose it against the navy footer. */}
                  <h2 className="heading-plain mb-3 text-xs font-semibold uppercase tracking-widest text-[#8fc46f]">{section.title}</h2>
                  <nav className="grid gap-1">
                    {section.links.map((item) => (
                      <FooterNavLink key={item.label} item={item} />
                    ))}
                  </nav>
                </div>
              ))}

              <div>
                <h2 className="heading-plain mb-3 text-xs font-semibold uppercase tracking-widest text-[#8fc46f]">Contact</h2>
                <div className="grid gap-1 text-sm">
                  {contactEmails.map((email) => (
                    <a key={email} href={`mailto:${email}`} className={contactLinkClass}>
                      <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                      <span className="min-w-0 break-words">{email}</span>
                    </a>
                  ))}
                </div>

                <div className="mt-4 grid gap-3">
                  {contactPhones.map((phone) => (
                    <div key={phone.tel} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{phone.label}</p>
                      <a
                        href={`tel:${phone.tel}`}
                        className="mt-2 inline-flex items-center gap-2 text-sm text-slate-200 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1c38]"
                      >
                        <Phone size={16} className="shrink-0 opacity-90" /> {phone.display}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            className="border-t border-white/10 pt-5 text-center text-xs leading-relaxed text-slate-400"
            suppressHydrationWarning
          >
            &copy; {new Date().getFullYear()} RecruitKr. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
