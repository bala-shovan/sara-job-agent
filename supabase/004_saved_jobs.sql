-- Saved jobs: keep a pick for later. Saving moves it off the Today tab
-- and onto the Saved tab. Additive only: no existing data changes.
alter table public.jobs add column if not exists saved_at timestamptz;
create index if not exists jobs_saved_idx on public.jobs (user_id, saved_at desc) where saved_at is not null;
