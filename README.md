# Sara — AI job search agent

Sara is an invite-only job-search agent you **hire from a dashboard**: each invited person signs in and gets their own private Sara. You tell her about your experience, the jobs you want and when you want alerts; she checks job boards and company careers pages on that schedule and emails the best matches with apply links. She runs entirely on free tiers ($0/month).

Built by Anik Shovan (Bala) as a portfolio project: from PRD to architecture to a shipped, working agent.

## How Sara works

```
GitHub Actions (wakes hourly)
  → whose Sara is due? (each person's own days, hour and time zone; on duty; not run yet today)
  → fetch jobs ONCE for everyone: Remote OK, Remotive, Himalayas, Jobicy, We Work Remotely, Working Nomads,
    Real Work From Anywhere, Jobspresso + everyone's watchlists (Greenhouse, Ashby, Lever)
  → normalize into one schema
  then, for each person due, with their own settings:
  → dedupe against every job seen before (URL, source id, company + title)
  → filter in code: role keywords, seniority, years of experience asked, location, US-only, pay floor, age
  → score with AI (Gemini, Groq fallback): 0–100 fit + "why it fits" + red flags
  → pick lists: 5 Product (entry to mid level, asking 1-4 years) + 5 Technical Support (mid to senior, asking 3+ years),
    each job a 75%+ match; fewer picks rather than weak ones
  → save to Supabase, log the run, email the picks
```

**Key design decision:** cheap deterministic filtering runs first, so AI calls are spent only where judgment is needed. A typical run sends a few dozen jobs to the model, not hundreds, which keeps Sara inside free-tier limits.

**Guardrails:** apply links always come from the job source, never from the AI. Sara never applies or emails employers on my behalf. If every AI call fails, a keyword scorer takes over so the email still goes out, and the run log says so.

## Stack (all free tiers)

| Part | Tool |
| --- | --- |
| Scheduler | GitHub Actions |
| AI | Google Gemini API (Groq as fallback) |
| Database | Supabase (Postgres) |
| Email | Gmail SMTP with an app password |
| Dashboard | Next.js on Vercel (`dashboard/`) |

## Project layout

| Path | What it does |
| --- | --- |
| `src/due.js`, `src/schedule.js` | The hourly "is Sara due?" check against the dashboard schedule |
| `src/index.js` | A run, start to finish |
| `src/sources/boards.js` | Remote OK, Remotive, Himalayas, Jobicy, We Work Remotely, Working Nomads, Real Work From Anywhere, Jobspresso (BDJobs stub; Upwork has no public feed) |
| `src/sources/ats.js` | Watchlist companies on Greenhouse, Ashby, Lever, with auto-detection |
| `src/filter.js` | Code filters and pay parsing |
| `src/score.js` | AI scoring prompt, providers, validation, fallback |
| `src/rank.js` | Ranking and picking |
| `src/db.js` | Supabase storage (and an in-memory store for tests) |
| `src/email.js` | The morning email |
| `candidate-profile.md` | Fallback profile; the real one is set in the dashboard's About you |
| `supabase/schema.sql` | Database tables, search profile, watchlist, security rules |
| `supabase/002_hire_sara.sql` | Adds hiring, schedule, alert email and About you to the profile |
| `supabase/003_multi_user.sql` | One Sara per person: user_id on every table, per-user security, invite list (max 5), sign-up gate |
| `supabase/004_saved_jobs.sql` | Adds `saved_at` so picks can be saved for later |
| `supabase/006_experience_levels.sql` | Revised experience levels for Bala's pick lists (data only) |
| `supabase/005_pick_lists.sql` | Pick lists (e.g. 5 Product + 5 Technical Support) with experience rules, and a minimum match |
| `src/groups.js` | Pick lists and the minimum match |
| `fixtures/sample-jobs.json` | Fictional jobs that exercise every rule |

## Dashboard

`dashboard/` is a Next.js app where I hire Sara, configure her and track every application:

- **Hire Sara**: a four-step setup (About you, Jobs you want, Alerts, Hire) that switches her on

- **Today**: the morning's picks with fit score, why each fits, red flags, and one-click Save, Mark applied, Not interested and good/bad ratings
- **Saved**: jobs kept for later; saving a pick takes it off Today, so each morning's list shows only what's new
- **Pipeline**: every kept job on a route from New to Applied, Interview scheduled and Offer, with notes and a progress tracker per job
- **Add a job**: track roles found elsewhere, such as LinkedIn
- **Settings**: pause or resume Sara, and edit everything from setup (roles and their priority, levels, regions, pay floor, schedule, alert email) plus the company watchlist, without touching code
- **Activity**: each run's funnel, from jobs fetched to picks, plus any source errors

Signed out, visitors see a welcome page with sign-in and a **demo with fictional sample jobs**. Sign-in is an email magic link, and only emails on the owner's invite list (up to 5, managed in Settings) can create an account; a database trigger enforces it. Row Level Security gives each person access to their own rows only.

```bash
cd dashboard
npm install
npm run dev       # demo mode works with no keys; add .env.local (see .env.example) for real data
```

## Run it

```bash
npm install
npm test          # 43 checks on sample jobs and the schedule, no network or keys needed
npm run dry-run   # full run on sample jobs; writes out/email-preview.html
npm start         # real run (needs the environment variables in .env.example)
```

In production, GitHub Actions runs `npm start` daily. To run Sara on demand: **Actions → Sara daily run → Run workflow**.

## Setup

1. Run `supabase/schema.sql` and `002_hire_sara.sql` in the Supabase SQL Editor, sign in to the dashboard once as the owner, then run `003_multi_user.sql`, `004_saved_jobs.sql` and `005_pick_lists.sql`.
2. Add repository secrets (Settings → Secrets and variables → Actions): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and optionally `GROQ_API_KEY`.
3. Deploy `dashboard/` to Vercel, sign in and hire Sara. To run her right away, use **Actions → Sara daily run → Run workflow**.

## Free-tier notes

- **Supabase** pauses free projects after about a week of low activity; Sara's daily writes keep it active.
- **GitHub** disables scheduled workflows in public repos after 60 days without repository activity. GitHub emails a warning first; re-enable with one click in the Actions tab, or push any commit.
- **Gemini** free-tier limits can change. Switch models with `GEMINI_MODEL`, or add `GROQ_API_KEY` as a fallback.

## Roadmap

1. **Find (MVP)**: daily picks by email ✓
2. **Track**: dashboard to mark Applied, add jobs found elsewhere (e.g. LinkedIn), rate picks ✓
3. **Hire and configure**: set up and schedule Sara entirely from the dashboard ✓
4. **Multi-user**: invite-only, one private Sara per person ✓
5. **Interviews**: read-only Gmail scan for employer replies, interview reminders
6. **Portfolio**: public demo mode with sample data, walkthrough video, case study
