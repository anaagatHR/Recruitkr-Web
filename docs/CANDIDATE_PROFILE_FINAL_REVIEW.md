# Candidate Profile & Job Apply: Final Review

**Date:** 30 Oct 2026

**In short:** candidates could apply to jobs with a completely empty profile, and employers received applications with no name and no phone number. That gap is now closed. The dashboard is also faster, clearer and safer. Everything has been **built and tested on a separate test copy of the site**, and it is **not live yet** (see "Test results" and "Still pending").

---

## Before: what was going wrong

- **Employers got blank applications.** The profile had no box for name or phone number, so employers couldn't even call the candidate back.
- **The profile score was fake.** A completely empty profile showed "72% complete".
- **Anyone could apply with nothing filled in.** One click, with no check and no review screen.
- **One click could send the application 3 times.** On a slow connection, the app quietly re-sent it. The candidate then saw an error even though the application had gone through.
- **Scary, wrong error message.** Candidates saw *"Backend is unavailable. Check the backend server and MongoDB."* The technical words were meant for developers, and the message was usually not even true.
- **The same details were saved twice.** Phone, city, summary and other details were stored in two places, so different screens showed different answers.
- **The dashboard was slow and wasteful.** It made about 224 data requests in under 5 minutes from just 12 clicks. This burned mobile data, and filters reset every time you switched tabs.
- **Confusing tab names.** "Profile" was view-only, while the real editing screen was called "My Card".
- **The job count was wrong.** The page said "20 jobs per page" but showed 19.
- **Job cards were full of filler text**, such as "0–0 LPA", "Company not shared" and "Department pending".
- **Hard to use for people with disabilities.** Form boxes had no proper labels, so screen readers couldn't read them and browser autofill didn't work.
- **Two open tabs could overwrite each other.** Saving in one tab could silently erase changes made in another.
- **Login was less safe than it should be.** The long-lasting login key was kept where a harmful script could read it.

---

## After: what's fixed

| Before | Now |
|---|---|
| No boxes for name or phone | Added **name, mobile, city, college, LinkedIn, portfolio and work history** (company, role, dates) |
| Empty profile showed 72% | **Honest score out of 100.** An empty profile now shows 3% (only the email counts). Each missing item shows how many points it adds. |
| Could apply with an empty profile | Candidates need **70% plus all must-have items**. The check runs on our side, so it can't be skipped. The button stays clickable and tells the candidate exactly what's missing. |
| No review before applying | A **review screen** shows what the employer will see. It also offers an optional short note (up to 300 characters) and a consent checkbox. |
| One click could apply 3 times | An application is **saved only once**, even with a double-tap or a bad network. A repeat gets "You've already applied". |
| Scary technical error | **Friendly messages** next to whatever failed, with a Retry button. No technical words. |
| Same details stored twice | **One main place for each detail.** The resume an employer downloads now matches what the candidate sees. |
| Slow dashboard | **Data is reused.** Switching tabs no longer reloads everything, and updates arrive live. |
| Confusing tab names | **"Profile" = edit, "Preview" = how employers see you.** Each tab has its own link, and the Back button works. |
| Wrong job count | **Numbers now match** what's on screen. |
| Filler text on job cards | **Filler is hidden.** A new **"Best match"** sort uses the candidate's role, location and skills. |
| Hard to use with a keyboard or screen reader | **Every field is labelled.** Apply works with the keyboard alone, and errors are read out. |
| Two tabs overwrote each other | The second tab now says **"Your profile was changed in another tab"** and shows a reload button. |
| Login less safe | The long-lasting login key is now in a **protected cookie**, and requests from other websites are blocked. There's also a **limit of 20 applications per hour** to stop spam. |

---

## How the 70% rule works

- **Must-have items add up to 63%:** name, phone, email, qualification, fresher or experienced, work history (if experienced), at least 3 skills, preferred role, preferred location, work mode and resume.
- **To reach 70%, a candidate must add at least one extra item:** photo, a proper summary, preferred industry, a certificate, a project or an intro video.
- **The idea:** filling the basic form means "registered"; showing something more about yourself means "serious candidate".

## Safe rollout

- The new rule sits behind an **on/off switch**. It is currently **OFF** and can be turned off again instantly.
- Existing candidates will see a **one-time message** explaining the new rule. Past applications are not touched.

---

## Test results (30 Oct 2026, separate test database, real data untouched)

Every check passed. We tested as a candidate in a real browser and also checked the system directly.

- **The 70% rule holds.** An empty profile was blocked at 3%. At 63% (all must-haves, nothing extra) it was still blocked. After adding a summary the profile reached 71% and the candidate could apply.
- **The employer sees real details.** The application and the downloaded resume both show the candidate's name, phone, work history and summary.
- **No double applications.** Ten applications sent at the same moment saved exactly one. A double click is answered with "already applied", and one click sends exactly one request.
- **Two open tabs are handled.** The second tab showed "changed in another tab" with a reload button, and nothing was lost.
- **The dashboard is lighter.** It now makes 5 requests on opening, down from about 15, and none when switching between tabs.
- **Keyboard and screen reader.** A candidate can apply using only the keyboard. An automatic accessibility scan found no serious problems on any tab.
- **Safety limits work.** Spam applying is stopped after 20 an hour, and requests from other websites are blocked.

**Problems found during testing, all now fixed:**
- **The one-time clean-up would have erased some candidates' city.** It erased the city whenever it matched their preferred location, so it now keeps the city as it is.
- **New candidates were marked "Fresher" without choosing.** This gave free points, so they now have to pick one.
- **A screen reader always said "unsaved changes"** on the score, even after saving.
- **Some labels on the Preview tab were too faint to read easily.**

## Still pending

- **The 70% rule is still switched off on the live site**, and the one-time clean-up of existing profiles hasn't been run there yet. On the test copy it found nothing to change.
- **Not tested:** photo and certificate uploads, because they would have stored files in the live file storage.
- **Some things were not changed:**
  - The same job can still appear twice when it was posted from different places.
  - The Chat tab and the video section still reload each time they're opened.
- **Some parts are only partly done:**
  - **Email isn't verified yet.** Any email counts for now, because there's no verification step yet.
  - **The public job page skips the review screen.** Applying from there still takes one click, though the 70% check still applies.
  - **A short-lived login key is still kept in the browser.** Live chat needs it. The long-lasting key has moved to the cookie.
  - **The Android app doesn't have the new protections yet.** It needs a small update to stop double applications and two-tab overwrites.

## To-do for the team

1. **Change the ImageKit secret key.** It was shared in a chat.
2. **Lock down the live database.** It currently accepts connections from anywhere.
3. **Delete the audit's test application** ("Sales/Peon (Fresher)") and its chat.
4. **Roll out after testing passes:** clean up existing profiles, turn the rule on in testing, then on the live site. Watch daily application numbers for a week.
