-- =====================================================================
-- Sara - AI Job Search Agent: database setup
-- Run this once in Supabase: SQL Editor > New query > paste > Run
-- Creates 4 tables: jobs, runs, profile, companies
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. JOBS: every job Sara has seen. Picks are flagged with is_pick.
--    Seeing all jobs (not just picks) is how Sara avoids duplicates.
-- ---------------------------------------------------------------------
create table public.jobs (
  id            bigint generated always as identity primary key,
  source        text not null,                 -- e.g. 'remoteok', 'greenhouse:gitlab', 'bdjobs', 'manual'
  external_id   text,                          -- the job's id on its source
  url           text not null unique,          -- apply link (always from the source, never from AI)
  title         text not null,
  company       text not null,
  location      text,
  remote_scope  text,                          -- e.g. 'Worldwide', 'APAC', 'Dhaka hybrid'
  salary_text   text,                          -- pay exactly as the job lists it, if any
  posted_at     timestamptz,
  description   text,

  -- Filled in by Sara's AI scoring
  role_family   text check (role_family in ('pm', 'support_engineer', 'support_lead', 'csm', 'other')),
  fit_score     int  check (fit_score between 0 and 100),
  final_score   int,                           -- fit_score + role-priority bonus
  why_fit       text,
  red_flags     text,
  is_pick       boolean not null default false,

  -- Your tracking
  status        text not null default 'New'
                check (status in ('New', 'Applied', 'Interview scheduled', 'Offer', 'Rejected', 'Not interested')),
  rating        text check (rating in ('good', 'bad')),
  notes         text,
  found_at      timestamptz not null default now(),
  applied_at    timestamptz,
  interview_at  timestamptz,

  unique (source, external_id)
);

create index jobs_status_idx   on public.jobs (status);
create index jobs_found_at_idx on public.jobs (found_at desc);
create index jobs_is_pick_idx  on public.jobs (is_pick) where is_pick;


-- ---------------------------------------------------------------------
-- 2. RUNS: one row per morning run. Powers the activity log.
-- ---------------------------------------------------------------------
create table public.runs (
  id            bigint generated always as identity primary key,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  status        text not null default 'running'
                check (status in ('running', 'success', 'partial', 'failed')),
  fetched       int default 0,                 -- jobs pulled from all sources
  after_dedupe  int default 0,                 -- jobs Sara had not seen before
  after_filter  int default 0,                 -- jobs left after code filters
  scored        int default 0,                 -- jobs scored by the AI
  picked        int default 0,                 -- picks saved (max 5)
  email_sent    boolean default false,
  errors        jsonb not null default '[]'::jsonb  -- e.g. [{"source":"bdjobs","error":"timeout"}]
);


-- ---------------------------------------------------------------------
-- 3. PROFILE: Sara's brief. Exactly one row (id = 1).
-- ---------------------------------------------------------------------
create table public.profile (
  id               int primary key default 1 check (id = 1),
  role_families    jsonb not null,
  locations        jsonb not null,
  exclusions       jsonb not null,
  seniority        jsonb not null,
  min_monthly_usd  int  not null,
  picks_per_day    int  not null default 5,
  min_final_score  int  not null default 60,
  run_time         text not null,
  updated_at       timestamptz not null default now()
);

insert into public.profile
  (role_families, locations, exclusions, seniority, min_monthly_usd, picks_per_day, min_final_score, run_time)
values (
  '[
    {"priority": 1, "family": "pm", "label": "Product Manager / AI PM", "bonus": 15,
     "title_keywords": ["product manager", "product owner", "ai product", "technical product manager", "product lead"]},
    {"priority": 2, "family": "support_engineer", "label": "Product Support Engineer", "bonus": 10,
     "title_keywords": ["product support engineer", "technical support engineer", "support engineer", "application support"]},
    {"priority": 3, "family": "support_lead", "label": "Support Lead", "bonus": 5,
     "title_keywords": ["support lead", "support team lead", "support manager", "technical support manager"]},
    {"priority": 4, "family": "csm", "label": "Customer Success Manager", "bonus": 0,
     "title_keywords": ["customer success manager"]}
  ]'::jsonb,
  '{
    "remote_allowed": ["worldwide", "anywhere", "global", "apac", "asia", "bangladesh"],
    "onsite_cities": ["dhaka"],
    "us_hours_ok": true
  }'::jsonb,
  '{
    "drop_us_only_remote": true,
    "drop_title_words": ["intern", "internship", "junior", "entry level", "director", "vp", "vice president", "head of"]
  }'::jsonb,
  '["mid", "senior", "lead"]'::jsonb,
  2000,
  5,
  60,
  '09:00 Asia/Dhaka'
);


-- ---------------------------------------------------------------------
-- 4. COMPANIES: the watchlist. Sara fills in ats + slug on her first run.
-- ---------------------------------------------------------------------
create table public.companies (
  id               bigint generated always as identity primary key,
  name             text not null unique,
  group_name       text,
  why              text,
  ats              text not null default 'unknown'
                   check (ats in ('greenhouse', 'ashby', 'lever', 'other', 'unknown')),
  slug             text,                       -- the company's id on its job system
  active           boolean not null default true,
  last_checked_at  timestamptz
);

insert into public.companies (name, group_name, why) values
  ('Optimizely',   'My picks',               'Former employer; Dhaka office and CMP team'),
  ('Field Nation', 'My picks',               'Dhaka product team; PM and Product Lead roles posted'),
  ('Bonusly',      'My picks',               'Remote B2B HR-tech SaaS building AI features'),
  ('GitLab',       'Remote-first SaaS',      'Fully remote, hires across regions including APAC'),
  ('Automattic',   'Remote-first SaaS',      'Fully distributed company'),
  ('Zapier',       'Remote-first SaaS',      'Fully remote automation platform'),
  ('Doist',        'Remote-first SaaS',      'Remote-first productivity tools'),
  ('Buffer',       'Remote-first SaaS',      'Fully remote social media SaaS'),
  ('Canonical',    'Remote-first SaaS',      'Distributed, hires globally'),
  ('Close',        'Remote-first SaaS',      'Fully remote CRM'),
  ('Hubstaff',     'Remote-first SaaS',      'Distributed team, workforce software'),
  ('Toggl',        'Remote-first SaaS',      'Distributed team, time-tracking SaaS'),
  ('Help Scout',   'Remote-first SaaS',      'Remote customer support software'),
  ('Supabase',     'Remote-first SaaS',      'Fully remote; the database Sara runs on'),
  ('PostHog',      'Remote-first SaaS',      'Fully remote product analytics'),
  ('RevenueCat',   'Remote-first SaaS',      'Remote subscription platform'),
  ('Ashby',        'Remote-first SaaS',      'Already targeting its support roles'),
  ('Deel',         'Remote-first SaaS',      'Global hiring platform, distributed team'),
  ('Remote',       'Remote-first SaaS',      'Global hiring platform, distributed team'),
  ('Oyster',       'Remote-first SaaS',      'Global hiring platform, distributed team'),
  ('Hotjar',       'Remote-first SaaS',      'Remote-first product analytics'),
  ('Onfleet',      'Logistics and delivery', 'Last-mile delivery software, close to FULFLLD'),
  ('Routific',     'Logistics and delivery', 'Route optimization, like Bulk Route Optimization work'),
  ('Bringg',       'Logistics and delivery', 'Delivery orchestration platform'),
  ('project44',    'Logistics and delivery', 'Supply chain visibility platform'),
  ('Contentful',   'Content and martech',    'Content platform, close to Optimizely CMP'),
  ('Storyblok',    'Content and martech',    'Headless CMS, remote-friendly'),
  ('Sanity',       'Content and martech',    'Content platform, remote-friendly'),
  ('Intercom',     'AI support',             'AI customer service (Fin), close to Wingman work'),
  ('Ada',          'AI support',             'AI customer service automation');


-- ---------------------------------------------------------------------
-- 5. SECURITY (Row Level Security)
--    Sara's script uses the secret key, which bypasses these rules.
--    The dashboard uses the public key, so only YOU (signed in with
--    this email) can read or change data. Everyone else sees nothing.
-- ---------------------------------------------------------------------
alter table public.jobs      enable row level security;
alter table public.runs      enable row level security;
alter table public.profile   enable row level security;
alter table public.companies enable row level security;

create policy "Owner full access" on public.jobs for all to authenticated
  using ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com');

create policy "Owner full access" on public.runs for all to authenticated
  using ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com');

create policy "Owner full access" on public.profile for all to authenticated
  using ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com');

create policy "Owner full access" on public.companies for all to authenticated
  using ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'anikshovan@gmail.com');


-- ---------------------------------------------------------------------
-- 6. CHECK: run these afterwards to confirm everything landed
-- ---------------------------------------------------------------------
-- select count(*) from public.companies;   -- expect 30
-- select * from public.profile;            -- expect 1 row
