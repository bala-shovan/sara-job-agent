# Sara — AI job search agent

Sara finds the **5 best-matching new jobs every morning at 9:00 AM Dhaka time** and emails them to me with apply links. She runs entirely on free tiers ($0/month).

Built by Anik Shovan (Bala) as a portfolio project: from PRD to architecture to a shipped, working agent.

## How Sara works

```
GitHub Actions (cron, 9:00 AM Dhaka)
  → fetch jobs: Remote OK, Remotive, Himalayas + 30-company watchlist (Greenhouse, Ashby, Lever)
  → normalize into one schema
  → dedupe against every job seen before (URL, source id, company + title)
  → filter in code: role keywords, seniority, location, US-only, pay floor, age
  → score with AI (Gemini, Groq fallback): 0–100 fit + "why it fits" + red flags
  → rank: fit score + role-priority bonus → top 5 above the quality bar
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
| Dashboard | Next.js on Vercel (coming next) |

## Project layout

| Path | What it does |
| --- | --- |
| `src/index.js` | The daily run, start to finish |
| `src/sources/boards.js` | Remote OK, Remotive, Himalayas (BDJobs stub) |
| `src/sources/ats.js` | Watchlist companies on Greenhouse, Ashby, Lever, with auto-detection |
| `src/filter.js` | Code filters and pay parsing |
| `src/score.js` | AI scoring prompt, providers, validation, fallback |
| `src/rank.js` | Ranking and picking |
| `src/db.js` | Supabase storage (and an in-memory store for tests) |
| `src/email.js` | The morning email |
| `candidate-profile.md` | What Sara scores jobs against (edit freely) |
| `supabase/schema.sql` | Database tables, search profile, watchlist, security rules |
| `fixtures/sample-jobs.json` | Fictional jobs that exercise every rule |

## Run it

```bash
npm install
npm test          # 24 checks on sample jobs, no network or keys needed
npm run dry-run   # full run on sample jobs; writes out/email-preview.html
npm start         # real run (needs the environment variables in .env.example)
```

In production, GitHub Actions runs `npm start` daily. To run Sara on demand: **Actions → Sara daily run → Run workflow**.

## Setup

1. Run `supabase/schema.sql` in the Supabase SQL Editor.
2. Add repository secrets (Settings → Secrets and variables → Actions): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and optionally `GROQ_API_KEY`.
3. Trigger the workflow once by hand and check the run log in the `runs` table.

## Free-tier notes

- **Supabase** pauses free projects after about a week of low activity; Sara's daily writes keep it active.
- **GitHub** disables scheduled workflows in public repos after 60 days without repository activity. GitHub emails a warning first; re-enable with one click in the Actions tab, or push any commit.
- **Gemini** free-tier limits can change. Switch models with `GEMINI_MODEL`, or add `GROQ_API_KEY` as a fallback.

## Roadmap

1. **Find (MVP)**: daily picks by email ← *here*
2. **Track**: dashboard to mark Applied, add jobs found elsewhere (e.g. LinkedIn), rate picks
3. **Interviews**: read-only Gmail scan for employer replies, interview reminders
4. **Portfolio**: public demo mode with sample data, walkthrough video, case study
