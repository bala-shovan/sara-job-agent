-- =====================================================================
-- Sara migration 002: hire Sara and set her schedule from the dashboard
-- Run once in Supabase: SQL Editor > New query > paste > Run
-- Safe to re-run: every change checks whether it already exists.
-- =====================================================================

alter table public.profile
  add column if not exists candidate_profile text,          -- "About you": what Sara scores jobs against
  add column if not exists active boolean not null default false,  -- on duty (true) or paused (false)
  add column if not exists hired_at timestamptz,            -- null until you click Hire Sara
  add column if not exists run_hour int not null default 9 check (run_hour between 0 and 23),
  add column if not exists run_days int[] not null default '{1,2,3,4,5,6,7}',  -- ISO weekdays, 1 = Monday
  add column if not exists timezone text not null default 'Asia/Dhaka',
  add column if not exists email_to text;

-- Sara is already working for you, so mark her as hired with today's
-- settings and move your profile out of the repo into the database.
update public.profile set
  active = true,
  hired_at = coalesce(hired_at, now()),
  run_hour = 9,
  run_days = '{1,2,3,4,5,6,7}',
  timezone = 'Asia/Dhaka',
  email_to = coalesce(email_to, 'anikshovan@gmail.com'),
  candidate_profile = coalesce(candidate_profile, $profile$
- Based in Dhaka, Bangladesh. Open to fully remote roles worldwide or in APAC, US-market remote roles that hire from Bangladesh, and on-site or hybrid roles in Dhaka. Happy to work full US hours.
- 10+ years in B2B SaaS and e-commerce: about 1.5 years in product management and 9 in technical support and support leadership.
- Target level: mid, senior or lead. Not director.

## Product Owner, FULFLLD (last-mile delivery and fleet management SaaS)
- Shipped Bulk Route Optimization, which helped win new customers worth $45K and $250K ARR.
- Shipped an AI support chat (Wingman, alpha), driver auto-assignment and reassignment, a revamped tracking link, issue reporting, logic-based SMS notifications, order routing rules, custom fields and a configurable smart form builder.
- Built integrations with Uber, DoorDash, Roadie, Twilio Flex and Slack.
- Worked on barcode scanning, client billing and cost-per-drop.
- Certified Scrum Product Owner (CSPO). Writes PRDs, tickets and release notes.

## Optimizely (including NewsCred), about 7 years
- Customer Support Engineer, then Senior Technical Support Engineer, then Manager, Technical Support Services (APAC).
- Supported Optimizely's Content Marketing Platform (CMP) for 6 years.
- Led a team of 12 support engineers across Dhaka, Hanoi and Australia; coached engineers and ran escalation and handoff processes.
- Debugged APIs in Postman, read logs in Kibana, traced bugs in code on GitHub, and wrote Jira escalations with reproduction steps.

## Earlier
- Customer Experience Manager, Backpack (2016–2018).

## Education
- Executive MBA, IBA, University of Dhaka. BBA in Marketing, Jahangirnagar University.

## Strongest fits
- Product Manager or AI Product Manager roles in B2B SaaS, especially logistics, delivery, martech/content platforms or AI-powered support.
- Product Support Engineer and Support Lead roles where API debugging, log analysis and escalation management matter.
- Customer Success Manager roles at technical B2B SaaS companies (no prior CSM title, but deep customer-facing experience).
$profile$)
where id = 1;

-- CHECK: one row, active = true, run_hour = 9
-- select active, hired_at, run_hour, run_days, timezone, email_to, length(candidate_profile) from public.profile;
