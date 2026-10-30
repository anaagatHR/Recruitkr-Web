# Candidate apply gate — deploy, test & rollout checklist

Covers the fixes for [RECRUITKR_CANDIDATE_AUDIT.md](RECRUITKR_CANDIDATE_AUDIT.md) (Phases 1–8).
Nothing below has been run against a real database or browser yet — this is the test plan.

## 1. Before deploying

- [ ] **Snapshot** the `candidateprofiles`, `users` and `applications` collections. Mongo writes in steps 3–4 can't be rolled back.
- [ ] **Delete the audit's test application** for "Sales/Peon (Fresher)" on candidate `RKR-2026-Q6FG`, and its conversation.
- [ ] Backend env (see `backend/.env.example`):
  - `FEATURE_APPLY_GATE=false` (leave off for the first deploy)
  - optional: `APPLY_RATE_LIMIT_MAX` (default 20 per hour), `PROFILE_WRITE_RATE_LIMIT_MAX` (default 60 per 15 min)
- [ ] Keep `backend/` in the Vercel upload (no `.vercelignore` excluding it): the frontend imports `backend/src/shared/profileCompletion.js`.

## 2. Deploy

Deploy backend first, then frontend. On boot, `Application.syncIndexes()` creates the new `{candidateId, idempotencyKey}` index automatically.

## 3. Migrate existing profiles (staging first, then production)

```bash
cd backend
npm run candidates:migrate          # dry run: read the change list and the conflicts table
npm run candidates:migrate:apply    # writes
npm run solr:reindex:candidates     # if Solr is configured
```

It never clears `city`. Older code copied the preferred location into it, so some profiles show their preferred location as their city until the candidate edits it.

## 4. Test on staging (gate still off)

| # | Check | Expected |
|---|---|---|
| 1 | Editor: fill name, mobile (`+91 98765 43210`), city, college; save | `GET /users/candidate/me` returns them; `phone: "9876543210"`; no `name`/`about`/`mobile`/`currentCity` keys |
| 2 | Experienced + two jobs; download PDF as candidate and as employer | Both PDFs identical, both jobs with dates |
| 3 | `GET /users/candidate/profile-completion` for an empty profile | `score: 3`, 10 `missingRequired` |
| 4 | Required fields + uploaded PDF | 63%; add a 240-char summary → 71%, `canApply: true` |
| 5 | Network panel: cold load of the dashboard | ~5 API calls; switching tabs → 0; idle → 0 while "Live" |
| 6 | Open `?tab=jobs`, reload, press Back | Stays on Find jobs; Back leaves the dashboard |
| 7 | Overview checklist item "Add mobile number" | Opens the Profile tab with the mobile field focused |
| 8 | Keyboard only: Apply now → submit without consent → tick → submit | Error announced + focus on checkbox; then 201 and chat opens |
| 9 | Concurrency: `APPLY_TOKEN=… node backend/scripts/verifyApplyConcurrency.js --api=<staging>/api/v1 --job=<id> --n=10` | `PASS`: one 201, nine 409, no 5xx. Delete the created application afterwards |
| 10 | Two tabs: save the profile in tab A, then save in tab B | Tab B: "changed in another tab" + **Reload latest profile** |
| 11 | 21 applies in an hour (or lower the env limit) | 429 with a friendly message |
| 12 | From another origin, `curl -X POST <staging>/api/v1/users/candidate/certificates -H "Origin: https://evil.example" -H "Cookie: accessToken=<token>"` | 403 `CSRF_ORIGIN_REJECTED` |
| 13 | Normal dashboard writes (save, photo, certificate, apply) | All still work (they send a Bearer token, so the origin guard doesn't apply) |
| 14 | `localStorage["recruitkr.auth.session"]` after login | No `refreshToken`; refreshing after 15+ min still keeps you signed in (cookie refresh) |
| 15 | Run axe on `/dashboard/candidate` (each tab) | 0 critical issues |

## 5. Turn the gate on

1. Staging: `FEATURE_APPLY_GATE=true`. Re-test: incomplete profile → job cards show "Complete profile to apply · N left"; `curl -X POST …/jobs/apply` with an incomplete profile → **422 `PROFILE_INCOMPLETE`**; the one-time explainer banner appears and stays dismissed.
2. Production: enable, then watch for a week:
   - application volume per day (expect a dip, then recovery as profiles complete)
   - 422 count on `/jobs/apply` and how many of those candidates later succeed
   - 412 (`PROFILE_VERSION_CONFLICT`) and 429 rates — both should be rare
   - logs: `[profile] mobile number already used by another account` (shared numbers, review only)

The gate is a single env flag: set `FEATURE_APPLY_GATE=false` and restart to switch it off.

## Known limits

- **The 15-minute access token still sits in `localStorage`.** The socket.io handshake goes straight to the backend origin, where the frontend's cookie isn't sent. The 30-day refresh token is now cookie-only.
- **The Android app is unaffected by the cookie changes** (it uses Bearer tokens). It should send `Idempotency-Key: apply:<jobId>` on apply and `If-Match` on profile saves to get the same protections.
- **The My Chat tab and the video section still fetch whenever they're opened.**
- **The public job page applies in one click, without the review sheet.** The server gate still applies.
