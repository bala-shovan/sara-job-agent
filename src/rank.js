// Steps 7 and 8: rank by AI fit score, then fill each pick list (e.g. 5
// Product + 5 Technical Support) with its best jobs at or above the minimum
// match. Fewer picks beat padded picks.

import { pickGroups, minFit } from './groups.js';

export function rankAndPick(scored, profile) {
  const bonus = Object.fromEntries(profile.role_families.map((f) => [f.family, f.bonus]));
  const groups = pickGroups(profile);
  const floor = minFit(profile);

  const ranked = scored
    .map((j) => ({ ...j, final_score: j.fit_score + (bonus[j.role_family] ?? 0) }))
    .sort((a, b) => b.fit_score - a.fit_score || b.final_score - a.final_score);

  const picks = [];
  const seen = new Set();
  for (const group of groups) {
    let taken = 0;
    for (const job of ranked) {
      if (taken >= (Number(group.picks) || 0)) break;
      if (!group.families.includes(job.role_family)) continue;
      if (job.us_only || job.role_family === 'other') continue;
      if (job.fit_score < floor) continue;
      // Same role reposted on two boards: keep the first (highest-scored) copy
      const key = `${job.company}|${job.title}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      picks.push({ ...job, pick_group: group.key });
      taken += 1;
    }
  }

  const pickUrls = new Set(picks.map((p) => p.url));
  return { ranked: ranked.map((j) => ({ ...j, is_pick: pickUrls.has(j.url) })), picks, groups };
}
