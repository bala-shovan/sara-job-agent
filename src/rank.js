// Steps 7 and 8: rank by AI fit score plus role-priority bonus, then pick
// the top N above the quality bar. Fewer picks beat padded picks.

export function rankAndPick(scored, profile) {
  const bonus = Object.fromEntries(profile.role_families.map((f) => [f.family, f.bonus]));

  const ranked = scored
    .map((j) => ({ ...j, final_score: j.fit_score + (bonus[j.role_family] ?? 0) }))
    .sort((a, b) => b.final_score - a.final_score);

  const picks = [];
  const seen = new Set();
  for (const job of ranked) {
    if (picks.length >= profile.picks_per_day) break;
    if (job.us_only || job.role_family === 'other') continue;
    if (job.final_score < profile.min_final_score) continue;
    // Same role reposted on two boards: keep the first (highest-scored) copy
    const key = `${job.company}|${job.title}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(job);
  }

  const pickUrls = new Set(picks.map((p) => p.url));
  return { ranked: ranked.map((j) => ({ ...j, is_pick: pickUrls.has(j.url) })), picks };
}
