# HR AI Assistant

A local-only HR assistant for screening candidates. An HR user signs up, creates job postings, and uploads candidate CVs (PDF/DOCX). Each CV is compared against the job description by an AI model, which returns a match percentage, pros, cons, and 3–5 suggested interview questions. Candidates are managed per job on a drag-and-drop Kanban board (New → Screening → Interview → Offer → Closed), with a "Mark as Hired" action that automatically rejects the job's other active candidates.

Runs entirely on your machine — no database, no cloud services. Data is stored in local files (`/data/profiles.csv` for login credentials and `/data/db.json` for jobs/candidates).

## Features

- Email/password signup and login (bcrypt-hashed passwords, JWT session cookie)
- Dashboard listing your job postings, with an empty state when there are none
- Job posting creation (title + description)
- CV upload (multiple files at once, `.pdf` / `.docx`), with text extraction and AI-generated match analysis
- Kanban board per job with drag-and-drop status changes, color-coded match tiers (green/amber/red), expandable pros/cons/suggested questions per candidate
- "Mark as Hired" auto-rejects the job's other active candidates; rejected candidates are hidden by default behind a "Show rejected" toggle
- Graceful error handling throughout: invalid login, duplicate signup email, AI/network failures, and per-file upload errors never crash the app

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your local environment file:

   ```bash
   cp .env.local.example .env.local
   ```

   Then edit `.env.local` and set:
   - `OPENROUTER_API_KEY` — an API key from [OpenRouter](https://openrouter.ai/keys), used to call the AI model for CV matching. Without a valid key, CV uploads will still extract text but the AI analysis step will fail gracefully with an error message per file.
   - `AUTH_SECRET` — any random local string, used to sign session tokens (e.g. generate one with `openssl rand -hex 32`).

3. Run the app locally:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` — use the "Sign up" link to create an account.

On first run, the `/data` directory and its `profiles.csv` / `db.json` files are created automatically as you sign up and add jobs/candidates.

## Tech stack

Next.js (App Router, JavaScript only), plain CSS Modules with a shared dark navy theme, `@hello-pangea/dnd` for drag-and-drop, `pdf-parse` / `mammoth` for CV text extraction, `bcryptjs` + `jsonwebtoken` for auth, `csv-parse` / `csv-stringify` for the profiles file, and the OpenRouter API (`google/gemma-4-26b-a4b-it:free`) for AI matching.
