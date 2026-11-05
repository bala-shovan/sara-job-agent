-- Sara's alarm clock. GitHub's free scheduler skips or delays runs by hours,
-- so Supabase wakes Sara instead: every 15 minutes it asks GitHub to start
-- the "Sara daily run" workflow with force = false. Each run checks every
-- person's schedule (days, time, time zone) and works only for those who are
-- due, so 9 AM Dhaka gets picks just after 9:00 Dhaka time and 11 AM New York
-- just after 11:00 New York time. Wake-ups when nobody is due end in seconds.
--
-- Needs one secret: a GitHub token that may start this repo's workflows,
-- stored in Supabase Vault under the name 'github_dispatch_token' (step 2).

-- 1. The scheduler and web request extensions (both free on Supabase)
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- 2. Run this ONE line yourself with your token in place of the dots
--    (never commit a real token):
--    select vault.create_secret('github_pat_...', 'github_dispatch_token', 'Starts the Sara daily run workflow');

-- 3. Ask GitHub to start a run
create or replace function public.sara_wake() returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare
  token text;
  request_id bigint;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name = 'github_dispatch_token';
  if token is null then
    raise notice 'Sara alarm clock: no github_dispatch_token in Vault yet';
    return null;
  end if;
  select net.http_post(
    url := 'https://api.github.com/repos/bala-shovan/sara-job-agent/actions/workflows/sara-daily.yml/dispatches',
    body := jsonb_build_object('ref', 'main', 'inputs', jsonb_build_object('force', 'false')),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'sara-job-agent-alarm-clock',
      'Content-Type', 'application/json'
    ),
    timeout_milliseconds := 15000
  ) into request_id;
  return request_id;
end $$;

-- Only the database itself may call it
revoke all on function public.sara_wake() from public, anon, authenticated;

-- 4. Every 15 minutes, on the quarter hour (UTC)
select cron.schedule('sara-wake', '*/15 * * * *', 'select public.sara_wake()');

-- To check it later:
--   select jobname, schedule, active from cron.job;
--   select status, return_message, start_time from cron.job_run_details order by start_time desc limit 5;
--   select status_code, content from net._http_response order by created desc limit 5;  -- 204 = GitHub accepted
-- To stop it:  select cron.unschedule('sara-wake');
