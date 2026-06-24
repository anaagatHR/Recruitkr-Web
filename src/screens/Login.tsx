"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "@/compat/router";
import { Sparkles, ShieldCheck, Zap, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiGet, apiPost } from "@/lib/api";
import { setSession } from "@/lib/auth";

// Brand palette (navy / green / amber).
const NAVY = "#264a7f";
const GREEN = "#69a44f";
const AMBER = "#e59f56";

const perks = [
  { icon: Zap, text: "Apply to jobs in one click", color: NAVY },
  { icon: ShieldCheck, text: "Verified, top-rated companies", color: GREEN },
  { icon: Heart, text: "Track every application in one place", color: AMBER },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState<"candidate" | "client">("candidate");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const googleLoginEnabled = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED !== "false";

  useEffect(() => {
    const role = new URLSearchParams(location.search).get("role");
    if (role === "client" || role === "candidate") {
      setUserType(role);
    }
  }, [location.search]);

  // Show a friendly message when the Google OAuth flow redirects back with an
  // error (cancelled consent, disabled login, etc.) instead of a raw JSON page.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("oauth") !== "error") return;

    const reason = params.get("reason") || "failed";
    const messages: Record<string, string> = {
      cancelled: "Google sign-in cancelled. Please try again.",
      disabled: "Google sign-in is off. Use email and password.",
      profile: "Couldn't get your email from Google. Try another account.",
      expired: "Link expired. Please sign in again.",
      role_candidate: "This account is a Candidate. Use the Candidate tab to sign in.",
      role_client: "This account is a Client. Use the Client tab to sign in.",
      redirect_mismatch: "Google sign-in setup issue. Please contact support.",
      config: "Google sign-in setup issue. Please contact support.",
      failed: "Google sign-in failed. Please try again.",
    };
    setFormError(messages[reason] || messages.failed);
  }, [location.search]);

useEffect(() => {
  const params = new URLSearchParams(location.search);

  if (params.get("oauth") !== "success") return;

  const code = params.get("code");
  const redirect = params.get("redirect");

  if (!code) return;

  void (async () => {
    try {
      setLoading(true);

      const response = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: {
            id: string;
            email: string;
            role: "candidate" | "client" | "admin";
          };
        };
      }>("/auth/oauth/exchange", {
        code,
      });

      if (!response.success || !response.data) {
        throw new Error("OAuth login failed");
      }

      const { accessToken, refreshToken, user } = response.data;

      setSession({
        accessToken,
        refreshToken,
        user,
      });

      // Remove code from URL
      window.history.replaceState({}, "", "/login");

      navigate(
        redirect ||
          (user.role === "client"
            ? "/dashboard/client"
            : "/dashboard/candidate"),
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error("OAuth exchange failed:", err);
      setFormError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  })();
}, [location.search, navigate]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setFormError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      return;
    }

    if (!password) {
      setPasswordError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiPost<{
        success: boolean;
        data?: {
          accessToken: string;
          refreshToken?: string;
          user: { id: string; email: string; role: "candidate" | "client" | "admin" };
        };
      }>("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
        role: userType,
      });

      if (!response.success || !response.data?.accessToken || !response.data.user) {
        throw new Error("Login failed");
      }

      setSession({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      });

      const redirect = new URLSearchParams(location.search).get("redirect");
      navigate(redirect || (userType === "candidate" ? "/dashboard/candidate" : "/dashboard/client"));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      if (/not registered|sign up first/i.test(message)) {
        setEmailError(message);
      } else if (/password/i.test(message)) {
        setPasswordError(message);
      } else if (/registered as|correct login type/i.test(message)) {
        setFormError(message);
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="relative overflow-hidden pt-28 pb-20">
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

        <div className="container relative mx-auto grid max-w-5xl items-center gap-10 px-4 lg:grid-cols-2">
          {/* Value side */}
          <div className="hidden lg:block">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Sparkles size={14} /> Welcome back
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground">
              Log in to your{" "}
              <span className="bg-gradient-to-r from-[#264a7f] via-[#69a44f] to-[#e59f56] bg-clip-text text-transparent">
                RecruitKr
              </span>{" "}
              account
            </h1>
            <p className="mt-4 text-muted-foreground">
              Pick up right where you left off — apply, track and manage everything in one place.
            </p>
            <ul className="mt-7 space-y-4">
              {perks.map((perk) => (
                <li key={perk.text} className="flex items-center gap-3 text-sm font-medium text-foreground">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: perk.color }}
                  >
                    <perk.icon size={17} />
                  </span>
                  {perk.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Form card */}
          <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
            <div className="text-center mb-8">
              <Link to="/" className="font-heading text-3xl font-bold">
                Recruit<span style={{ color: "#264a7f" }}>kr</span>
              </Link>
              <p className="mt-2 text-muted-foreground text-sm">ANAAGAT HUMANPOWER PRIVATE LIMITED</p>
            </div>

            <div className="flex rounded-xl overflow-hidden border border-border mb-8">
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-semibold transition-all ${userType === "candidate" ? "btn-gradient" : "text-muted-foreground"}`}
                onClick={() => setUserType("candidate")}
              >
                Candidate
              </button>
              <button
                type="button"
                className={`flex-1 py-3 text-sm font-semibold transition-all ${userType === "client" ? "btn-gradient" : "text-muted-foreground"}`}
                onClick={() => setUserType("client")}
              >
                Employer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {googleLoginEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    const redirect = new URLSearchParams(location.search).get("redirect");
                    const role = userType;
                    const qs = new URLSearchParams({
                      role,
                      ...(redirect ? { redirect } : {}),
                    });
                    window.location.href = `/api/v1/auth/google?${qs.toString()}`;
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <path
                      d="M21.35 11.1H12v2.97h5.35c-.23 1.23-.96 2.27-2 2.98v2.48h3.23c1.9-1.75 2.99-4.32 2.99-7.38 0-.72-.06-1.26-.22-2.05Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 22c2.7 0 4.97-.9 6.63-2.45l-3.23-2.48c-.9.6-2.06.95-3.4.95-2.61 0-4.83-1.76-5.62-4.13H3.04v2.59A10 10 0 0 0 12 22Z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.38 13.9A5.97 5.97 0 0 1 6 12c0-.66.11-1.3.38-1.9V7.5H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.5l3.34-2.6Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.02c1.47 0 2.78.51 3.82 1.52l2.86-2.86A9.61 9.61 0 0 0 12 2a10 10 0 0 0-8.96 5.5l3.34 2.59C7.17 6.78 9.39 5.02 12 5.02Z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </button>
              )}

              <div>
                <label className="block mb-1.5 text-sm font-medium text-foreground">Email ID</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                    setFormError("");
                  }}
                  className={inputClass}
                  placeholder="your@email.com"
                />
                {emailError && <p className="mt-1.5 text-xs text-red-500">{emailError}</p>}
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-muted-foreground hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError("");
                      setFormError("");
                    }}
                    className={`${inputClass} pr-20`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {passwordError && <p className="mt-1.5 text-xs text-red-500">{passwordError}</p>}
              </div>

              {formError && <p className="text-xs text-red-500">{formError}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-gradient w-full rounded-xl py-3.5 text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60"
              >
                {loading ? "Logging in..." : `Login as ${userType === "candidate" ? "Candidate" : "Employer"}`}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
              <p className="text-sm text-muted-foreground">Don&apos;t have an account?</p>
              <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
                <Link to="/signup" className="text-sm font-medium hover:underline" style={{ color: "#264a7f" }}>
                  Create a free account
                </Link>
                <span className="hidden text-muted-foreground sm:inline">|</span>
                <Link to="/signup/employer" className="text-sm font-medium hover:underline" style={{ color: "#69a44f" }}>
                  Register as Employer
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
