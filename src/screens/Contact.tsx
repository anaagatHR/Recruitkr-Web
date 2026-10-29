"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mail, Phone, Send, Sparkles, CheckCircle2, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";

// Cloudflare Turnstile (free CAPTCHA). Optional: without a site key the form
// relies on the honeypot field + the backend's per-IP rate limit.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Mounts the Turnstile widget lazily — the script is only requested when the
 * contact page renders and a site key is configured, never site-wide.
 */
function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !ref.current) return;
    let cancelled = false;

    const mount = () => {
      if (cancelled || !ref.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto",
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(""),
        "error-callback": () => onToken(""),
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(`script[src^="${TURNSTILE_SCRIPT}"]`);
      const script = existing ?? document.createElement("script");
      if (!existing) {
        script.src = TURNSTILE_SCRIPT;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
      return () => {
        cancelled = true;
        script.removeEventListener("load", mount);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="min-h-[65px]" />;
}

// Brand palette (navy / green / amber).
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const contactCards = [
  {
    icon: Mail,
    title: "Email us",
    lines: ["careers@recruitkr.com", "connect@recruitkr.com"],
    href: "mailto:connect@recruitkr.com",
    color: NAVY,
  },
  {
    icon: Phone,
    title: "Call us",
    lines: ["+91 90019 65072", "+91 96363 15150"],
    href: "tel:+919001965072",
    color: GREEN,
  },
  {
    icon: Clock,
    title: "Working hours",
    lines: ["Mon – Sat", "10:00 AM – 7:00 PM"],
    color: AMBER,
  },
];
// contact cards grid (rendered inside the component below)
const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — hidden from people, irresistible to form-filling bots.
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");

    const digits = mobile.replace(/\D/g, "");
    if (digits && !/^[6-9]\d{9}$/.test(digits)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      setSubmitting(false);
      return;
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the verification step.");
      setSubmitting(false);
      return;
    }

    try {
      await apiPost("/contact", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: digits,
        message: message.trim(),
        website,
        ...(turnstileToken ? { turnstileToken } : {}),
      });
      setSuccess("Message submitted successfully. Our team will reach out soon.");
      setName("");
      setEmail("");
      setMobile("");
      setMessage("");
      setTurnstileToken("");
      window.turnstile?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  // text-base on phones: anything under 16px makes iOS Safari zoom the page
  // when the field is focused.
  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main id="main" className="relative overflow-hidden pt-28 pb-20">
        {/* Decorative brand blobs */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: NAVY }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: GREEN }}
        />

        <div className="container relative mx-auto px-4">
          {/* Hero */}
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary animate-fade-up">
              <Sparkles size={14} /> Contact Us
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#264A7f] animate-fade-up-delay-1 md:text-5xl">
              Let&apos;s{" "}
              <span className="bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] bg-clip-text text-transparent">
                start a conversation
              </span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground animate-fade-up-delay-2">
              Hiring, careers, payroll or staffing — tell us what you need and our team will get back
              to you quickly.
            </p>
          </div>

          {/* Content grid */}
          <div className="mx-auto mt-14 grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.2fr]">
            {/* Contact info cards */}
            <div className="space-y-4">
              {contactCards.map((card) => {
                const Inner = (
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110 shrink-0"
                      style={{ backgroundColor: card.color }}
                    >
                      <card.icon size={22} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground">{card.title}</h3>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {card.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                );

                return card.href ? (
                  <a
                    key={card.title}
                    href={card.href}
                    className="group block rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                  >
                    {Inner}
                  </a>
                ) : (
                  <div
                    key={card.title}
                    className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {Inner}
                  </div>
                );
              })}
            </div>

            {/* Form */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
              <h2 className="mb-1 text-xl font-bold text-[#264A7F]">Send us a message</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Fill in the form and we&apos;ll respond within one business day.
              </p>

              {/* Every input has a name (so browser autofill and password
                  managers work), an id tied to its <label htmlFor>, and the
                  right type/inputMode so phones open the matching keyboard. */}
              <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium">Name *</label>
                    <input
                      id="contact-name"
                      name="name"
                      required
                      minLength={2}
                      autoComplete="name"
                      className={inputClass}
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-mobile" className="mb-1.5 block text-sm font-medium">Mobile</label>
                    <input
                      id="contact-mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      pattern="[6-9][0-9]{9}"
                      title="10-digit Indian mobile number"
                      autoComplete="tel-national"
                      className={inputClass}
                      placeholder="10-digit number"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium">Email *</label>
                  <input
                    id="contact-email"
                    name="email"
                    required
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium">Message *</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    minLength={10}
                    rows={5}
                    className={inputClass}
                    placeholder="How can we help?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* Honeypot. Off-screen and excluded from the tab order and
                    from assistive tech; a human never sees or fills it. */}
                <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
                  <label htmlFor="contact-website">Website</label>
                  <input
                    id="contact-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <TurnstileWidget onToken={setTurnstileToken} />

                {success && (
                  <p className="flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-3 text-sm font-medium text-secondary">
                    <CheckCircle2 size={16} className="shrink-0" /> {success}
                  </p>
                )}
                {error && (
                  <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition hover:scale-[1.02] disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : (<><Send size={16} /> Submit Message</>)}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <section className="container mx-auto px-4 pb-12">
        <h2 className="mb-4 text-lg font-bold text-foreground text-center">Our Location</h2>
        <div className="mx-auto max-w-5xl rounded-2xl overflow-hidden border border-border">
          <div className="relative" style={{ paddingTop: "56.25%" }}>
            <iframe
              title="RecruitKr location map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3234.1379471214714!2d75.79982807502302!3d26.888304076661715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396db55903d1d3ad%3A0xacb185731ebd12e4!2sRecruitKr%20Head%20Office!5e1!3m2!1sen!2sin!4v1782225290063!5m2!1sen!2sin"
              className="absolute left-0 top-0 h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
