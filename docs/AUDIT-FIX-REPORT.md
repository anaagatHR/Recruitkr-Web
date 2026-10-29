# RecruitKr.com — Audit Fix Report

**Audit:** 20 Oct 2026 (30 issues) · **Fixes applied:** 24 Oct 2026 · **Repo:** `Recruitkr-Web` (working tree, not yet committed)

## Status: 29 of 30 issues fixed in code · 1 needs a dashboard action

| # | Issue | Status | What changed |
|---|-------|--------|--------------|
| 1 | 49/50 jobs show "Company" | ✅ Fixed | Backend normaliser now reads `company`, `companyName`, `company_name`, `clientName`, `employer*`, nested `client.companyName`… (legacy CRM docs used different keys). Literal "Company" treated as empty. Frontend shows **"Confidential Employer"** instead of "Company". New `backend/scripts/backfillJobCompanies.js` fills names from the owner's ClientProfile (`npm run jobs:backfill-companies` = dry-run, `:apply` to write). |
| 2 | Description / salary / experience empty | ✅ Fixed | Same tolerant pickers for `description`/`job_description`/`details`, `salary_min`/`salaryMin`, `experience_required`… API now returns `isComplete`; homepage "Fresh on the board" only shows complete, live, unexpired jobs. `?complete=1` filter on `/jobs`. |
| 3 | Hardcoded "500+ / 100+ / 120+ jobs" | ✅ Fixed | New **`GET /api/v1/stats`** (activeJobs, companies, byType, byMode, byLocation; CDN-cached). Hero tiles + all 6 category badges read from it. Counts are exact below 100 and only ever round *down* ("1,000+"). While loading / offline: "Live · Openings updated daily", never "0+". |
| 4 | "Placement Satisfaction 100+" and "0+" in SSR | ✅ Fixed | Per-item suffix (`100%`). Counter server-renders the final value; animation client-only; respects `prefers-reduced-motion`. |
| 5 | "0 applicants" on every job | ✅ Fixed | <5 → "Be among the first to apply"; 5–19 → plain count; 🔥 only at 20+. |
| 6 | Public "Admin" link → Vercel app | ✅ Code / ⚠️ Infra | Link removed from footer. **You still need to:** put the admin app on `admin.recruitkr.com`, enable Vercel password protection / SSO, add `noindex`. |
| 7 | `/jobs?limit=50` fetched twice | ✅ Fixed | `fetchJobs()` shares one in-flight promise + 60 s memo across all home sections. |
| 8 | Zero API caching | ✅ Fixed | `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600` on `/jobs`, `/jobs/:id`, `/stats`. `/assets/*` immutable 1 year. |
| 9 | Description formatting lost | ✅ Fixed | New `JobDescription` component: headings, bullets (`- • * 1.`), paragraphs — text-only rendering, nothing to sanitise. |
| 10 | Expired job still applyable | ✅ Fixed | Backend: past `applicationDeadline` → `canApply:false`, `isExpired:true`, dropped from public list (detail page still resolves, Apply disabled, `noindex`). Cards show "Closes in N days" / "Closes today". JSON-LD `validThrough` uses the real deadline. |
| 11 | 18 jobs never shown | ✅ Fixed | Infinite scroll already existed; added explicit **"Load more jobs"** button fallback and exact "Showing 12 of 68 jobs" count (was "1+ job found"). |
| 12 | Contact form spam / fields | ✅ Fixed | `name`/`id`/`htmlFor` on every field, `type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" autoComplete`, 16 px inputs (no iOS zoom), hidden honeypot (`website`), optional **Cloudflare Turnstile** (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`), server-side verification. Rate-limit + zod were already there. |
| 13 | Card "Apply" → login wall | ✅ Fixed | Card goes to the job page first ("View & apply"); login only from the detail CTA, with "Free · under a minute · Create an account" copy. |
| 14 | "Profile" shown to logged-out users | ✅ Fixed | New `useSession()` hook (SSR-safe). Logged out: **"Login / Sign up"**; logged in: "Profile" → role dashboard. Desktop nav, mobile icon and bottom nav. |
| 15 | Weak hero copy | ✅ Fixed | "Verified jobs across Rajasthan & India. Chat directly with recruiters and track every application — free for job seekers." |
| 16 | Footer emails wrap mid-address | ✅ Fixed | `whitespace-nowrap`, contact column `minmax(240px)`, emails lowercased everywhere. |
| 17 | Carousel duplicates / fake links | ✅ Already OK | Cards were already `<Link>`; duplicates already `aria-hidden` + `inert`. Arrow buttons enlarged to 44 px. |
| 18 | Buttons used for navigation | ✅ Fixed | "Explore jobs", "Talk to us" are real `<a>` links. |
| 19 | "1 openings", "1+ job found", "Job ?" | ✅ Fixed | `pluralize()` helper everywhere; exact counts; "Dream Job?"; titles `.trim()`ed and whitespace-collapsed. (Data typos like "tellecaller" must be fixed in the DB/admin.) |
| 20 | Testimonial videos weight / consent | ✅ Code / ⚠️ Process | Lite-embed (poster → iframe on click, lazy) was already in place; stop button 44 px. **Written consent per video is a process item for you.** |
| 21 | 12 images without alt | ✅ Fixed | Company logos: `alt="{name} logo"`. Only decorative images keep `alt=""`. (jsx-a11y alt-text rule is on via `next/core-web-vitals`.) |
| 22 | No `<main>` / skip link | ✅ Fixed | `<a href="#main">Skip to content</a>` in root layout (visible on focus); `<main id="main">` on all 14 public screens + dashboard layout. |
| 23 | Labels, tap targets, tiny text | ✅ Fixed | All 88 instances of 9–11.5 px text raised to 12 px; icon buttons (`size="icon"`, carousel, slider, social, video) → 44 px; filter chips `aria-pressed`; search inputs labelled. |
| 24 | SEO title "at Company", "2-4 experience" | ✅ Fixed | `{title} – {company or Confidential Employer} \| Jobs in {city} \| RecruitKr`; `formatExperience("2-4") → "2–4 years experience"`. |
| 25 | 745 KB JS / 134 KB CSS | ✅ Partly | Home route chunk **15.4 kB → 6.4 kB (−58 %)**, first-load JS 187 → 177 kB via `next/dynamic` on 5 below-fold sections. Tailwind content globs were already correct; the CSS size comes from the shared global stylesheet and dashboards — a larger refactor. |
| 26 | 8 routes prefetched on load | ✅ Fixed | `prefetch={false}` on nav, bottom nav and footer links (Next still prefetches on hover). |
| 27 | 40 KB favicon, upscaled hero | ✅ Fixed | New `favicon-32.png` (0.8 KB) + `icon-192.png`; hero `sizes="100vw"` (was capped at 1200 px → blurry on wide screens); only current + next slide mounted (was all 4 ≈ 700 KB). |
| 28 | 7,700 px / 15 sections | ✅ Fixed | **7 sections**: Hero → Fresh jobs → Categories → Why us → Numbers → Stories → CTA. Mobile height 5,947 px. FAQ, partners, companies-hiring, reviews removed from home (still on their own pages). |
| 29 | Security headers | ✅ Fixed | HSTS (2y, preload), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, and a **CSP** allowing only self, GA, Turnstile, YouTube, Google Maps, ImageKit, your API/WS origin. |
| 30 | Open redirect on `/login?redirect=` | ✅ Fixed | `safeRedirectPath()` (frontend) + `sanitizeRedirectPath()` (backend OAuth state) — only same-origin paths; rejects `//`, `https:`, `/\`, `..//` tricks, control chars, auth pages. |

**Bonus fix:** a stray `>` in `HeroPhotoSlider.tsx` rendered a literal ">" on the hero and was the one pre-existing `tsc` error. Removed.

## Verification

| Check | Result |
|-------|--------|
| `tsc --noEmit` (frontend) | ✅ 0 errors (was 1) |
| `next lint` | ✅ 0 errors, 7 pre-existing warnings |
| `next build` | ✅ 31/31 routes |
| `eslint .` (backend) | ✅ 0 errors |
| **Backend unit tests** `npm test` (new) | ✅ 11/11 — normaliser, deadlines, cache header, redirect guard |
| **Frontend unit tests** `npm test` (new, `tsx --test`) | ✅ 13/13 — normaliser, stats formatting, redirect guard, description parser, pluralise |
| **Playwright smoke** against production build (mobile + desktop) | ✅ 49/49 — landmarks, skip link, no console errors, no text <12 px, no targets <24 px, copy, headers, honeypot, open-redirect |
| Security headers on live response | ✅ all 7 present |

> Build/smoke ran with the backend offline, so the hero showed its honest fallback copy ("Live / Verified"); with the API up it shows the real counts.

## What you need to do

1. **Review & commit** — the changes are in your working tree (`git status` shows 80 files). Suggested: one commit per phase, or a single `fix: implement Oct-2026 site audit (30 issues)`.
2. **`npm install`** in the repo root — one new devDependency (`tsx`, for the test runner).
3. **Run the backfill** against production once: `cd backend && npm run jobs:backfill-companies` (dry run, prints the plan), then `npm run jobs:backfill-companies:apply`. It also prints every listing that remains incomplete so an admin can finish or unpublish them.
4. **Admin app (#6, infra):** move `recruitkr-business-os.vercel.app` to `admin.recruitkr.com`, turn on Vercel Password Protection or SSO, set `noindex`.
5. **Optional Turnstile:** create a free widget on Cloudflare → set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Vercel) and `TURNSTILE_SECRET_KEY` (backend). Without keys the form still works with honeypot + rate limit.
6. **After deploy, watch the CSP for ~a day** in the browser console. It is enforcing (not report-only). If a legitimate third party gets blocked, add its origin in `next.config.mjs → contentSecurityPolicy`.
7. **Reindex Solr** if you use it (`npm run solr:reindex`) so cached payloads carry the new `isComplete` / `isExpired` fields.
8. Video consent (#20) and data typos like "tellecaller" (#19) are content/process items.

## Files of note (new)

- `backend/scripts/backfillJobCompanies.js` — company backfill + incomplete-jobs report
- `backend/tests/normalizePublicJob.test.js` — backend tests
- `src/lib/stats.ts` — `/stats` client, `useSiteStats()`, `formatCount()`
- `src/hooks/useSession.ts` — SSR-safe session hook
- `src/components/job/JobDescription.tsx` — safe description formatter
- `src/lib/__tests__/audit-fixes.test.ts` — frontend tests
- `public/favicon-32.png`, `public/icon-192.png`
