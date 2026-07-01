# Intern Portal — backend notes

The intern portal lets an intern (onboarded from the admin panel / business-os by
a Department Head) log in on the public website, see their assigned tasks, upload
their completed work, and chat 1:1 with their Department Head.

All data lives in the SAME MongoDB the admin panel uses.

## What was added

- `User.role` enum now includes `'intern'` (models/User.js). Login already works
  for any role, so no auth-controller change was needed beyond the role label.
- **Models** (backend/src/models):
  - `InternProfile` — one per intern user; basic details + Department Head link.
  - `InternTask` — a task assigned to an intern; interns push files into
    `submissions[]`.
  - `InternMessage` — messages in the intern↔head chat (keyed by `internId`).
- **API** (mounted at `/api/v1/interns`, role-guarded to `intern`):
  - `GET  /interns/me` — the intern's card / basic details.
  - `GET  /interns/tasks` — tasks assigned to the intern.
  - `POST /interns/tasks/:id/submit` — multipart `file` (+ optional `note`);
    uploads to ImageKit and marks the task `submitted`.
  - `GET  /interns/messages` — the chat thread with the head.
  - `POST /interns/messages` — send a message to the head.
- Frontend: `/dashboard/intern` page, `/login?role=intern` mode, and a
  **"Intern Login"** link in the footer (Explore section).

## How the admin panel connects (IMPORTANT)

The Department Head, from the admin panel, must write to this same DB:

1. **Create the intern login** — a `users` document:
   ```js
   { role: 'intern', email, passwordHash /* argon2/bcrypt, same util as backend */,
     passwordChangedAt: new Date() }
   ```
   Give the intern that email + password. They sign in at `/login?role=intern`.

2. **Create the intern profile** — an `internprofiles` document with
   `userId` = the new user's `_id`, plus `fullName`, `department`, `college`,
   `startDate`, `endDate`, and the head's `departmentHeadId` + `departmentHeadName`.
   (If missing, the portal lazily creates a stub so login still works.)

3. **Assign tasks** — insert `interntasks` documents with `internId` = the intern
   user's `_id`, a `title`, optional `description`/`dueDate`/`priority`, and
   `assignedById` / `assignedByName` = the head. Set `status: 'assigned'`.

4. **Read submissions / chat** — the head reviews `interntasks[].submissions`
   and can reply by inserting `internmessages` documents with
   `senderRole: 'head'`.

### If the admin panel already stores interns/tasks under different names

The controllers read strictly through the fields defined in the model files above.
If the admin panel's existing collection or field names differ, align them in ONE
place — the three `Intern*` model files (and, if the collection name differs, add
an explicit `mongoose.model('InternTask', schema, '<actualCollectionName>')`
third argument). No controller/route changes needed.

## Running locally

The backend needs a reachable MongoDB. Set `MONGODB_URI` in `backend/.env` to the
DB the admin panel uses, then:

```
cd backend && npm install && npm run dev   # http://localhost:5000
```

Frontend (repo root):
```
npm run dev   # http://localhost:3000  (proxies /api/v1 -> backend)
```
