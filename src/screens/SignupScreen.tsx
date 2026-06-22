"use client";

import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "@/compat/router";
import { Building2, CheckCircle2, Lock, Mail, Phone, User, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/auth";

type SignupRole = "candidate" | "client";

const copy: Record<
  SignupRole,
  {
    badge: string;
    heading: string;
    sub: string;
    formTitle: string;
    formSub: string;
    nameLabel: string;
    cta: string;
    dashboard: string;
    perks: string[];
    altLabel: string;
    altTo: string;
  }
> = {
  candidate: {
    badge: "🔥 12,000+ candidates hired this year",
    heading: "Create your free account in seconds",
    sub: "Join thousands of job seekers landing roles at top-rated companies. No long forms — just the essentials.",
    formTitle: "Candidate sign up",
    formSub: "Browse jobs for free. Login is only needed to apply.",
    nameLabel: "Full name",
    cta: "Create free account",
    dashboard: "/dashboard/candidate",
    perks: [
      "Apply to any job in one click",
      "Track every application in your dashboard",
      "Get matched with verified, top-rated companies",
    ],
    altLabel: "Sign up as an employer",
    altTo: "/signup/employer",
  },
  client: {
    badge: "🚀 Hire from 50,000+ active candidates",
    heading: "Start hiring in seconds",
    sub: "Post jobs and reach verified, job-ready candidates. Same quick sign up — just the essentials.",
    formTitle: "Employer sign up",
    formSub: "Create an employer account to post jobs and manage candidates.",
    nameLabel: "Your name / Company",
    cta: "Create employer account",
    dashboard: "/dashboard/client",
    perks: [
      "Post jobs and manage applicants in one place",
      "Reach pre-screened, rated candidates",
      "Track your hiring pipeline from your dashboard",
    ],
    altLabel: "Sign up as a candidate",
    altTo: "/signup",
  },
};

export default function SignupScreen({ role = "candidate" }: { role?: SignupRole }) {
  const navigate = useNavigate();
  const location = useLocation();
  const c = copy[role];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const redirect = new URLSearchParams(location.search).get("redirect") || c.dashboard;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (!/^\d{10}$/.test(mobile.trim())) return setError("Enter a valid 10-digit mobile number.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    // Same simple fields for both roles; only the endpoint + a couple of
    // role-specific keys differ.
    const endpoint = role === "client" ? "/auth/register/client" : "/auth/register/candidate";
    const payload: Record<string, unknown> =
      role === "client"
        ? {
            // The client register schema is strict, so the contact person's name
            // must go through spoc.name (fullName/contactName are not valid keys).
            companyName: name.trim(),
            spoc: { name: name.trim() },
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            password,
          }
        : {
            fullName: name.trim(),
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            password,
            experienceStatus: "fresher",
          };

    setLoading(true);
    try {
      const res = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
        };
      }>(endpoint, payload);

      if (!res?.success || !res.data?.accessToken || !res.data.user) {
        throw new Error("Sign up failed. Please try again.");
      }

      setSession({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        user: res.data.user,
      });
      setDone(true);
      setTimeout(() => navigate(redirect), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";
  const iconWrap = "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground";

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-4 text-secondary" size={56} />
          <h2 className="font-heading text-2xl font-bold">Welcome to RecruitKr!</h2>
          <p className="mt-2 text-muted-foreground">Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative overflow-hidden pb-20 pt-28">
        {/* Decorative brand blobs */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "#264a7f" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: "#69a44f" }}
        />

        <div className="container relative mx-auto grid max-w-5xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
        {/* Value side */}
        <div className="hidden lg:block">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles size={14} /> Join RecruitKr
          </p>
          <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-foreground">
            <span className="bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] bg-clip-text text-transparent">
              {c.heading}
            </span>
          </h1>
          <p className="mt-4 text-muted-foreground">{c.sub}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            {c.badge}
          </span>
          <ul className="mt-7 space-y-4">
            {c.perks.map((p, i) => {
              const colors = ["#264a7f", "#69a44f", "#e59f56"];
              return (
                <li key={p} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  >
                    <CheckCircle2 size={17} />
                  </span>
                  {p}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Form */}
        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
          <h2 className="font-heading text-2xl font-bold">{c.formTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.formSub}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div className="relative">
              <span className={iconWrap}>{role === "client" ? <Building2 size={17} /> : <User size={17} />}</span>
              <input className={field} placeholder={c.nameLabel} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="relative">
              <span className={iconWrap}><Mail size={17} /></span>
              <input type="email" className={field} placeholder="Email (Gmail)" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <span className={iconWrap}><Phone size={17} /></span>
              <input inputMode="numeric" className={field} placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            </div>
            <div className="relative">
              <span className={iconWrap}><Lock size={17} /></span>
              <input
                type={showPassword ? "text" : "password"}
                className={`${field} pr-16`}
                placeholder="Password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button type="submit" disabled={loading} className="btn-gradient w-full rounded-xl py-3.5 text-sm font-bold transition hover:scale-[1.02] disabled:opacity-60">
              {loading ? "Creating account..." : c.cta}
            </button>
          </form>

          <div className="mt-5 space-y-1 text-center text-sm text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
            <p>
              <Link to={c.altTo} className="font-medium text-secondary hover:underline">
                {c.altLabel}
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
