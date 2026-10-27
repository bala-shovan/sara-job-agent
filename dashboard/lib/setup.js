// Turning the Hire / Settings forms into Sara's profile row, and back.

export const ROLE_CATALOG = [
  { family: 'pm', label: 'Product Manager / AI PM',
    keywords: ['product manager', 'product owner', 'ai product', 'technical product manager', 'product lead'] },
  { family: 'support_engineer', label: 'Product Support Engineer',
    keywords: ['product support engineer', 'technical support engineer', 'support engineer', 'application support'] },
  { family: 'support_lead', label: 'Support Lead',
    keywords: ['support lead', 'support team lead', 'support manager', 'technical support manager'] },
  { family: 'csm', label: 'Customer Success Manager', keywords: ['customer success manager'] },
];

// Bonus by priority position: the first role ranks highest
export const PRIORITY_BONUS = [15, 10, 5, 0];

export const SENIORITY = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'director', label: 'Director and above' },
];

const ALWAYS_SKIP = ['intern', 'internship'];
const SKIP_BY_LEVEL = {
  junior: ['junior', 'entry level'],
  director: ['director', 'vp', 'vice president', 'head of'],
};

export const DAYS = [
  [1, 'Mon'], [2, 'Tue'], [3, 'Wed'], [4, 'Thu'], [5, 'Fri'], [6, 'Sat'], [7, 'Sun'],
];

const toList = (s) => s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const toText = (a = []) => a.join(', ');

function autoSkipWords(seniority) {
  return [
    ...ALWAYS_SKIP,
    ...Object.entries(SKIP_BY_LEVEL).filter(([lvl]) => !seniority.includes(lvl)).flatMap(([, w]) => w),
  ];
}

export const OWNER_EMAIL = 'anikshovan@gmail.com';

// Starting point for someone hiring Sara for the first time
export function blankProfile(email = '') {
  return {
    display_name: '',
    candidate_profile: '',
    role_families: ROLE_CATALOG.slice(0, 1).map((r, i) => ({
      priority: i + 1, family: r.family, label: r.label, bonus: PRIORITY_BONUS[i], title_keywords: r.keywords,
    })),
    seniority: ['mid', 'senior'],
    locations: { remote_allowed: ['worldwide', 'anywhere'], onsite_cities: [] },
    exclusions: { drop_us_only_remote: false, drop_title_words: ['intern', 'internship', 'junior', 'entry level', 'director', 'vp', 'vice president', 'head of'] },
    min_monthly_usd: 0,
    picks_per_day: 5,
    min_final_score: 60,
    run_hour: 9,
    run_days: [1, 2, 3, 4, 5],
    timezone: (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } })(),
    email_to: email,
    active: false,
    hired_at: null,
  };
}

// Companies every new Sara watches; edit the list in Settings
export const DEFAULT_WATCHLIST = [
  ['GitLab', 'Remote-first SaaS'], ['Zapier', 'Remote-first SaaS'], ['Buffer', 'Remote-first SaaS'],
  ['Canonical', 'Remote-first SaaS'], ['Close', 'Remote-first SaaS'], ['Hubstaff', 'Remote-first SaaS'],
  ['Help Scout', 'Remote-first SaaS'], ['Supabase', 'Remote-first SaaS'], ['PostHog', 'Remote-first SaaS'],
  ['RevenueCat', 'Remote-first SaaS'], ['Ashby', 'Remote-first SaaS'], ['Deel', 'Remote-first SaaS'],
  ['Remote', 'Remote-first SaaS'], ['Oyster', 'Remote-first SaaS'], ['Field Nation', 'Remote-first SaaS'],
  ['Bringg', 'Logistics and delivery'], ['project44', 'Logistics and delivery'], ['Contentful', 'Content and martech'],
  ['Storyblok', 'Content and martech'], ['Sanity', 'Content and martech'], ['Intercom', 'AI support'],
];

export function draftFromProfile(p) {
  const chosen = [...(p.role_families || [])].sort((a, b) => a.priority - b.priority);
  const roles = [
    ...chosen.map((r) => ({ family: r.family, label: r.label, enabled: true, keywords: toText(r.title_keywords) })),
    ...ROLE_CATALOG.filter((c) => !chosen.some((r) => r.family === c.family))
      .map((c) => ({ family: c.family, label: c.label, enabled: false, keywords: toText(c.keywords) })),
  ];
  const seniority = p.seniority?.length ? p.seniority : ['mid', 'senior', 'lead'];
  const auto = new Set(autoSkipWords(seniority));
  return {
    display_name: p.display_name || '',
    candidate_profile: p.candidate_profile || '',
    roles,
    seniority,
    remote_allowed: toText(p.locations?.remote_allowed),
    onsite_cities: toText(p.locations?.onsite_cities),
    drop_us_only_remote: p.exclusions?.drop_us_only_remote !== false,
    extra_skip: toText((p.exclusions?.drop_title_words || []).filter((w) => !auto.has(w))),
    min_monthly_usd: p.min_monthly_usd ?? 0,
    email_to: p.email_to || '',
    run_hour: p.run_hour ?? 9,
    run_days: p.run_days?.length ? p.run_days : [1, 2, 3, 4, 5, 6, 7],
    timezone: p.timezone || 'Asia/Dhaka',
    picks_per_day: p.picks_per_day ?? 5,
    min_final_score: p.min_final_score ?? 60,
  };
}

export function patchFromDraft(d, p) {
  const enabled = d.roles.filter((r) => r.enabled);
  return {
    display_name: d.display_name.trim() || null,
    candidate_profile: d.candidate_profile.trim() || null,
    role_families: enabled.map((r, i) => ({
      priority: i + 1, family: r.family, label: r.label, bonus: PRIORITY_BONUS[i] ?? 0, title_keywords: toList(r.keywords),
    })),
    seniority: d.seniority,
    locations: { ...(p.locations || {}), remote_allowed: toList(d.remote_allowed), onsite_cities: toList(d.onsite_cities) },
    exclusions: {
      ...(p.exclusions || {}),
      drop_us_only_remote: d.drop_us_only_remote,
      drop_title_words: [...new Set([...autoSkipWords(d.seniority), ...toList(d.extra_skip)])],
    },
    min_monthly_usd: Math.max(0, Number(d.min_monthly_usd) || 0),
    email_to: d.email_to.trim() || null,
    run_hour: Number(d.run_hour),
    run_days: [...d.run_days].sort(),
    timezone: d.timezone,
    picks_per_day: Math.max(1, Math.min(10, Number(d.picks_per_day) || 5)),
    min_final_score: Math.max(0, Math.min(115, Number(d.min_final_score) || 60)),
  };
}

// What's missing before Sara can be hired, step by step
export function problems(d) {
  return {
    about: !d.display_name.trim() ? 'Add your first name, so Sara knows who she works for.'
      : d.candidate_profile.trim().length < 80 ? 'Tell Sara a little more about your experience (a few lines at least).' : null,
    jobs: !d.roles.some((r) => r.enabled) ? 'Choose at least one role.'
      : !d.seniority.length ? 'Choose at least one level.'
      : (!d.remote_allowed.trim() && !d.onsite_cities.trim()) ? 'Add a remote region or a city.' : null,
    alerts: !/^\S+@\S+\.\S+$/.test(d.email_to.trim()) ? 'Add the email address for your alerts.'
      : !d.run_days.length ? 'Choose at least one day.' : null,
  };
}

// ---------- Schedule display ----------

function localParts(date, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(date).map((x) => [x.type, x.value]));
  return {
    hour: Number(parts.hour),
    isoWeekday: { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday],
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function hourLabel(h) {
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${suffix}`;
}

export function daysLabel(days = []) {
  const s = [...days].sort().join(',');
  if (s === '1,2,3,4,5,6,7') return 'every day';
  if (s === '1,2,3,4,5') return 'weekdays';
  if (s === '6,7') return 'weekends';
  return DAYS.filter(([n]) => days.includes(n)).map(([, l]) => l).join(', ');
}

const WEEKDAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// "today at 9:00 AM", "within the hour", "tomorrow at 9:00 AM", "Monday at 9:00 AM"
export function nextRunLabel(p, runs = [], now = new Date()) {
  if (!p?.hired_at) return null;
  if (!p.active) return null;
  const tz = p.timezone || 'Asia/Dhaka';
  const days = p.run_days?.length ? p.run_days : [1, 2, 3, 4, 5, 6, 7];
  const local = localParts(now, tz);
  const ranToday = runs.some((r) => (r.status === 'success' || r.status === 'partial')
    && localParts(new Date(r.started_at), tz).dateKey === local.dateKey);

  for (let d = 0; d < 8; d++) {
    const weekday = ((local.isoWeekday - 1 + d) % 7) + 1;
    if (!days.includes(weekday)) continue;
    if (d === 0) {
      if (ranToday) continue;
      if (local.hour >= p.run_hour) return 'within the hour';
      return `today at ${hourLabel(p.run_hour)}`;
    }
    return `${d === 1 ? 'tomorrow' : WEEKDAY_NAMES[weekday]} at ${hourLabel(p.run_hour)}`;
  }
  return null;
}

export function timeZones() {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return ['Asia/Dhaka', 'Asia/Kolkata', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'UTC'];
  }
}
