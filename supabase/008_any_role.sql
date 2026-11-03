-- Any role, not just the original four. People now pick roles from a
-- catalog or add their own, so a saved job's role_family can be any short
-- name (e.g. 'data_analyst', 'custom_veterinary_nurse'). This removes the old
-- fixed list and keeps a simple sanity check instead. No data changes.
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.conrelid = 'public.jobs'::regclass and con.contype = 'c' and att.attname = 'role_family'
  loop
    execute format('alter table public.jobs drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.jobs add constraint jobs_role_family_format
  check (role_family is null or role_family ~ '^[a-z0-9_]{1,60}$');
