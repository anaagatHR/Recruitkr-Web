# RecruitKr — Architecture Blueprint & Implementation Plan

> Grounded in the **actual** repository as of this writing, not an idealized greenfield.
> Where the original spec diverges from what's really here, the divergence is called out
> so estimates stay honest.

---

## 0. Reality check: spec vs. this repo

The brief asked for a stack that partly differs from what's installed. Building "to spec"
in places means a migration, not a feature. Decide these before estimating.

| Area | Spec asked for | What's actually here | Action |
|---|---|---|---|
| Frontend framework | Next.js 15 | **Next.js 14.2** (App Router) | Stay on 14, or plan a 15 upgrade separately |
| FE language | TypeScript | TypeScript ✅ | — |
| UI kit | shadcn/ui | Radix + shadcn-style `src/components/ui` ✅ | — |
| Animations | Framer Motion | **Not installed** | Add `framer-motion` if needed |
| Tables | TanStack Table | **Not installed** (only `@tanstack/react-query`) | Add `@tanstack/react-table` for data grids |
| Command palette | — | `cmdk` **installed**, unused | Wire it into a palette |
| Charts | Recharts | Recharts ✅ | — |
| Backend language | TypeScript | **JavaScript (ESM)** | Keep JS, or plan a TS migration separately |
| Backend framework | Express.js | **Express 5** ✅ | — |
| DB | MongoDB Atlas | Mongoose 8 ✅ | — |
| Realtime | Socket.IO | Socket.IO 4 ✅ (rooms `user:<id>`, presence) | — |
| Auth | JWT | JWT (access + password-change invalidation, argon2/bcrypt) ✅ | — |
| Search | Apache Solr 9 | Solr **jobs only**, HTTP service, no candidate index, no `/api/search/*` | Build out (see §3) |
| Email | Brevo | **nodemailer** (SMTP — can point at Brevo) | Confirm SMTP host = Brevo |
| Images | ImageKit | ImageKit ✅ | — |
| Resume PDF | — | Puppeteer + `templates/resume.html` ✅ | Extend to multi-template |

**Routing note:** the app was migrated from a Vite/React-Router SPA to Next App Router.
Screens live in [`src/screens/`](../src/screens) and are mounted by thin pages in
[`src/app/`](../src/app) through a compatibility shim [`@/compat/router`](../src/compat).
New screens follow the same pattern: heavy component in `src/screens`, thin `page.tsx` wrapper.

---

## 1. Folder structure

### Backend (`/backend`) — current, with planned additions marked `➕`

```
backend/src/
├── app.js                  # Express app: helmet, cors allowlist, mongo-sanitize, hpp, rate limit
├── server.js               # HTTP + Socket.IO bootstrap
├── socket.js               # Socket.IO: auth handshake, user rooms, presence, emitToUser
├── config/
│   ├── db.js  env.js  imagekit.js
├── controllers/
│   ├── auth  user  job  message  dashboard  resume  blog  contact  upload  seo  team
│   └── ➕ search.controller.js   ➕ admin.controller.js   ➕ notification.controller.js
├── middlewares/
│   ├── auth.js (requireAuth, requireRole, requireStreamAuth)
│   ├── errorHandler  rateLimiter  upload  validate
│   └── ➕ requireRole('admin') flows already supported
├── models/
│   ├── User  CandidateProfile  ClientProfile  JobRequirement  Application
│   ├── Conversation  Message  Resume  CandidateFile  BlogPost  ContactMessage  OurTeam
│   └── ➕ Notification.js   ➕ InterviewFeedback.js   ➕ (Message reactions = subdoc)
├── routes/                 # one router per domain, mounted in routes/index.js under /api/v1
│   └── ➕ search.routes.js  ➕ admin.routes.js  ➕ notification.routes.js
├── schemas/                # zod request validation
├── services/
│   ├── solr.service.js     # jobs indexing + searchJobsViaSolr
│   ├── jobSearch.service.js conversation.service.js liveUpdate.service.js
│   ├── mail.service.js resume.service.js imagekit.js
│   └── ➕ candidateSearch.service.js (Solr candidates)  ➕ analytics.service.js
└── utils/                  # jwt, ApiError, asyncHandler, security, resumeBuilder, sendEmail
```

### Frontend (`/src`) — current, with planned additions marked `➕`

```
src/
├── app/                    # Next App Router — thin page wrappers + sitemap/robots
│   ├── dashboard/candidate/page.tsx   dashboard/client/page.tsx
│   └── ➕ dashboard/admin/page.tsx
├── screens/                # real screen components
│   ├── CandidateDashboard.tsx  ClientDashboard.tsx  Messages.tsx  MyApplications.tsx
│   └── ➕ AdminDashboard.tsx
├── components/
│   ├── DashboardLayout.tsx (shared sidebar/topbar shell)
│   ├── ui/ (shadcn primitives)
│   └── ➕ command-palette/  ➕ notifications/  ➕ kanban/  ➕ resume-builder/  ➕ data-table/
├── hooks/  (useServerEvents, …)
├── lib/    (auth, messages, api client)
└── compat/ (router shim)
```

---

## 2. Database schema (MongoDB / Mongoose)

### Existing (verified in `backend/src/models`)

- **User** — auth identity, `role: candidate | client | admin`, password hash, `passwordChangedAt` (token invalidation).
- **CandidateProfile** — fullName, skills[], qualifications, experience, preferences, photo, videos[], portfolio/linkedin.
- **ClientProfile** — company identity, `profileImage`.
- **JobRequirement** — the job posting (title, location, type, etc.).
- **Application** — the core funnel record. Already rich:
  `status: applied | under-review | screening | interview | offer | hired | rejected`,
  `timeline[]` (audited stage changes), `interviewDetails` (scheduledAt, mode, links, contact),
  denormalized candidate snapshot, `conversationId`, unread counters.
- **Conversation** — 1:1 candidate↔client, denormalized `candidateSnapshot`, unread counters, `systemSeeded`.
- **Message** — body, `messageType: text | image | audio | file | system | interview`, `attachment`, `meta`, delivered/read timestamps.
- **Resume / CandidateFile** — resume storage + uploaded files.

### Planned additions

```js
// Notification.js
{ userId, role, type: 'application'|'interview'|'message'|'offer'|'system',
  title, body, link, read: Boolean, createdAt }   // + index { userId, read, createdAt }

// Message.js — add reactions subdoc
reactions: [{ userId, emoji, at }]

// InterviewFeedback.js
{ applicationId, interviewerId, ratings:{...}, recommendation, notes, createdAt }
```

> **Note on "Revenue metrics":** there is currently **no billing/subscription model**.
> Revenue widgets are placeholders until a Plan/Subscription/Invoice model + a payment
> provider (e.g. Stripe/Razorpay) are introduced. Flag this as a separate epic.

---

## 3. Solr schema & search architecture

### Current state
- `solr.service.js` indexes **jobs only** (`buildJobSolrDoc`, `indexJob`, `deleteJobFromSolr`, `searchJobsViaSolr`).
- Job search is consumed inside `GET /api/v1/jobs` (via `jobSearch.service.js`), **not** a dedicated `/api/search/*` namespace.
- **No candidates collection, no autocomplete/suggester, no fuzzy/facets exposed.**

### Target Solr collections

**`jobs`** (extend existing doc builder)
```
id (string, pk) · title (text_en) · company (text_general) · location (string, facet)
salary (int/range) · skills (strings, multi, facet) · experience (string, facet)
description (text_en) · status (string, facet) · createdAt (pdate)
```

**`candidates`** (new — `candidateSearch.service.js`)
```
id (string, pk) · name (text_general) · skills (strings, multi, facet)
experience (string, facet) · education (text_general) · location (string, facet)
profileScore (int) · updatedAt (pdate)
```
> ⚠️ Candidate data is sensitive. The candidate index must only be searchable by
> `requireRole('client','admin')` and must **exclude** PII (email/phone) from query
> results — return ids and surface contact only through an authorized application/chat.

### Solr features → implementation
- **Full-text**: `edismax` over title/skills/description (jobs), name/skills/education (candidates).
- **Faceted**: `facet=true&facet.field=skills,location,experience,status`.
- **Autocomplete/suggestions**: Solr Suggester component (`/suggest`) on `title`+`skills`.
- **Fuzzy**: `edismax` with `~` / phonetic field for typo tolerance.
- **Skill matching / ranking**: boost (`bq`) by skill overlap + `profileScore`.

### New API surface
```
GET /api/v1/search/jobs?q=&location=&skills=&experience=&page=&limit=    (public)
GET /api/v1/search/candidates?q=&skills=&experience=&location=&page=     (client/admin only)
GET /api/v1/search/suggestions?q=&type=jobs|candidates                   (autocomplete)
```

### Index lifecycle (event hooks)
- Job created/updated → `indexJob` (already exists) — ensure called from `job.controller`.
- Job archived/deleted → `deleteJobFromSolr`.
- Candidate profile updated → `indexCandidate` ➕.
- Candidate deleted/deactivated → `removeCandidate` ➕.
- All wrapped in try/catch so **Mongo stays source of truth** and Solr failures never block writes; add a `reindex` script (one exists for jobs: `backend/scripts/reindexSolr.js`).

---

## 4. API architecture

Conventions already in place: REST under `/api/v1`, `asyncHandler` wrapper, `ApiError` +
central `errorHandler`, `zod` validation via `validate(schema, 'query'|'body')`,
`requireAuth` + `requireRole(...)` guards, rate limiting in production.

| Domain | Base | Status |
|---|---|---|
| Auth | `/api/v1/auth` | ✅ |
| Users/Profiles | `/api/v1/users` | ✅ |
| Jobs + Applications | `/api/v1/jobs` | ✅ (apply, status, list mine/client) |
| Conversations/Messages | `/api/v1/conversations` | ✅ (list, thread, send, typing, read, interview) |
| Dashboards | `/api/v1/dashboards` | ✅ |
| Resumes | `/api/v1/resumes` | ✅ |
| Uploads | `/api/v1/uploads`, `/api/uploads` | ✅ (ImageKit) |
| **Search** | `/api/v1/search` | ➕ to build (§3) |
| **Admin** | `/api/v1/admin` | ➕ (users/jobs moderation, metrics, health) |
| **Notifications** | `/api/v1/notifications` | ➕ |

---

## 5. Socket.IO architecture

### Current (verified in `socket.js`)
- JWT handshake auth; each user joins room `user:<id>`.
- `online: Map<userId, Set<socketId>>` drives presence; `isUserOnline()`, `emitToUser()`.
- `publishLiveUpdate()` is a compat shim over `emitToUser` — controllers/services already emit:
  `message`, `message-read`, `typing`, `presence`, `conversation-created`, `application-updated`.
- Read receipts, delivery, typing, presence all working end-to-end.

### Planned additions
- `message-reaction` event (+ persistence on `Message.reactions`).
- `notification` event → feeds the notifications center.
- Optional **group conversations**: generalize `Conversation` from `{candidateId, clientId}`
  to a `participants[]` model (bigger change — its own epic; 1:1 covers current product).
- Calendar/interview push already covered via `application-updated`.

---

## 6. UI component hierarchy

```
DashboardLayout (sidebar + topbar + theme + ➕ command palette + ➕ notifications bell)
├── Candidate
│   ├── Overview            → StatCards (completion, applied, interviews, messages, resume score) + Recharts
│   ├── Find Jobs           → Search (Solr) + JobCard grid + ApplyDrawer
│   ├── My Chat             → <Messages embedded />  (flex-fills viewport ✅)
│   ├── Profile             → inline-editable profile
│   ├── My Card             → ➕ Resume Builder (templates, live preview, PDF, score)
│   └── ➕ Notifications / ➕ Analytics
├── Employer
│   ├── Overview            → active jobs / candidates / interviews / hires (revenue = epic)
│   ├── Job Management      → create/edit/clone/archive (clone+archive ➕)
│   ├── Pipeline            → ➕ Kanban (dnd-kit) over Application.status
│   ├── Candidate Database  → ➕ TanStack Table + Solr filters
│   ├── Chat                → <Messages embedded />
│   ├── Interviews          → schedule (✅ in chat) + ➕ calendar view + ➕ feedback forms
│   └── Analytics           → ➕ hiring funnel / time-to-hire / conversion (Recharts)
└── ➕ Admin (Super Admin)
    └── user/employer/candidate mgmt · job moderation · metrics · system health
```

Shared primitives to add: `kanban/`, `data-table/`, `resume-builder/`, `command-palette/`,
`notifications/`, `charts/`, plus consistent `EmptyState` and `Skeleton` patterns
(skeletons already used in MyApplications/Messages).

---

## 7. Dashboard layouts

The shared shell — [`DashboardLayout.tsx`](../src/components/DashboardLayout.tsx) — already
provides: collapsible desktop sidebar, mobile horizontal nav, sticky topbar with theme toggle,
brand-gradient active state, and an optional `showMessagesShortcut` flag.

- **Candidate** nav (current): Overview · Find Jobs · My Chat · Profile · My Card.
- **Employer** nav: Overview · Jobs · Pipeline · Candidates · Chat · Interviews · Analytics.
- **Admin** nav (new): Overview · Users · Employers · Candidates · Jobs · Revenue · Health.

Design language: Linear/Stripe-style — rounded-2xl cards, soft shadows, generous spacing,
`text-foreground/muted-foreground` tokens for dark-mode parity, focus rings for a11y.

---

## 8. Production deployment guide (AWS EC2 + Nginx + PM2)

1. **EC2** (Ubuntu): Node 20 LTS, install Solr 9 (or managed), MongoDB Atlas (managed, IP-allowlist the EC2).
2. **Env**: `backend/.env` (never commit — now gitignored), set `NODE_ENV=production`, `CORS_ORIGIN`, `FRONTEND_URL`, JWT secrets, ImageKit, SMTP (Brevo), `SOLR_*`.
3. **Build**: `npm run build` (Next standalone) for FE; backend runs from `src` via tsx/node.
4. **PM2**: `pm2 start backend/src/server.js --name recruitkr-api` and a process for `next start`; `pm2 save && pm2 startup`.
5. **Nginx**: reverse-proxy `/api` → :PORT (api), `/` → :3000 (next); proxy WebSocket upgrade headers for Socket.IO; TLS via Certbot.
6. **Solr**: run behind localhost only; never expose Solr port publicly.
7. **Observability**: PM2 logs + morgan; add uptime check on `/api/v1/health`.
8. There's a `backend/Dockerfile`, `docker-compose.solr.yml`, and `Caddyfile` already — Docker/Caddy is an alternative path to Nginx.

---

## 9. Security best practices

**Already strong** (verified): helmet, CORS allowlist, `express-mongo-sanitize`, `hpp`,
rate limiting (prod), JWT with password-change invalidation, role guards, **per-conversation
membership checks**, argon2/bcrypt hashing, ImageKit (no raw file hosting), `.env` untracked,
puppeteer profile now gitignored.

**Harden next:**
- Candidate search must never leak PII (§3) — enforce field projection + role gate.
- Add `helmet` CSP once asset origins are finalized.
- Rotate/short-lived access tokens + refresh-token rotation (currently access-token centric).
- Audit log for admin actions (moderation, deletions).
- File-upload: enforce MIME allowlist + size (size already capped at 5MB for messages).
- ⚠️ Fix the pre-existing build-breakers before any deploy: `Login.tsx:159` (`apiPost` undefined) and `CandidateDashboard.tsx:188` (`contactEmail` type).

---

## 10. Step-by-step implementation plan (phased)

Ordered by value ÷ risk. Each phase is independently shippable.

**Phase 0 — Stabilize (do first, ~0.5 day)**
- Fix the two build-breaking type errors (§9).
- Decide stack divergences (§0): Next 14 vs 15, JS vs TS backend, add framer-motion / tanstack-table.

**Phase 1 — Search foundation (Solr)**
- `/api/v1/search/jobs` + facets/suggestions over the existing jobs index.
- Candidate index + `/api/v1/search/candidates` (role-gated, PII-safe) + lifecycle hooks.

**Phase 2 — Employer pipeline & candidate DB**
- Kanban (dnd-kit) over `Application.status` with optimistic status PATCH (API exists).
- Candidate Database: TanStack Table + Solr filters + bulk actions.

**Phase 3 — Resume Builder ("My Card")**
- Multi-template + live preview + PDF (extend puppeteer `templates/`) + resume score.

**Phase 4 — Analytics**
- Candidate: success rate, profile views, skill match.
- Employer: hiring funnel, time-to-hire, conversion, source — `analytics.service.js` + Recharts.

**Phase 5 — Notifications & command palette**
- `Notification` model + `/notifications` + socket `notification` event + bell UI.
- Wire `cmdk` palette (jump to jobs/candidates/chats, quick actions).

**Phase 6 — Admin / Super Admin**
- Admin dashboard + moderation + metrics + `/api/v1/health` system view.

**Phase 7 — Chat extras**
- Message reactions (model + socket + UI). Group conversations = separate epic if needed.

**Phase 8 — Revenue/billing (separate epic)**
- Plan/Subscription/Invoice models + payment provider before any "revenue" widget is real.

**Phase 9 — Performance & polish**
- Code-split dashboards, lazy-load charts/tables, virtualize big tables, image optim,
  Lighthouse pass to 95+.

---

### How to use this doc
Pick a phase and I'll implement it end-to-end (schema → API → socket → UI) in this repo,
verifying types/build at each step. Phase 0 + Phase 1 are the highest-leverage start.
