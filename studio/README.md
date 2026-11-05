# RecruitKr Site Studio

A no-code editor for www.recruitkr.com. Admins change the site's text, theme, logo, team and media, see the change live on the real site, and publish when it looks right. In Business OS it opens from the Super Admin's **⚠ TOUCH IF WANT TO LAY OFF** menu item.

**The rule:** nothing an editor does can break the site.
- **Sign-in is a PIN**, checked by the API against `STUDIO_PIN` (set on the API only, never in this repo). A right PIN opens the Studio for 8 hours; changing `STUDIO_PIN` signs everyone out; 30 wrong PINs in 15 minutes lock PIN sign-in for the rest of that window. A website admin login also still works.
- The Studio never touches code. It saves data, and the API checks every value against `backend/src/shared/siteContentSchema.js` on save and again on publish.
- The site falls back to its built-in text and images for anything missing or invalid, and when the API is down or slow (2s timeout).
- Every publish is a revision, and **History → Restore** puts any older version back with one click.

## How it fits together

| Part | Where | What it does |
| --- | --- | --- |
| Content API | `backend/` → `/api/v1/site-content`, `/api/v1/studio` | Drafts, publish, revisions, rollback, media, team. Admin-only, except the public `GET /published`. |
| Website | `src/lib/siteContent*.ts`, `src/components/site/SiteContentProvider.tsx` | Lays published values over each component's defaults. Theme becomes CSS tokens; brand becomes logo and favicon. |
| Studio | `studio/` (this folder) | Vite + React SPA, deployed on Cloudflare Pages. |

**Live preview:** the Studio frames the real site as `https://www.recruitkr.com/<page>?studio=<signed token>`. In that mode the site:
- shows drafts instead of published values;
- applies unsaved edits as you type;
- tells the Studio which field you clicked (`postMessage`, origin-checked both ways).

The token is signed with `STUDIO_PREVIEW_SECRET` and lasts 2 hours.

**What is editable today:**
- the navigation bar (labels, links, show or hide);
- the home hero (all copy, the cycling roles, the photos);
- the home section order and visibility;
- the footer (copy, phones, emails, social links);
- the theme, the brand, and the team.

To make more of the site editable:
1. Add a key to the registry.
2. Read it in the component with `useSiteContent(key, DEFAULTS)`, where `DEFAULTS` is today's hardcoded copy.
3. Spread `editable("key.field")` on the element.

## Local development

```bash
# 1. API (backend/)
cd backend && npm run dev                      # needs backend/.env, see backend/.env.example

# 2. Website, framed by the local Studio
NEXT_PUBLIC_STUDIO_ORIGIN=http://localhost:5174 npm run dev

# 3. Studio
cd studio && npm install
VITE_API_BASE_URL=http://localhost:5000/api/v1 VITE_SITE_URL=http://localhost:3000 npm run dev   # http://localhost:5174
```

Add `http://localhost:5174` to the API's `CORS_ORIGIN`, and set `STUDIO_PREVIEW_SECRET` on the API, or the preview shows the published site only.

Checks: `npm run build` (typecheck + build) and `npm test` (helper tests).

## Environment

**Studio** (Cloudflare Pages → Settings → Variables, set for the build):

| Variable | Example | Needed |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `https://www.recruitkr.com/api/v1` (the site's proxy) | yes |
| `VITE_SITE_URL` | `https://www.recruitkr.com` | yes |
| `VITE_GOOGLE_CLIENT_ID` | OAuth client ID (Web) | for "From Google Drive" |
| `VITE_GOOGLE_API_KEY` | API key with the Picker API enabled | for "From Google Drive" |

**API** (`backend/.env`):
- `CORS_ORIGIN` must include the Studio origin, e.g. `https://recruitkr-site-studio.pages.dev`.
- `STUDIO_PIN`: the PIN that opens the Studio (6-12 digits).
- `STUDIO_PREVIEW_SECRET`: any random 32+ characters.
- `SITE_REVALIDATE_URL=https://www.recruitkr.com/api/revalidate`.
- `REVALIDATE_SECRET`: 16+ characters, the same value as on the website.

**Website** (Vercel):
- `REVALIDATE_SECRET`: the same value as on the API.
- `NEXT_PUBLIC_STUDIO_ORIGIN=https://recruitkr-site-studio.pages.dev,https://recruitkr-business-os.vercel.app`. These are the only origins allowed to frame the site: the Studio, and Business OS, which frames the Studio. Unset means nobody can frame the site, as before.

## Deploy on Cloudflare Pages

1. Pages → Create → Connect to Git → `anaagatHR/Recruitkr-Web`.
2. Root directory `studio`, build command `npm run build`, output directory `dist`, Node 20+.
3. Add the variables above and deploy. Pages gives a URL such as `https://recruitkr-site-studio.pages.dev`. If the project name differs, update `SITE_STUDIO_URL` in Business OS `frontend/app.js` and the origins above.
4. Optional: put **Cloudflare Access** in front of the Pages domain (Zero Trust → Access → Applications → Self-hosted, allow only the admins' emails). The Studio still requires the website admin login after that.

`public/_headers` lets only Business OS (and the Studio itself) frame the Studio, and keeps it out of search engines.

**Google Drive picker:**
1. In Google Cloud, enable the **Google Picker API** and the **Google Drive API**.
2. Create a Web OAuth client with the Studio's URL as an authorised JavaScript origin, and an API key restricted to the Picker API and that origin.
3. The Studio asks for `drive.readonly` only. The picked file is copied to the site's own storage (ImageKit `/recruitkr/site`); the site never links to Drive.

## Media rules (enforced by the API)

- Images: JPG, PNG, WEBP or SVG, 5MB max. SVGs containing scripts, event handlers, links or embedded content are refused.
- Video: MP4 or WEBM, 50MB max.
- The file type is checked from the file's bytes, not its name.

## Team

Team changes go live at once; there is no draft step.
- Every write sets both the CRM's and the website's field names (`fullName`/`name`, `role`/`position`, `profileVideo`/`videoUrl`/`introVideo`, …), so crm.recruitkr.com keeps working.
- Members are hidden (`active: false`), never deleted.
