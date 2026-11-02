// Step 5 of the daily run: cheap, deterministic filtering in code.
// Only jobs that survive this reach the AI, which keeps Sara inside
// free-tier limits. Every drop gets a reason so the run log can explain it.

const US_ONLY_LOCATION = /\b(us|usa|u\.s\.?|united states|us only|usa only|north america|americas|canada|us\/canada)\b/i;
const US_ONLY_TEXT = /(must (be|reside|live) (located |based )?in the (us|u\.s\.|united states)|us (residents|citizens|candidates) only|authori[sz]ed to work in the (us|u\.s\.|united states)|us work authori[sz]ation|only (hiring|considering) (candidates )?(in|from) the (us|u\.s\.|united states))/i;

import { pickGroups, groupFor } from './groups.js';

// Titles that mark a senior-level role
export const SENIOR_TITLE = /\b(senior|sr\.?|lead|staff|principal|manager|head|iii|iv|l3|l4|tier 3)\b/i;

const WORD_NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

// Years of experience a posting asks for, e.g. "5+ years of experience",
// "3-5 years experience", "at least seven years in support". Returns the
// highest minimum it finds, or null when the posting doesn't say.
export function requiredYears(text = '') {
  if (!text) return null;
  const re = /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:\+|plus)?\s*(?:(?:-|–|to)\s*\d{1,2}\s*)?(?:\+\s*)?(?:years?|yrs?)\b/gi;
  let best = null;
  for (const m of text.matchAll(re)) {
    const n = WORD_NUMBERS[m[1].toLowerCase()] ?? Number(m[1]);
    const around = text.slice(Math.max(0, m.index - 40), m.index + m[0].length + 80);
    // Only count years tied to experience, not "founded 10 years ago"
    if (!/experience|exp\b|background|track record|working (in|as|with)/i.test(around)) continue;
    if (n < 1 || n > 20) continue;
    best = best === null ? n : Math.max(best, n);
  }
  return best;
}

function hasAnyWord(text, words) {
  return words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text));
}

// Which role family does a title belong to? Highest priority wins.
export function classifyTitle(title, profile) {
  const t = title.toLowerCase();
  const families = [...profile.role_families].sort((a, b) => a.priority - b.priority);
  for (const f of families) {
    if (f.title_keywords.some((k) => t.includes(k))) return f.family;
  }
  return null;
}

// Rough monthly USD from listed pay. Returns null when it can't tell.
export function monthlyUsd(job) {
  let max = job.salary_max;
  let period = job.salary_period;
  let currency = job.salary_currency;

  if (!max && job.salary_text) {
    const nums = [...job.salary_text.replace(/,/g, '').matchAll(/(\d+(?:\.\d+)?)\s*(k)?/gi)]
      .map((m) => Number(m[1]) * (m[2] ? 1000 : 1))
      .filter((n) => n >= 100);
    if (nums.length) max = Math.max(...nums);
    if (/month|mo\b/i.test(job.salary_text)) period = 'month';
    else if (/hour|hr\b/i.test(job.salary_text)) period = 'hour';
    else if (max) period = max > 20000 ? 'year' : 'month';
    if (/\$|usd/i.test(job.salary_text)) currency = 'USD';
    else if (/bdt|tk|৳/i.test(job.salary_text)) currency = 'BDT';
  }
  if (!max) return null;
  const perMonth = period === 'hour' ? max * 160 : period === 'month' ? max : max / 12;
  if (!currency || currency === 'USD') return Math.round(perMonth);
  if (currency === 'BDT') return Math.round(perMonth / 120); // approximate rate; good enough for a floor check
  return null; // other currencies: don't guess, keep the job
}

export function filterJobs(jobs, profile, { maxAgeDays = 30 } = {}) {
  const kept = [];
  const dropped = {};
  const drop = (reason) => { dropped[reason] = (dropped[reason] || 0) + 1; };
  const allowed = profile.locations.remote_allowed;
  const cities = profile.locations.onsite_cities;
  const cutoff = Date.now() - maxAgeDays * 86400000;
  const groups = pickGroups(profile);

  for (const job of jobs) {
    if (!job.url || !job.title) { drop('missing link or title'); continue; }

    const family = classifyTitle(job.title, profile);
    if (!family) { drop('title is not a target role'); continue; }

    const group = groupFor(family, groups);
    if (!group) { drop('role not in your pick lists'); continue; }

    if (hasAnyWord(job.title, profile.exclusions.drop_title_words)) { drop('seniority out of range'); continue; }

    // Experience and level rules for this list, e.g. Product: entry to mid
    // level, asking 1-4 years; Technical Support: mid to senior, asking 3+ years
    if (group.drop_title_words?.length && hasAnyWord(job.title, group.drop_title_words)) { drop(`${group.label}: level out of range`); continue; }
    const years = requiredYears(job.description);
    if (years !== null && group.min_years && years < group.min_years) { drop(`${group.label}: asks under ${group.min_years} years`); continue; }
    if (years !== null && group.max_years && years > group.max_years) { drop(`${group.label}: asks over ${group.max_years} years`); continue; }
    if (years === null && group.senior_only && !SENIOR_TITLE.test(job.title)) { drop(`${group.label}: not senior level`); continue; }

    if (job.posted_at && new Date(job.posted_at).getTime() < cutoff) { drop('older than 30 days'); continue; }

    const loc = `${job.location || ''} ${job.remote_scope || ''}`;
    const inCity = hasAnyWord(loc, cities) || /bangladesh/i.test(loc);
    const openRemote = hasAnyWord(loc, allowed) || /^\s*remote\s*$/i.test(job.location || '');

    if (!job.is_remote && !inCity) { drop('on-site outside Dhaka'); continue; }

    if (job.is_remote && !inCity && !openRemote) {
      if (profile.exclusions.drop_us_only_remote && US_ONLY_LOCATION.test(loc)) { drop('remote but US/North America only'); continue; }
      // Restricted to some other region (e.g. "Europe only")
      if (loc.trim() && !/remote/i.test(loc)) { drop('remote but not open to Bangladesh'); continue; }
    }

    if (profile.exclusions.drop_us_only_remote && US_ONLY_TEXT.test(job.description || '')) { drop('description says US-only'); continue; }

    const monthly = monthlyUsd(job);
    if (monthly !== null && monthly < profile.min_monthly_usd) { drop('pay below minimum'); continue; }

    kept.push({ ...job, role_family: family, monthly_usd: monthly, years_required: years });
  }
  return { kept, dropped };
}

// If more jobs pass than the AI budget allows, keep the best-looking ones.
// The budget is shared between pick lists in proportion to their picks, so
// one busy list can't crowd out another. Within a list: role priority, then newest.
export function capForScoring(jobs, profile, max) {
  const prio = Object.fromEntries(profile.role_families.map((f) => [f.family, f.priority]));
  const order = (a, b) => (prio[a.role_family] - prio[b.role_family])
    || (new Date(b.posted_at || 0) - new Date(a.posted_at || 0));
  const groups = pickGroups(profile);
  const totalPicks = groups.reduce((n, g) => n + (Number(g.picks) || 0), 0) || 1;
  const chosen = new Set();
  for (const g of groups) {
    const share = Math.floor((max * (Number(g.picks) || 0)) / totalPicks);
    jobs.filter((j) => g.families.includes(j.role_family)).sort(order).slice(0, share).forEach((j) => chosen.add(j));
  }
  // Hand any unused budget to whatever is left
  for (const j of [...jobs].sort(order)) { if (chosen.size >= max) break; chosen.add(j); }
  return [...chosen];
}
