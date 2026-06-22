# Deployment — Frontend on Vercel, Backend on AWS

This app is split:

- **Frontend** — Next.js 14 (repo root) → **Vercel**
- **Backend** — Express 5 + MongoDB + Socket.IO + Puppeteer (`backend/`) → **AWS** (long-running container/VM)

The browser calls **same-origin** `/<frontend>/api/v1/*`, and Vercel **rewrites** those to
the AWS backend (see `next.config.mjs`). So the whole system hinges on one env var being correct:
`NEXT_PUBLIC_API_URL`.

---

## ⚠️ The #1 cause of "everything 404s"

Symptom: `https://www.recruitkr.com/api/v1/...` returns 404 for login, jobs, uploads, etc.

Cause: `NEXT_PUBLIC_API_URL` on Vercel is unset or points back at the frontend domain.
The rewrite destination is computed from it:

```js
const backend = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
const root = backend.replace(/\/api\/v\d+\/?$/, "");
destination: `${root}/api/v1/:path*`
```

- Unset → proxies to `127.0.0.1:5000` (nonexistent on Vercel) → **404**
- Set to `https://www.recruitkr.com/api/v1` → proxies back to Vercel itself → **404 loop**

**Fix:** set it to the **AWS** host and **redeploy** (it's read at build time):

```
NEXT_PUBLIC_API_URL = https://api.recruitkr.com/api/v1
```

---

## Part 1 — Backend on AWS

Do **not** use Lambda — Socket.IO needs persistent connections and Puppeteer needs Chromium.
Use **App Runner** (simplest), ECS Fargate, Elastic Beanstalk (Docker), or EC2.

A `backend/Dockerfile` is provided (installs system Chromium and wires Puppeteer to it).

### 1. Database
Use **MongoDB Atlas**. Allow your AWS egress IP (or `0.0.0.0/0` while testing) and copy the
connection string into `MONGODB_URI`.

### 2. Set production env vars (App Runner config / Beanstalk env / EC2 `.env`)
Required, based on `backend/.env.example`:

```
NODE_ENV=production
PORT=5000
MONGODB_URI=<Atlas connection string>
CORS_ORIGIN=https://www.recruitkr.com,https://recruitkr.com,https://<your-app>.vercel.app
FRONTEND_URL=https://www.recruitkr.com
CLIENT_URL=https://www.recruitkr.com
BACKEND_PUBLIC_URL=https://api.recruitkr.com
JWT_ACCESS_SECRET=<32+ char secret>
JWT_REFRESH_SECRET=<32+ char secret>
JWT_SECRET=<32+ char secret>
BCRYPT_OR_ARGON2_PEPPER=<16+ char random>
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your_id>
```
Optional: `BREVO_EMAIL`, `BREVO_SMTP_KEY`, `OPENAI_API_KEY`, `GOOGLE_OAUTH_*`, `SOLR_URL`
(when `SOLR_URL` is unset, job search falls back to MongoDB and still works).

> `CORS_ORIGIN` must list the **exact** frontend origins (no trailing slash). It feeds both
> REST CORS (`app.js`) and Socket.IO CORS (`socket.js`).

### 3. Build & deploy the container (App Runner via ECR example)
```bash
# from repo root
docker build -t recruitkr-backend ./backend

# push to ECR (replace ACCOUNT/REGION)
aws ecr create-repository --repository-name recruitkr-backend
aws ecr get-login-password --region REGION | docker login --username AWS --password-stdin ACCOUNT.dkr.ecr.REGION.amazonaws.com
docker tag recruitkr-backend ACCOUNT.dkr.ecr.REGION.amazonaws.com/recruitkr-backend:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/recruitkr-backend:latest
```
Then create an App Runner service from that image:
- Port: **5000**
- Health check path: **`/api/v1/health`**
- Add all the env vars above

You'll get an HTTPS URL (e.g. `https://xxxx.region.awsapprunner.com`). Map a custom domain
(`api.recruitkr.com`) if you want clean URLs.

### 4. Verify the backend directly (before touching Vercel)
```bash
curl -i https://<aws-host>/api/v1/health      # expect 200 {"success":true,...}
curl -i "https://<aws-host>/api/v1/jobs?limit=1"
```
If these 404 → routes/env problem on AWS. If they hang/refuse → not publicly reachable
(security group / port / not running). Fix this **first**.

---

## Part 2 — Frontend on Vercel

1. Import the repo. **Root Directory = repository root** (where the Next.js `package.json` is —
   *not* `backend/`). Framework auto-detects as Next.js.
2. Environment Variables (Production), from root `.env.example`:
   ```
   NEXT_PUBLIC_API_URL=https://api.recruitkr.com/api/v1      ← AWS host, NOT the frontend domain
   NEXT_PUBLIC_SITE_URL=https://www.recruitkr.com
   NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=<your imagekit public key>
   NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true
   ```
3. **Deploy** (fresh build — env changes don't apply to old builds).
4. Add your custom domain `recruitkr.com` / `www.recruitkr.com` in Vercel domain settings.

`NEXT_PUBLIC_API_URL` drives two things:
- the **rewrite** in `next.config.mjs` (proxies REST `/api/v1/*` → AWS)
- the **Socket.IO** URL in `src/lib/socket.ts` (connects the browser **directly** to AWS, since
  WebSockets don't ride the rewrite). This is why the AWS `CORS_ORIGIN` must include the frontend.

---

## Part 3 — Verify end-to-end

```bash
# Goes through Vercel's rewrite → AWS. Expect 200, NOT 404.
curl -i "https://www.recruitkr.com/api/v1/health"
```
Then in the app: log in, load jobs, open a chat (confirms Socket.IO). Check the browser console —
no CORS errors and no 404s on `/api/v1/*`.

### Quick triage table
| Test | Result | Meaning / fix |
|------|--------|---------------|
| `https://<aws>/api/v1/health` | 404 | Backend routing/env wrong (check `app.js`, env) |
| `https://<aws>/api/v1/health` | refused/timeout | Backend not reachable (SG/port/not running) |
| `https://<aws>/api/v1/health` | 200, but Vercel domain 404s | `NEXT_PUBLIC_API_URL` wrong → fix value + **redeploy** |
| Socket fails / CORS error | — | Add frontend origin to backend `CORS_ORIGIN`, redeploy backend |
