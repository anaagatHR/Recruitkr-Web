const hasHttpScheme = (value: string) => /^https?:\/\//i.test(value);

const toNormalizedHttpUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const candidate = hasHttpScheme(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
};

export const normalizeOptionalHttpUrl = (value: string): string | null => toNormalizedHttpUrl(value);

export const normalizeOptionalLinkedinUrl = (value: string): string | null => {
  const normalized = toNormalizedHttpUrl(value);
  if (normalized === null || normalized === "") return normalized;

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com") ? normalized : null;
  } catch {
    return null;
  }
};

/**
 * Only same-origin, path-style redirects are honoured after login.
 *
 * `/login?redirect=…` is appended to every Apply link, and the parameter used
 * to be sent straight to `navigate()`. An attacker could mail a candidate a
 * link to the real recruitkr.com login page whose `redirect` pointed at a
 * look-alike site — the user signs in on the genuine page and is then handed
 * to the phishing site, which asks them to "sign in again".
 *
 * Accepted: a path beginning with a single "/" ("/jobs/123?x=1#apply").
 * Rejected (→ fallback): absolute URLs, scheme-relative "//evil.com",
 * backslash tricks ("/\evil.com"), control characters, and anything the URL
 * parser resolves to a different origin.
 */
export const safeRedirectPath = (candidate: string | null | undefined, fallback: string): string => {
  if (!candidate) return fallback;
  const value = candidate.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const base = "https://recruitkr.invalid";
    const parsed = new URL(value, base);
    if (parsed.origin !== base) return fallback;
    // "/jobs/..//evil.com" normalises to the pathname "//evil.com", which a
    // browser would then read as scheme-relative. Re-check after parsing.
    if (parsed.pathname.startsWith("//")) return fallback;
    // Never bounce straight back onto an auth page.
    if (/^\/(login|signup|forgot-password|reset-password)(\/|$)/.test(parsed.pathname)) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
};
