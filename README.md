# RecruitKr — Job Portal (Next.js + TypeScript)

RecruitKr is a job portal where candidates can **browse jobs and company ratings without logging in**, and only need an account to **apply**. Built with the Next.js App Router and TypeScript, with top-level SEO (per-route metadata, sitemap, robots, JSON-LD).

## Tech stack

- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix) components
- Talks to the existing **Express backend** (`NEXT_PUBLIC_API_URL`) for auth, blog, contact, dashboards
- Jobs / companies / ratings come from the backend (`/jobs`, `/companies`) with a **seed-data fallback** so the UI renders before those endpoints exist

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

### Environment (`.env.local`)

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_SITE_URL=https://www.recruitkr.com
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=...
NEXT_PUBLIC_GA_MEASUREMENT_ID=...   # optional
```

## Key flows

- **Browse without login** — `/jobs`, `/jobs/[id]`, `/companies`, `/companies/[id]` are public.
- **Login required to apply** — the "Apply" button redirects guests to `/login?redirect=...`.
- **Simple signup** — `/signup` collects only **name, email, mobile, password**.
- **FOMO** — live activity ticker, "new today / high demand" badges, applicant counts and scarcity nudges.
- **Ratings** — star ratings on jobs and company pages.
- **No admin** — admin screens were removed.

## SEO

- Per-route `metadata` (title/description/canonical/OG/Twitter) via `src/lib/seo.ts`
- Dynamic `src/app/sitemap.ts` and `src/app/robots.ts`
- Organization + WebSite JSON-LD in the root layout; per-job/company metadata generated server-side

## Project structure

```
src/app/         App Router routes (each page sets SEO metadata, renders a screen)
src/screens/     Page-level UI components (client)
src/components/  Shared UI + job-portal pieces (JobCard, CompanyCard, StarRating, FomoTicker)
src/compat/      react-router-dom -> next/navigation compatibility shim
src/lib/         api client, auth, jobs/companies data layer, seo helpers
```

## Migration note

The project was migrated from Vite + React Router to Next.js. Existing pages keep the
`react-router-dom` API through `src/compat/router.tsx`, so only import paths changed.
