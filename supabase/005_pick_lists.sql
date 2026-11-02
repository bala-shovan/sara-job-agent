-- Pick lists and a minimum match. Additive: no existing data is removed.
--  * pick_groups: split daily picks into lists, each with its own experience
--    rule (null = one list of all roles, the old behaviour)
--  * min_fit_score: drop any job below this AI match (0-100)
alter table public.profile add column if not exists pick_groups jsonb;
alter table public.profile add column if not exists min_fit_score int not null default 75;

-- Bala's Sara: 5 Product (roles asking 2+ years) + 5 Technical Support
-- (senior level, asking 7+ years), 75% match or better
update public.profile
set pick_groups = '[
      {"key": "product", "label": "Product", "families": ["pm"], "picks": 5, "min_years": 2, "senior_only": false},
      {"key": "support", "label": "Technical Support", "families": ["support_engineer", "support_lead"], "picks": 5, "min_years": 7, "senior_only": true}
    ]'::jsonb,
    picks_per_day = 10,
    min_fit_score = 75
where user_id = (select id from auth.users where lower(email) = 'anikshovan@gmail.com');
