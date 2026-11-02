-- Bala's pick lists, revised: Product is entry to mid level (jobs asking
-- 1-4 years, no Senior/Lead/Principal titles); Technical Support is mid to
-- senior level (jobs asking 3+ years, no Tier 1/junior titles).
-- Data only: no tables or columns change.
update public.profile
set pick_groups = '[
  {"key": "product", "label": "Product", "level": "entry to mid level", "families": ["pm"], "picks": 5, "min_years": 1, "max_years": 4,
   "drop_title_words": ["senior", "sr", "principal", "staff", "lead", "group", "head", "director", "vp"]},
  {"key": "support", "label": "Technical Support", "level": "mid to senior level", "families": ["support_engineer", "support_lead"], "picks": 5, "min_years": 3, "max_years": null,
   "drop_title_words": ["tier 1", "tier i", "level 1", "l1", "associate", "trainee", "junior", "entry level", "intern"]}
]'::jsonb
where user_id = (select id from auth.users where lower(email) = 'anikshovan@gmail.com');
