# Intern Portal — backend notes

A **candidate** applies for an internship from their own dashboard (no separate
account or password). In the "Intern" tab they choose a department, and the
request goes to that department's fixed head. Once the head approves it, the
candidate's tasks and 1:1 chat with the head unlock in the same tab.

All data lives in the SAME MongoDB the admin panel uses.

## Flow

```
Candidate logs in (normal email + password)
  → opens the "Intern" tab
  → picks a Department (each has a fixed head)
  → sends a request                → InternProfile.status = 'pending'
Department Head approves (admin panel) → status = 'active' (+ dates, stipend)
  → candidate sees tasks + chat; uploads work; chats with the head
```

## Models (backend/src/models)

- `Department` — `name`, `description`, `headId` + `headName` (fixed head),
  `isActive`. Candidates choose from the active ones.
- `InternProfile` — one per candidate `userId`. `status`
  (`pending|active|rejected|completed|paused|terminated`), `departmentId`,
  `department`, `departmentHeadId`/`departmentHeadName`, and head-managed
  `designation`, `startDate`, `endDate`, `stipend`.
- `InternTask` — a task assigned to an intern (`internId` = candidate userId);
  interns push files into `submissions[]`.
- `InternMessage` — messages in the intern↔head chat (keyed by `internId`).

No new `User` role is used — interns are just candidates.

## API (mounted at `/api/v1/interns`, guarded to the `candidate` role)

- `GET  /interns/me` — internship status + details (`status: 'none'` if none yet).
- `GET  /interns/departments` — active departments to choose from.
- `POST /interns/request` — `{ departmentId, note? }` → creates a `pending` request.
- `GET  /interns/tasks` — assigned tasks (active interns only; 403 otherwise).
- `POST /interns/tasks/:id/submit` — multipart `file` (+ optional `note`);
  uploads to ImageKit and marks the task `submitted`.
- `GET  /interns/messages` — the chat thread (active only).
- `POST /interns/messages` — send a message to the head (active only).

## What the Department Head does from the admin panel

The head works against this same DB:

1. **Approve a request** — set the candidate's `internprofiles` document
   `status: 'active'`, and fill `designation`, `startDate`, `endDate`, `stipend`,
   `decidedAt`. (To decline: `status: 'rejected'`.)
2. **Assign tasks** — insert `interntasks` with `internId` = the candidate's
   user `_id`, a `title`, optional `description`/`dueDate`/`priority`,
   `assignedById`/`assignedByName` = the head, `status: 'assigned'`.
3. **Review submissions / chat** — read `interntasks[].submissions`; reply by
   inserting `internmessages` with `senderRole: 'head'`.
4. **Manage** — pause (`status: 'paused'`), complete (`status: 'completed'`), etc.

## Departments must exist in the DB (else the chooser is empty)

The Intern tab shows departments from the `departments` collection. Add them via
the admin panel, or run the seed:

```
# local test DB
node scripts/seedDepartments.js

# live / Atlas DB (edit real head emails/names in the script FIRST)
node scripts/seedDepartments.js --force
```

Without `--force` the seed refuses to touch a non-local DB, so production is
never seeded by accident. If no departments exist, the tab shows a friendly
"no departments open" message rather than breaking.

## If the admin panel stores things under different names

Controllers read strictly through the model fields above. If the admin panel's
collection/field names differ, align them in ONE place — the `Department`,
`Intern*` model files (add a third `mongoose.model(name, schema, '<collection>')`
arg if the collection name differs). No controller/route changes needed.

## Running locally

```
cd backend && npm install && npm run dev   # http://localhost:5000
# repo root:
npm run dev                                # http://localhost:3000
node backend/scripts/seedDepartments.js    # seed departments
node backend/scripts/seedInternTest.js     # a candidate with an ACTIVE internship
```
