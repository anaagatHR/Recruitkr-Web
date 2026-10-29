# Claude Code — RecruitKr candidate apply-gate fix

Paste everything below into Claude Code with `docs/audits/candidate-flow-2026-10-30.md`
(= `RECRUITKR_CANDIDATE_AUDIT.md`) committed in the repo.

---

You are working on RecruitKr — a Next.js (App Router) + MongoDB job platform.
Read docs/audits/candidate-flow-2026-10-30.md in full before writing any code. It is a live
black-box audit of the candidate dashboard with reproduced evidence, API contracts, sequence
diagrams, a completion-scoring spec and a phased plan. Treat it as the requirements document.

GOAL
Candidates can currently apply to any job with a completely empty profile, in one unguarded
click. Close that hole and fix the defects that make it unfixable today.

POLICY DECISION (already made — implement exactly this)
A candidate may apply only when BOTH hold:
  (a) every field marked required:true in computeProfileCompletion is satisfied, and
  (b) the weighted completion score is >= 70.
Enforce this on the SERVER first. The client gate is UX only and must never be the sole check.

NON-NEGOTIABLE ORDER OF WORK
Phase 1 before Phase 3 before Phase 4. The profile editor currently has NO input for full name
or phone number, so gating on them before adding them would lock every candidate out.

1. ORIENT
   - Map the repo: locate the candidate dashboard page, the api client with the retry wrapper
     (it logs "[api] request failed after retries"), the /api/v1/jobs/apply route, the
     /api/v1/users/candidate/me PATCH route, the dashboards/candidate route, and the Mongoose
     schemas for the candidate profile and applications.
   - Report what you found and where it differs from the audit's inferences BEFORE changing code.
     The audit marks each finding [VERIFIED] or [INFERRED]; verify the inferred ones in source.

2. PHASE 1 — add the missing profile fields (audit §7 Phase 1, finding P0-1)
   Full name, phone, city, college, LinkedIn, portfolio, and a repeatable work-experience block.
   Wrap the editor in a real <form>; every control gets id + <label for> + required + aria-*.
   Extend the Zod and Mongoose schemas. Do not touch the apply route yet.

3. PHASE 2 — collapse duplicated model fields (audit §7 Phase 2, findings P1-3, P1-5)
   phone/mobile, city/currentCity, summary/about, workModes/preferences.workModes,
   skills/resumeData.skills are each stored twice. Pick the canonical one, write a migration
   that coalesces and logs conflicts, make resumeData a derived projection, and standardise on
   userId as the only candidate join key.

4. PHASE 3 — rewrite the completion engine (audit §4.1, finding P0-2)
   Today GET /api/v1/dashboards/candidate returns profileCompletion: 72 for a profile where every
   field is an empty string or empty array. Implement computeProfileCompletion exactly as
   specified in §4.1 — weights summing to 100, required fields summing to 63, graded sub-scores
   for skills and summary, and every anti-gaming rule. Put it in ONE shared module imported by
   both the API and the UI. Persist score/version/canApply on every write path. Add
   GET /api/v1/users/candidate/profile-completion.
   Unit tests first: empty -> 0, required-only -> 63, boundary at 69/70/71.

5. PHASE 4 — server gate (audit §4.3, finding P0-3)
   POST /api/v1/jobs/apply re-derives completion from the DB and returns 422 PROFILE_INCOMPLETE
   with { score, threshold, missingRequired[] } when it fails. Never trust a client-sent score.
   GET /api/v1/jobs returns canApply + blockReason per row, moves the already-applied exclusion
   into the query, and fixes meta.pagination.total (today it returns 20 rows and total 68 while
   the client renders 19 cards and the footer contradicts itself).

6. PHASE 5 — concurrency (audit §4.4, findings P0-4, P0-5)
   Reproduced live: two concurrent applies to the same jobId return 201 and 500; sequential
   returns a correct 409. Replace check-then-insert with findOneAndUpdate upsert + $setOnInsert,
   add the named unique index uniq_candidate_job, map E11000 to 409, and support an
   Idempotency-Key header with a 24h TTL.
   On the client: the api client blind-retries non-idempotent writes 3x at 1.5s (one click on
   Apply produced three POSTs; one click on Save produced three PATCHes). Restrict retries to
   GET/HEAD/OPTIONS, add AbortController, and disable the apply button per in-flight jobId.

7. PHASE 6 — fetch layer (finding P2-5)
   224 API calls in 279 seconds from ~12 clicks; every tab switch refetches everything 3x and
   discards the job filters. Move to TanStack Query with per-resource keys, staleTime, and
   targeted invalidation. Target: <=5 calls cold, 0 on tab switch.

8. PHASE 7 — UX (audit §6)
   Swap the inverted tab names (today "Profile" is read-only and "My Card" is the editor), add
   ?tab= URL state, build the segmented completion ring with the point-valued checklist, the
   gated button states, and the apply review sheet that shows the candidate exactly what is being
   sent and collects declarationAccepted. Replace the global banner reading
   "Backend is unavailable. Check the backend server and MongoDB." with contextual errors.

CONSTRAINTS
- The server gate is authoritative. I will test it with curl, bypassing the UI entirely.
- No Mongo error text, collection name or infrastructure detail may ever reach a response body
  or the UI.
- Never retry a non-idempotent HTTP method.
- Never gate behind a plain disabled attribute — the gated button must be clickable and explain
  what is missing.
- Feature-flag the gate (FEATURE_APPLY_GATE) and ship a one-time explanatory banner for existing
  candidates rather than silently locking them out.

DELIVERABLES PER PHASE
A summary of what changed, the files touched, the tests added, and how to verify by hand.
Stop after each phase and wait for my review before starting the next.

START WITH STEP 1 ONLY. Do not write feature code until you have reported the repo map and
confirmed or corrected the audit's [INFERRED] items.
