import { Facebook, Instagram, Linkedin, Mail, Phone } from "lucide-react";
import OptimizedLogo from "@/components/OptimizedLogo";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
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

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/why-us" },
  { label: "Recruitment", to: "/services" },
  { label: "Payroll", to: "/services" },
  { label: "Staffing", to: "/services" },
  { label: "Gig Placement", to: "/services" },
  { label: "HR Solutions", to: "/services" },
  { label: "Career Counselling", to: "/services" },
  { label: "FAQs", to: "/faqs" },
  { label: "Blog", to: "/blog" },
];

const contactEmails = ["Careers@recruitkr.com", "Connect@recruitkr.com"];
const footerLinkClass =
  "flex min-w-0 items-center rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
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
          <div className="flex flex-col gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6 md:max-w-2xl">
              <div className="flex shrink-0 items-center">
                <OptimizedLogo
                  className="block h-24 w-auto sm:h-28 md:h-32 lg:h-40"
                  imgClassName="h-full w-auto object-contain drop-shadow-sm"
                  sizes="(max-width: 768px) 112px, 192px"
                />
              </div>
              <p className="max-w-md text-sm leading-relaxed text-slate-600 sm:text-left">
                Your End-to-End Hiring and HR Partner from recruitment to retention.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:justify-end md:pt-0">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {isMobile ? (
            <div className="pt-1">
              <Accordion type="single" collapsible className="grid gap-3">
                <AccordionItem value="links" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-0">
                  <AccordionTrigger className={mobileSectionTriggerClass}>Services</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1">
                    <nav className="grid gap-2">
                      {footerLinks.map((item) => (
                        <Link key={item.label} to={item.to} className={footerLinkClass}>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </nav>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="sectors" className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 px-0">
                  <AccordionTrigger className={mobileSectionTriggerClass}>Sectors</AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1">
                    <nav className="grid gap-2">
                      {["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"].map((sector) => (
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
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          Recruiters / Employers
                        </p>
                        <a
                          href="tel:+919001965072"
                          className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          <Phone size={16} className="shrink-0 opacity-90" /> +91 90019 65072
                        </a>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          Candidates / Job Seekers
                        </p>
                        <a
                          href="tel:+919636315150"
                          className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                        >
                          <Phone size={16} className="shrink-0 opacity-90" /> +91 96363 15150
                        </a>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Services</h4>
                <nav className="grid gap-2">
                  {footerLinks.map((item) => (
                    <Link key={item.label} to={item.to} className={footerLinkClass}>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Sectors</h4>
                <nav className="grid gap-2">
                  {["IT", "Healthcare", "Banking", "Retail", "Manufacturing", "Logistics"].map((sector) => (
                    <a key={sector} href="/sectors" className={footerLinkClass}>
                      <span>{sector}</span>
                    </a>
                  ))}
                </nav>
              </div>

              <div>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Contact</h4>
                <div className="grid gap-2 text-sm">
                  {contactEmails.map((email) => (
                    <a key={email} href={`mailto:${email}`} className={contactLinkClass}>
                      <Mail size={16} className="mt-0.5 shrink-0 opacity-90" />
                      <span className="min-w-0 break-words">{email}</span>
                    </a>
                  ))}
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Recruiters / Employers
                    </p>
                    <a
                      href="tel:+919001965072"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <Phone size={16} className="shrink-0 opacity-90" /> +91 9001965072
                    </a>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                      Candidates / Job Seekers
                    </p>
                    <a
                      href="tel:+91 9636312125"
                      className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700 transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      <Phone size={16} className="shrink-0 opacity-90" /> +91 9636312125
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 pt-5 text-center text-xs leading-relaxed text-slate-500">
            &copy; {new Date().getFullYear()} RecruitKr. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
