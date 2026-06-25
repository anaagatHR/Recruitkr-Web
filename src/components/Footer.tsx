"use client";
import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import logoImage from "@/assets/logo.jpeg";
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
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "Browse Jobs", to: "/jobs" },
      { label: "For Candidates", to: "/candidates" },
      { label: "For Employers", to: "/employers" },
      { label: "Partners", to: "/partners" },
      { label: "Internship", to: "/internship" },
      { label: "FAQs", to: "/faqs" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Recruitment", to: "/services" },
      { label: "Payroll", to: "/services" },
      { label: "Staffing", to: "/services" },
      { label: "Gig Placement", to: "/services" },
      { label: "HR Solutions", to: "/services" },
      { label: "Career Counselling", to: "/services" },
      { label: "Assessment", to: "/assessment" },
      { label: "Training", to: "/training" },
    ],
  },
];

const sectors = ["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"];

const contactEmails = ["Careers@recruitkr.com", "Connect@recruitkr.com"];
const contactPhones = [
  { label: "Recruiters / Employers", display: "+91 90019 65072", tel: "+919001965072" },
  { label: "Candidates / Job Seekers", display: "+91 96363 15150", tel: "+919636315150" },
];
const footerLinkClass =
  "flex min-w-0 items-center rounded-xl px-3 py-2.5 text-sm text-slate-600 transition-all duration-200 hover:translate-x-0.5 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
const mobileSectionTriggerClass =
  "rounded-2xl px-4 text-left text-sm font-semibold uppercase tracking-[0.16em] text-slate-700 no-underline hover:no-underline";
const contactLinkClass =
  "flex min-w-0 items-start gap-3 rounded-xl px-3 py-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const Footer = () => {
  const isMobile = useIsMobile();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-900">
      <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-10">
        <div className="space-y-6">
          <div className="flex flex-col flex-wrap items-center gap-4 text-center animate-fade-up sm:flex-row sm:flex-nowrap sm:gap-6 sm:text-left">
            <div className="flex shrink-0 items-center animate-float">
              <img
                src={logoImage.src}
                alt="RecruitKr"
                loading="lazy"
                decoding="async"
                className="block h-12 w-auto object-contain drop-shadow-sm sm:h-12 md:h-14 lg:h-16"
              />
            </div>

            <p className="text-sm leading-relaxed text-slate-600 animate-fade-up-delay-1 sm:flex-1 sm:px-4 lg:text-center">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition duration-200 hover:-translate-y-1 hover:scale-110 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-0"
                  >
                    <AccordionTrigger className={mobileSectionTriggerClass}>{section.title}</AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1">
                      <nav className="grid gap-2">
                        {section.links.map((item) => (
                          <Link key={item.label} to={item.to} className={footerLinkClass}>
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </nav>
                    </AccordionContent>
                  </AccordionItem>
                ))}

                <AccordionItem value="sectors" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-0">
                  <AccordionTrigger className={mobileSectionTriggerClass}>Sectors</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1">
                    <nav className="grid gap-2">
                      {sectors.map((sector) => (
                        <a key={sector} href="/sectors" className={footerLinkClass}>
                          <span>{sector}</span>
                        </a>
                      ))}
                    </nav>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="contact" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-0">
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
                        <div key={phone.tel} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{phone.label}</p>
                          <a
                            href={`tel:${phone.tel}`}
                            className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
              {linkSections.map((section) => (
                <div key={section.title}>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">{section.title}</h4>
                  <nav className="grid gap-1">
                    {section.links.map((item) => (
                      <Link key={item.label} to={item.to} className={footerLinkClass}>
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
              ))}

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Sectors</h4>
                <nav className="grid gap-1">
                  {sectors.map((sector) => (
                    <a key={sector} href="/sectors" className={footerLinkClass}>
                      <span>{sector}</span>
                    </a>
                  ))}
                </nav>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Contact</h4>
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
                    <div key={phone.tel} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{phone.label}</p>
                      <a
                        href={`tel:${phone.tel}`}
                        className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
            className="border-t border-slate-200 pt-5 text-center text-xs leading-relaxed text-slate-500"
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
