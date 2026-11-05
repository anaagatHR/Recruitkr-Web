"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  Laptop,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  School,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TurnstileWidget, { TURNSTILE_SITE_KEY } from "@/components/TurnstileWidget";
import { apiPost } from "@/lib/api";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Partner enquiry: organisations that want to work with RecruitKr.
 *
 * Submissions go to the same POST /contact as the contact page, with
 * source "partners", so Business OS lists them under Client Queries with a
 * "Partners page" badge. Business OS reads only name, email, mobile, company,
 * subject and message, so every partner-specific answer is written into the
 * message as labelled lines (most important first: its list view shows the
 * first 180 characters) and the subject names the type and city.
 */

const PARTNER_TYPES = [
  { id: "company", label: "Company that's hiring", hint: "Hire through our recruitment and staffing services.", icon: Building2, question: "Roles to fill in the next 3 months", example: "e.g. 10 sales executives, 2 accountants" },
  { id: "agency", label: "Staffing agency", hint: "Place candidates faster with our employer network.", icon: BriefcaseBusiness, question: "Recruiters on your team", example: "e.g. 8" },
  { id: "institute", label: "Training institute", hint: "Connect trained learners to hiring companies.", icon: GraduationCap, question: "Courses you run", example: "e.g. Tally, digital marketing, full-stack" },
  { id: "college", label: "College placement cell", hint: "Campus drives and placements for your students.", icon: School, question: "Students graduating per year", example: "e.g. 300 across B.Tech and MBA" },
  { id: "channel", label: "Channel partner", hint: "Refer employers and candidates, and earn.", icon: Megaphone, question: "Who you work with", example: "e.g. SMEs and manufacturing units in Jaipur" },
  { id: "freelancer", label: "Freelance recruiter", hint: "Recruit on your own schedule, earn per placement.", icon: Laptop, question: "Your recruiting experience", example: "e.g. 3 years, IT and BPO hiring" },
] as const;

type PartnerType = (typeof PARTNER_TYPES)[number]["id"];
type Field = "type" | "org" | "city" | "name" | "email" | "mobile" | "consent";

const NEXT_STEPS = [
  { title: "We review your details", text: "Our partnerships team reads every enquiry and replies within one business day." },
  { title: "A short call", text: "We learn your goals and walk you through how partners work with RecruitKr." },
  { title: "Agreement and onboarding", text: "Clear terms, a named contact on our side, and you start working with us." },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder:text-muted-foreground transition focus:border-[#264a7f] focus:outline-none focus:ring-2 focus:ring-[#264a7f]/25 aria-[invalid=true]:border-red-600 sm:text-sm";

const Label = ({ htmlFor, children, optional }: { htmlFor: string; children: string; optional?: boolean }) => (
  <label htmlFor={htmlFor} className="block text-sm font-semibold text-foreground">
    {children}
    {optional ? (
      <span className="font-normal text-muted-foreground"> (optional)</span>
    ) : (
      <span aria-hidden="true" className="text-red-600"> *</span>
    )}
  </label>
);

const ErrorText = ({ id, children }: { id: string; children?: string }) =>
  children ? (
    <p id={id} className="mt-1.5 text-sm font-medium text-red-700">
      {children}
    </p>
  ) : null;

export default function PartnerApply() {
  const [type, setType] = useState<PartnerType | "">("");
  const [org, setOrg] = useState("");
  const [city, setCity] = useState("");
  const [orgSite, setOrgSite] = useState("");
  const [answer, setAnswer] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot, must stay empty
  const [turnstileToken, setTurnstileToken] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const onToken = useCallback((token: string) => setTurnstileToken(token), []);

  const selected = PARTNER_TYPES.find((t) => t.id === type);

  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    const digits = mobile.replace(/\D/g, "");
    if (!type) next.type = "Choose how you'd like to partner with us.";
    if (org.trim().length < 2) next.org = "Enter your organisation's name.";
    if (city.trim().length < 2) next.city = "Enter your city.";
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email address.";
    if (!/^[6-9]\d{9}$/.test(digits)) next.mobile = "Enter a valid 10-digit mobile number.";
    if (!consent) next.consent = "Please confirm we may contact you.";
    return next;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setServerError("");
    const found = validate();
    setErrors(found);
    const first = (Object.keys(found) as Field[])[0];
    if (first) {
      // Move focus to the first problem so keyboard and screen-reader users land on it.
      document.getElementById(first === "type" ? `ptype-${PARTNER_TYPES[0].id}` : `p-${first}`)?.focus();
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setServerError("Please complete the verification step.");
      return;
    }

    const typeLabel = selected?.label ?? "";
    // Labelled lines, most important first (Business OS previews 180 chars).
    const lines = [
      `Partnership type: ${typeLabel}`,
      `Organisation: ${org.trim()}`,
      `City: ${city.trim()}`,
      answer.trim() ? `${selected?.question}: ${answer.trim()}` : null,
      orgSite.trim() ? `Website / LinkedIn: ${orgSite.trim()}` : null,
      `Contact: ${name.trim()}${designation.trim() ? `, ${designation.trim()}` : ""}`,
      "", // blank line between the details and their message
      message.trim() || "No additional message.",
    ].filter((line): line is string => line !== null);

    setSubmitting(true);
    try {
      await apiPost("/contact", {
        source: "partners",
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.replace(/\D/g, ""),
        company: org.trim().slice(0, 120),
        subject: `Partnership – ${typeLabel} · ${city.trim()}`.slice(0, 120),
        message: lines.join("\n").slice(0, 3000),
        website,
        ...(turnstileToken ? { turnstileToken } : {}),
      });
      setDone(true);
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "We couldn't send your enquiry. Please try again.");
      window.turnstile?.reset();
      setTurnstileToken("");
    } finally {
      setSubmitting(false);
    }
  };

  const describe = (field: Field) => (errors[field] ? `p-${field}-error` : undefined);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main" className="pb-20 pt-28 sm:pt-32">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6">
          <header className="max-w-3xl">
            {/* text-[#16305a] on the h1 itself: index.css paints h1/h2 with a gradient by default. */}
            <h1 className="heading-plain font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.03em] text-[#16305a] dark:text-white sm:text-5xl">
              Partner with RecruitKr
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Companies, staffing agencies, training institutes, colleges and independent recruiters work with us to
              hire and place talent across India. Tell us about your organisation and our partnerships team will get in
              touch.
            </p>
          </header>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
              {done ? (
                <div role="status" className="py-6 text-center sm:py-10">
                  <CheckCircle2 aria-hidden className="mx-auto h-14 w-14 text-[#69a44f]" />
                  <h2
                    ref={doneRef}
                    tabIndex={-1}
                    className="heading-plain mt-4 font-display text-2xl font-extrabold text-foreground focus:outline-none"
                  >
                    Thank you, {name.trim().split(" ")[0]}. Your enquiry has reached our partnerships team.
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
                    We&apos;ll contact you at {email.trim()} or {mobile.replace(/\D/g, "")} within one business day to
                    discuss how {org.trim()} can work with RecruitKr.
                  </p>
                  <a
                    href={whatsappLink(`Hi RecruitKr, I just sent a partnership enquiry for ${org.trim()}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-6 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#128c4b] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0f7a41]"
                  >
                    <MessageCircle size={18} aria-hidden /> Can&apos;t wait? Message us on WhatsApp
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate aria-describedby={serverError ? "p-server-error" : undefined}>
                  <fieldset aria-describedby={describe("type")}>
                    <legend className="font-display text-lg font-bold text-foreground">
                      How would you like to partner with us?<span aria-hidden="true" className="text-red-600"> *</span>
                    </legend>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {PARTNER_TYPES.map((t) => {
                        const Icon = t.icon;
                        return (
                          <label key={t.id} className="relative block cursor-pointer">
                            <input
                              id={`ptype-${t.id}`}
                              type="radio"
                              name="partnerType"
                              value={t.id}
                              checked={type === t.id}
                              onChange={() => {
                                setType(t.id);
                                setAnswer("");
                                setErrors((e) => ({ ...e, type: undefined }));
                              }}
                              className="peer sr-only"
                            />
                            <span className="flex h-full items-start gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-[#264a7f]/50 peer-checked:border-[#264a7f] peer-checked:bg-[#264a7f]/[0.06] peer-checked:shadow-[inset_0_0_0_1px_#264a7f] peer-focus-visible:ring-2 peer-focus-visible:ring-[#264a7f] peer-focus-visible:ring-offset-2">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#264a7f]/10 text-[#264a7f] dark:text-[#8fb4e8]">
                                <Icon size={20} aria-hidden />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-foreground">{t.label}</span>
                                <span className="mt-0.5 block text-sm text-muted-foreground">{t.hint}</span>
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <ErrorText id="p-type-error">{errors.type}</ErrorText>
                  </fieldset>

                  <fieldset className="mt-8">
                    <legend className="font-display text-lg font-bold text-foreground">Your organisation</legend>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label htmlFor="p-org">Organisation name</Label>
                        <input id="p-org" value={org} onChange={(e) => setOrg(e.target.value)} autoComplete="organization" aria-required="true" aria-invalid={!!errors.org} aria-describedby={describe("org")} className={inputClass} />
                        <ErrorText id="p-org-error">{errors.org}</ErrorText>
                      </div>
                      <div>
                        <Label htmlFor="p-city">City</Label>
                        <input id="p-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" aria-required="true" aria-invalid={!!errors.city} aria-describedby={describe("city")} className={inputClass} />
                        <ErrorText id="p-city-error">{errors.city}</ErrorText>
                      </div>
                      <div>
                        <Label htmlFor="p-site" optional>Website or LinkedIn</Label>
                        <input id="p-site" type="url" inputMode="url" value={orgSite} onChange={(e) => setOrgSite(e.target.value)} placeholder="https://" className={inputClass} />
                      </div>
                      {selected && (
                        <div className="sm:col-span-2">
                          <Label htmlFor="p-answer" optional>{selected.question}</Label>
                          <input id="p-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={selected.example} className={inputClass} />
                        </div>
                      )}
                    </div>
                  </fieldset>

                  <fieldset className="mt-8">
                    <legend className="font-display text-lg font-bold text-foreground">Contact person</legend>
                    <div className="mt-4 grid gap-5 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="p-name">Full name</Label>
                        <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-required="true" aria-invalid={!!errors.name} aria-describedby={describe("name")} className={inputClass} />
                        <ErrorText id="p-name-error">{errors.name}</ErrorText>
                      </div>
                      <div>
                        <Label htmlFor="p-designation" optional>Designation</Label>
                        <input id="p-designation" value={designation} onChange={(e) => setDesignation(e.target.value)} autoComplete="organization-title" placeholder="e.g. HR Manager, Placement Officer" className={inputClass} />
                      </div>
                      <div>
                        <Label htmlFor="p-email">Work email</Label>
                        <input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" aria-required="true" aria-invalid={!!errors.email} aria-describedby={describe("email")} className={inputClass} />
                        <ErrorText id="p-email-error">{errors.email}</ErrorText>
                      </div>
                      <div>
                        <Label htmlFor="p-mobile">Mobile number</Label>
                        <input id="p-mobile" type="tel" inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel-national" placeholder="10-digit number" aria-required="true" aria-invalid={!!errors.mobile} aria-describedby={describe("mobile")} className={inputClass} />
                        <ErrorText id="p-mobile-error">{errors.mobile}</ErrorText>
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="p-message" optional>How would you like to work with us?</Label>
                        <textarea id="p-message" rows={4} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your goals, timelines, or anything we should know before we call." className={inputClass} />
                      </div>
                    </div>
                  </fieldset>

                  {/* Honeypot: hidden from people and assistive tech; bots fill it in. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label htmlFor="p-website">Leave this empty</label>
                    <input id="p-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-start gap-3">
                      <input id="p-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} aria-required="true" aria-invalid={!!errors.consent} aria-describedby={describe("consent")} className="mt-0.5 h-5 w-5 shrink-0 accent-[#264a7f]" />
                      <label htmlFor="p-consent" className="text-sm text-foreground">
                        RecruitKr may contact me by phone, email or WhatsApp about this partnership enquiry.
                      </label>
                    </div>
                    <ErrorText id="p-consent-error">{errors.consent}</ErrorText>
                  </div>

                  <div className="mt-6">
                    <TurnstileWidget onToken={onToken} />
                  </div>

                  {serverError && (
                    <p id="p-server-error" role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {serverError}
                    </p>
                  )}

                  <button
                    type="submit"
                    aria-busy={submitting}
                    className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[#264a7f] px-6 text-base font-semibold text-white transition-colors hover:bg-[#1d3a63] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#264a7f] focus-visible:ring-offset-2 sm:w-auto"
                  >
                    {submitting ? "Sending your enquiry…" : "Send partnership enquiry"}
                  </button>
                </form>
              )}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28 lg:h-fit">
              <section aria-labelledby="next-steps" className="rounded-3xl bg-[#16305a] p-6 text-white sm:p-7">
                <h2 id="next-steps" className="heading-plain font-display text-lg font-bold text-white">
                  What happens next
                </h2>
                <ol className="mt-5 space-y-5">
                  {NEXT_STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-3">
                      <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#69a44f] text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">{step.title}</span>
                        <span className="mt-0.5 block text-sm leading-relaxed text-white/80">{step.text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>

              <section aria-labelledby="talk-direct" className="rounded-3xl border border-border bg-card p-6 sm:p-7">
                <h2 id="talk-direct" className="heading-plain font-display text-lg font-bold text-foreground">
                  Prefer to talk directly?
                </h2>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>
                    <a href="mailto:connect@recruitkr.com" className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-[#264a7f] hover:underline dark:text-[#8fb4e8]">
                      <Mail size={18} aria-hidden /> connect@recruitkr.com
                    </a>
                  </li>
                  <li>
                    <a href="tel:+919001965072" className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-[#264a7f] hover:underline dark:text-[#8fb4e8]">
                      <Phone size={18} aria-hidden /> +91 90019 65072
                    </a>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
