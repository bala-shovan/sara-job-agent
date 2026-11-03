-- Open Sara to the public, with a cap.
-- Anyone can sign up until Sara has `max_users` people (50 to start). After
-- that, new visitors can join a waitlist. Invited emails and the owner always
-- get in. Everyone can delete their own account (and all their data).
-- Additive except for replacing the sign-up gate function.

-- Settings only the owner can change
create table if not exists public.app_settings (
  key   text primary key,
  value jsonb not null
);
insert into public.app_settings (key, value) values ('max_users', '50') on conflict (key) do nothing;
alter table public.app_settings enable row level security;
drop policy if exists "Owner reads settings" on public.app_settings;
drop policy if exists "Owner changes settings" on public.app_settings;
create policy "Owner reads settings"   on public.app_settings for select to authenticated using (public.is_owner());
create policy "Owner changes settings" on public.app_settings for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- Who counts toward the cap: confirmed accounts, plus sign-ups still waiting
-- on their email link from the last day
create or replace function public.sara_user_count() returns int
language sql stable security definer set search_path = public, auth as $$
  select count(*)::int from auth.users
  where email_confirmed_at is not null or created_at > now() - interval '1 day'
$$;

-- Public: how full Sara is (counts only, no names or emails)
create or replace function public.sara_capacity() returns json
language sql stable security definer set search_path = public, auth as $$
  select json_build_object(
    'users', public.sara_user_count(),
    'cap',   coalesce((select (value #>> '{}')::int from public.app_settings where key = 'max_users'), 50)
  )
$$;
revoke all on function public.sara_capacity() from public;
grant execute on function public.sara_capacity() to anon, authenticated;
revoke all on function public.sara_user_count() from public;

-- Sign-up gate: owner and invited people always; everyone else while there's room
create or replace function public.gate_signups() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare cap int;
begin
  if lower(new.email) = 'anikshovan@gmail.com'
     or exists (select 1 from public.invites where email = lower(new.email)) then
    return new;
  end if;
  cap := coalesce((select (value #>> '{}')::int from public.app_settings where key = 'max_users'), 50);
  if public.sara_user_count() < cap then
    return new;
  end if;
  raise exception 'SARA_FULL: Sara has reached % people', cap;
end $$;

-- Invites skip the cap; allow up to 20
drop policy if exists "Owner adds invites" on public.invites;
create policy "Owner adds invites" on public.invites for insert to authenticated
  with check (public.is_owner() and (select count(*) from public.invites) < 20);

-- Waitlist for when Sara is full. Anyone can add an email; only the owner reads it.
create table if not exists public.waitlist (
  email     text primary key check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 200),
  joined_at timestamptz not null default now()
);
alter table public.waitlist enable row level security;
drop policy if exists "Anyone joins the waitlist" on public.waitlist;
drop policy if exists "Owner reads the waitlist" on public.waitlist;
drop policy if exists "Owner removes from the waitlist" on public.waitlist;
create policy "Anyone joins the waitlist"       on public.waitlist for insert to anon, authenticated with check (true);
create policy "Owner reads the waitlist"        on public.waitlist for select to authenticated using (public.is_owner());
create policy "Owner removes from the waitlist" on public.waitlist for delete to authenticated using (public.is_owner());
grant insert on public.waitlist to anon, authenticated;

-- Delete my account: removes the person and, through the foreign keys,
-- their profile, jobs, runs and watchlist. The owner's account is protected.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if public.is_owner() then raise exception 'The owner account cannot be deleted here'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
