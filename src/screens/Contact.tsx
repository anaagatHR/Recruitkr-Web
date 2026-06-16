"use client";
import { useState, type FormEvent } from "react";
import { Mail, Phone, Send, Sparkles, CheckCircle2, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";

// Brand palette (navy / green / amber).
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const contactCards = [
  {
    icon: Mail,
    title: "Email us",
    lines: ["Careers@recruitkr.com", "Connect@recruitkr.com"],
    href: "mailto:Connect@recruitkr.com",
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

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess("");
    setError("");

    try {
      await apiPost("/contact", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        message: message.trim(),
      });
      setSuccess("Message submitted successfully. Our team will reach out soon.");
      setName("");
      setEmail("");
      setMobile("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="relative overflow-hidden pt-28 pb-20">
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
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground animate-fade-up-delay-1 md:text-5xl">
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
                  <>
                    <div
                      className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: card.color }}
                    >
                      <card.icon size={22} />
                    </div>
                    <h3 className="mb-1 text-base font-bold text-foreground">{card.title}</h3>
                    {card.lines.map((line) => (
                      <p key={line} className="text-sm text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </>
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
              <h2 className="mb-1 text-xl font-bold text-foreground">Send us a message</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Fill in the form and we&apos;ll respond within one business day.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Name *</label>
                    <input required className={inputClass} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Mobile</label>
                    <input className={inputClass} placeholder="10-digit number" value={mobile} onChange={(e) => setMobile(e.target.value)} maxLength={10} />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Email *</label>
                  <input required type="email" className={inputClass} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Message *</label>
                  <textarea required rows={5} className={inputClass} placeholder="How can we help?" value={message} onChange={(e) => setMessage(e.target.value)} />
                </div>

                {success && (
                  <p className="flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-3 text-sm font-medium text-secondary">
                    <CheckCircle2 size={16} className="shrink-0" /> {success}
                  </p>
                )}
                {error && (
                  <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>
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

      <Footer />
    </div>
  );
};

export default Contact;
