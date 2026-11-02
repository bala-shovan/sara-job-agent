// Pick lists. Each person's Sara can split her daily picks into lists, for
// example 5 Product + 5 Technical Support, each with its own experience rule.
// Profiles without lists get one list of all their roles (the old behaviour).

export const DEFAULT_MIN_FIT = 75;

export function pickGroups(profile) {
  if (Array.isArray(profile?.pick_groups) && profile.pick_groups.length) return profile.pick_groups;
  return [{
    key: 'all', label: 'Picks', families: (profile?.role_families || []).map((f) => f.family),
    picks: profile?.picks_per_day ?? 5, min_years: 0, senior_only: false,
  }];
}

export const groupFor = (family, groups) => groups.find((g) => g.families.includes(family)) || null;

// Lowest AI match (0-100) a job needs to be picked
export const minFit = (profile) => (Number.isFinite(profile?.min_fit_score) ? profile.min_fit_score : DEFAULT_MIN_FIT);
