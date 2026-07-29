# prompts.md — HR AI Assistant (Sequential Build Prompts)

Run these prompts **in order, one at a time**, in the same session, with `CLAUDE.md` present in the project root. Wait for each prompt to finish before running the next one. Do not modify the prompts' intent — they are written to be pasted as-is into Claude Code (or a similar agentic coding tool).

---

## Prompt 1 — Project Scaffold & Theme Foundation

```
Read CLAUDE.md fully before doing anything else — it contains the full context for this project and you must follow it exactly.

Scaffold a new Next.js project (App Router, JavaScript only, no TypeScript) in the current directory called "hr-ai-assistant". Keep dependencies minimal per CLAUDE.md section 2.

Install and configure these dependencies only: @hello-pangea/dnd, pdf-parse, mammoth, bcryptjs, csv-parse, csv-stringify, jsonwebtoken.

Set up:
1. The folder structure: /data (empty, for profiles.csv and db.json, created at runtime), /app, /app/api, /lib (for helper functions).
2. A global dark navy "legendary" theme per CLAUDE.md section 9, as a single global CSS file imported in the root layout. Include CSS variables for the color palette so they can be reused (navy backgrounds, card backgrounds, borders, blue accent/glow, green/amber/red match-tier glow colors).
3. A basic root layout (app/layout.js) with the theme applied, a simple top nav bar showing the app name "HR AI Assistant" with a subtle glow effect, and a placeholder for a logout button (not functional yet).
4. A .env.local.example file listing OPENROUTER_API_KEY and AUTH_SECRET as required variables, with instructions in a comment.
5. A README.md explaining how to install dependencies, set up .env.local, and run the app locally with npm run dev.

Do not build any pages, auth, or data logic yet — this prompt is scaffold and theme only. Confirm the dev server starts with no errors before finishing.
```

---

## Prompt 2 — Local Data Layer (CSV + JSON helpers)

```
Read CLAUDE.md again if needed for the exact data shapes in section 3.

Build the local data access layer in /lib:

1. /lib/profiles.js — functions to read and write /data/profiles.csv:
   - getProfileByEmail(email)
   - createProfile(email, passwordHash) — appends a row, creates the CSV file with a header row if it doesn't exist yet
   Use csv-parse and csv-stringify for reading/writing. Handle the case where /data/profiles.csv doesn't exist yet (treat as no profiles).

2. /lib/db.js — functions to read and write /data/db.json, matching the exact structure in CLAUDE.md section 3:
   - readDb() — returns the parsed JSON, or an empty object {} if the file doesn't exist yet
   - writeDb(data) — writes the JSON back to disk, pretty-printed
   - getUserData(email) — returns db[email] or null
   - createUserData(email, name, dob) — initializes db[email] = { name, dob, jobs: {} }
   - createJob(email, title, description) — adds a new job with a generated id like "job_" + Date.now(), empty candidates object, and createdAt timestamp; returns the new job
   - getJob(email, jobId)
   - addCandidate(email, jobId, candidateData) — adds a candidate with a generated id like "cand_" + Date.now(), status "new", createdAt timestamp
   - updateCandidateStatus(email, jobId, candidateId, newStatus) — updates the status; if newStatus is "closed", automatically set every other candidate in that job (whose status is not already "closed" or "rejected") to "rejected", per CLAUDE.md section 4's auto-reject rule

3. /lib/auth.js — helper functions:
   - hashPassword(password) / verifyPassword(password, hash) using bcryptjs
   - createSessionToken(email) / verifySessionToken(token) using jsonwebtoken and AUTH_SECRET from process.env
   - getSessionEmailFromCookies(cookieHeaderOrCookiesObject) — extracts and verifies the session cookie

Make sure /data directory and files are created automatically on first write if they don't exist, so the app works on a completely fresh clone. Do not build any UI or API routes yet — this prompt is the data layer only. Write a short manual test script or note confirming the functions work (e.g. a temporary console.log test you then remove, or explain how you verified it).
```

---

## Prompt 3 — Auth Pages & API Routes (Signup / Login / Logout)

```
Using the data layer from /lib (profiles.js, db.js, auth.js) and the theme from Prompt 1, build:

1. API routes:
   - POST /app/api/auth/signup/route.js — accepts email, password, name, dob; validates the email isn't already taken; hashes the password; creates the profile in profiles.csv and the user entry in db.json; sets an httpOnly session cookie; returns success
   - POST /app/api/auth/login/route.js — accepts email, password; verifies against profiles.csv; sets an httpOnly session cookie on success; returns a clear error on failure (wrong email or password, same generic message for both to avoid leaking which one is wrong)
   - POST /app/api/auth/logout/route.js — clears the session cookie

2. Pages, styled with the dark navy legendary theme, forms with clear validation error messages:
   - /app/login/page.js — email + password fields, link to /signup, on success redirect to /
   - /app/signup/page.js — email, password, name, date of birth fields, link to /login, on success redirect to /

3. A simple server-side auth check helper (e.g. in /lib/auth.js or a new /lib/requireAuth.js) that protected pages and API routes can use to get the current logged-in email from cookies, redirecting to /login if not authenticated.

4. Wire up the logout button placeholder in the nav bar from Prompt 1 to actually call the logout API and redirect to /login.

Test the full signup -> logout -> login flow works end to end with no bugs before finishing. Confirm data actually persists correctly in /data/profiles.csv and /data/db.json after signup.
```


---

## Prompt 4 — Dashboard & Job Posting Pages

```
Build the protected dashboard and job creation flow, using the auth helper from Prompt 3 to protect these routes (redirect to /login if not authenticated).

1. /app/page.js (dashboard) — protected. Fetches the logged-in user's jobs from db.json (server component or an API call to a new GET /app/api/jobs/route.js). Displays each job as a card (title, short excerpt of description, candidate count, created date) styled with the dark navy legendary theme, each card links to /jobs/[jobId]. Include a prominent "+ New Job" button linking to /jobs/new. If there are no jobs yet, show a friendly empty state.

2. POST /app/api/jobs/route.js — creates a new job for the logged-in user using createJob() from /lib/db.js.

3. /app/jobs/new/page.js — protected. A form with "Job Title" and "Job Description" (textarea, reasonably large) fields. On submit, calls the POST /api/jobs route, then redirects to the new job's board page /jobs/[jobId].

4. /app/jobs/[jobId]/page.js — protected, for now just render the job title and description at the top (the full Kanban board comes in the next prompt) plus a "Back to dashboard" link, to confirm routing and data fetching work correctly. Include a GET /app/api/jobs/[jobId]/route.js API route if needed to fetch a single job's data.

Verify: creating a job from the dashboard correctly saves it and redirects to a working job detail page showing the right title and description, with no console errors.
```

---

## Prompt 5 — CV Upload & AI Matching Integration

```
Read CLAUDE.md section 8 carefully for the exact AI integration requirements before starting.

1. POST /app/api/jobs/[jobId]/candidates/route.js — an API route that:
   - Accepts one or more uploaded files (multipart form data, .pdf and .docx only)
   - For each file: extract raw text using pdf-parse (for .pdf) or mammoth (for .docx)
   - Truncate extracted text to ~6000 characters if longer
   - Call the OpenRouter API (model google/gemma-4-26b-a4b-it:free) per CLAUDE.md section 8, sending the job description + extracted CV text, instructing the model to return ONLY strict JSON matching the shape: { matchPercent, pros, cons, suggestedQuestions }
   - Defensively parse the AI's response: strip markdown code fences if present, JSON.parse, and if parsing fails, retry once with a stricter follow-up instruction; if it still fails, return a clear error for that specific candidate without crashing the whole upload
   - On success, save the candidate via addCandidate() from /lib/db.js, using the original filename as a fallback for "name" (also try to extract a likely candidate name from the CV text if reasonably easy, otherwise just use the filename without extension)
   - Return the created candidate(s) as JSON

2. On the /app/jobs/[jobId]/page.js page, add an "Upload CV" button that opens a file picker (accept .pdf,.docx, allow multiple file selection), shows a loading state while processing (uploading + AI analysis can take a few seconds per file), calls the new API route, and refreshes the candidate list on success. Show a clear error message (toast or inline) if a file fails to process, without blocking the others.

Test uploading a real sample PDF and DOCX CV against a sample job description end to end, and confirm matchPercent, pros, cons, and suggestedQuestions are correctly saved in db.json with sensible values and no crashes, including a graceful test of what happens if the AI returns malformed output.
```

---

## Prompt 6 — Kanban Board with Drag-and-Drop

```
Now build the full Kanban board on /app/jobs/[jobId]/page.js using @hello-pangea/dnd, replacing the placeholder from Prompt 4.

1. Render 5 fixed columns per CLAUDE.md section 4, in order: New, Screening, Interview, Offer, Closed. Each column header styled per the theme (uppercase, letter-spaced, glowing underline).

2. Render each candidate as a draggable card in its column, per CLAUDE.md section 5:
   - Name
   - Large, prominent Match % number
   - Color-coded glow/border based on match tier (green 75-100, amber 50-74, red 0-49) per CLAUDE.md section 9
   - An expand/collapse toggle revealing Pros, Cons, and Suggested Interview Questions as bullet lists
   - A "Mark as Hired" button on any card not already in Closed or Rejected

3. Drag-and-drop between columns must call a new PATCH /app/api/jobs/[jobId]/candidates/[candidateId]/route.js API route that updates the candidate's status using updateCandidateStatus() from /lib/db.js, and update the UI optimistically with rollback on failure.

4. The "Mark as Hired" button calls the same PATCH route with status "closed", which per the auto-reject rule automatically rejects all other active candidates for that job. Reflect this immediately in the UI (the hired candidate moves to Closed, all other active candidates disappear from their columns since they become "rejected").

5. Add a "Show rejected" toggle below the board that, when enabled, displays rejected candidates in a distinct greyed-out list/row, separate from the 5 main columns, per CLAUDE.md section 4.

6. Add the "Upload CV" button from Prompt 5 to this same board view if not already present, positioned clearly (e.g. top right of the board).

Verify the entire flow end to end: log in, create a job, upload multiple CVs, see them appear with correct match scores and colors in the New column, drag candidates across columns, mark one as hired and confirm the others are auto-rejected and hidden from the board, then toggle "Show rejected" and confirm they appear correctly. Fix any bugs found before finishing. Confirm npm run dev runs the entire app with zero console errors and zero broken flows.
```

---

## Prompt 7 — Final Polish Pass

```
Do a final review and polish pass across the whole app:

1. Visual consistency: confirm every page (login, signup, dashboard, new job, job board) fully follows the dark navy "legendary" theme from CLAUDE.md section 9 — consistent spacing, consistent button styles, consistent glow effects, smooth transitions on drag, hover states on all interactive elements.

2. Error handling review: confirm every API route returns clear, user-facing error messages on failure (invalid login, duplicate signup email, AI call failure, file parsing failure, network errors) and that the frontend displays these gracefully instead of blank screens or unhandled console errors.

3. Loading states: confirm every async action (login, signup, job creation, CV upload/analysis, drag-and-drop status update) shows a clear loading indicator styled to match the theme.

4. Empty states: confirm the dashboard (no jobs yet) and each board (no candidates yet in a column) show a friendly, on-theme empty state instead of looking broken or blank.

5. Re-verify the complete end-to-end flow one final time: signup -> login -> create job -> upload CVs -> view AI-generated match data -> drag candidates -> mark one as hired -> confirm auto-reject -> logout -> log back in and confirm all data persisted correctly in /data/profiles.csv and /data/db.json.

6. Update README.md with a final, accurate list of setup steps (npm install, .env.local setup with OPENROUTER_API_KEY, npm run dev) and a short description of the app and its features, matching what was actually built.

Report back a summary of what was fixed in this pass, and confirm the app runs locally with npm run dev with zero known bugs.
```
