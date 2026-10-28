// Fictional sample data for the public demo. Companies and jobs are invented.
// Dates are relative to now so the demo never looks stale.

const ago = (days, hours = 0) => new Date(Date.now() - (days * 24 + hours) * 3600000).toISOString();
const todayRun = (() => {
  // 9:00 AM Dhaka today (03:00 UTC), or yesterday's if it's earlier than that
  const d = new Date();
  d.setUTCHours(3, 2, 0, 0);
  if (d > new Date()) d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString();
})();

let id = 100;
const job = (j) => ({
  id: id++, source: 'remoteok', location: 'Worldwide', remote_scope: 'Worldwide', salary_text: null,
  status: 'New', rating: null, notes: null, is_pick: false, red_flags: '', applied_at: null, interview_at: null, saved_at: null, ...j,
});

export const demoJobs = [
  // Today's picks
  job({ title: 'Senior Product Manager, AI Routing', company: 'RouteWise', role_family: 'pm', fit_score: 88, final_score: 103, is_pick: true, found_at: todayRun,
    salary_text: '$70,000–$95,000 per year', url: 'https://example.com/routewise',
    why_fit: 'Last-mile routing SaaS building AI dispatch: a direct match for your Bulk Route Optimization and driver auto-assignment work.',
    description: 'Own the AI dispatch roadmap for a B2B route optimization platform. Work with engineering on LLM-powered driver assignment, write PRDs and talk to customers.' }),
  job({ title: 'Product Owner', company: 'DhakaLogix', role_family: 'pm', fit_score: 81, final_score: 96, is_pick: true, found_at: todayRun,
    location: 'Dhaka', remote_scope: 'Dhaka on-site', source: 'bdjobs', salary_text: 'BDT 250,000 per month', url: 'https://example.com/dhakalogix',
    why_fit: 'Fleet and delivery tracking SaaS in Dhaka running Scrum with 12 engineers; your CSPO and FULFLLD backlog experience fit closely.',
    red_flags: 'On-site five days a week.',
    description: 'Own the backlog for a fleet management and delivery tracking product. Run Scrum ceremonies and write user stories.' }),
  job({ title: 'Senior Product Support Engineer (APAC)', company: 'Helpdeskly', role_family: 'support_engineer', fit_score: 84, final_score: 94, is_pick: true, found_at: todayRun,
    location: 'Remote, APAC', remote_scope: 'Remote (APAC)', source: 'ashby:helpdeskly', url: 'https://example.com/helpdeskly',
    why_fit: 'API debugging in Postman, log analysis and Jira escalations are exactly what you did for six years supporting Optimizely CMP.',
    description: 'Debug customer API integrations, reproduce bugs, write escalations to engineering, and mentor junior support engineers.' }),
  job({ title: 'Senior Product Manager, Content Platform', company: 'StoryHub', role_family: 'pm', fit_score: 74, final_score: 89, is_pick: true, found_at: todayRun,
    location: 'Remote', remote_scope: 'Remote', source: 'lever:storyhub', url: 'https://example.com/storyhub',
    why_fit: 'Headless content platform for marketing teams; six years on Optimizely CMP gives you deep domain knowledge.',
    red_flags: 'Asks for 5+ years of PM experience.',
    description: 'Own the roadmap for a headless CMS used by marketing teams. Run discovery and define success metrics.' }),
  job({ title: 'Technical Support Team Lead', company: 'Bengal SaaS Ltd', role_family: 'support_lead', fit_score: 79, final_score: 84, is_pick: true, found_at: todayRun,
    location: 'Dhaka (Hybrid)', remote_scope: 'Dhaka hybrid', source: 'bdjobs', url: 'https://example.com/bengalsaas',
    why_fit: 'Leading a support team for US clients mirrors your Optimizely APAC manager role, where you led 12 engineers across three countries.',
    description: 'Lead a team of 8 support engineers, own escalation processes and coach engineers.' }),

  // Earlier picks, moving through the pipeline
  job({ title: 'AI Product Manager, Support Automation', company: 'Answerly', role_family: 'pm', fit_score: 86, final_score: 101, is_pick: true, found_at: ago(3),
    status: 'Interview scheduled', applied_at: ago(3), interview_at: ago(-2), rating: 'good', url: 'https://example.com/answerly',
    why_fit: 'AI support automation, the same space as your Wingman support chat.', notes: 'First call with the hiring manager. Prepare the Wingman story.' }),
  job({ title: 'Product Manager, Integrations', company: 'Fleetbase Cloud', role_family: 'pm', fit_score: 80, final_score: 95, is_pick: true, found_at: ago(2),
    status: 'Applied', applied_at: ago(2), rating: 'good', url: 'https://example.com/fleetbase',
    why_fit: 'Owns partner integrations for a fleet platform; your Uber, DoorDash and Twilio Flex integrations are relevant.' }),
  job({ title: 'Support Engineer, Developer Platform', company: 'Stackmint', role_family: 'support_engineer', fit_score: 77, final_score: 87, is_pick: true, found_at: ago(2),
    status: 'Applied', applied_at: ago(1), url: 'https://example.com/stackmint',
    why_fit: 'Developer-facing API support with GitHub-based bug tracing.' }),
  job({ title: 'Customer Success Manager, Mid-Market', company: 'ContentLane', role_family: 'csm', fit_score: 70, final_score: 70, is_pick: true, found_at: ago(1),
    status: 'Not interested', rating: 'bad', url: 'https://example.com/contentlane',
    why_fit: 'Content marketing platform customers, close to your CMP background.', notes: 'Quota-carrying role. Not for me.' }),
  job({ title: 'Product Lead, Marketplace', company: 'Gigwise', role_family: 'pm', fit_score: 76, final_score: 91, is_pick: true, found_at: ago(6),
    status: 'Rejected', applied_at: ago(6), url: 'https://example.com/gigwise',
    why_fit: 'Two-sided marketplace for field technicians.' }),
  job({ title: 'Product Owner, Payments', company: 'Ledgerly', role_family: 'pm', fit_score: 72, final_score: 87, is_pick: true, found_at: ago(1),
    rating: 'good', saved_at: ago(1), url: 'https://example.com/ledgerly', why_fit: 'B2B SaaS payments product with a Scrum team in APAC.' }),
  job({ title: 'Product Manager', company: 'Remote Hiring Co', role_family: 'pm', source: 'manual', found_at: ago(4),
    status: 'Applied', applied_at: ago(4), url: 'https://example.com/manual-linkedin', why_fit: null, notes: 'Found on LinkedIn.' }),
];

const runAt = (daysBack) => new Date(new Date(todayRun).getTime() - daysBack * 86400000).toISOString();
const run = (daysBack, f) => ({
  id: 1000 - daysBack, started_at: runAt(daysBack), finished_at: runAt(daysBack), status: 'success', email_sent: true, errors: [], ...f,
});

export const demoRuns = [
  run(0, { started_at: todayRun, finished_at: todayRun, fetched: 1284, after_dedupe: 611, after_filter: 38, scored: 38, picked: 5 }),
  run(1, { fetched: 1240, after_dedupe: 102, after_filter: 21, scored: 21, picked: 3 }),
  run(2, { fetched: 1263, after_dedupe: 95, after_filter: 26, scored: 26, picked: 4, status: 'partial',
    errors: [{ source: 'himalayas', error: 'HTTP 503 for https://himalayas.app/jobs/api' }] }),
  run(3, { fetched: 1198, after_dedupe: 88, after_filter: 19, scored: 19, picked: 3 }),
  run(4, { fetched: 1222, after_dedupe: 120, after_filter: 24, scored: 24, picked: 2 }),
  run(5, { fetched: 1175, after_dedupe: 91, after_filter: 17, scored: 17, picked: 0 }),
  run(6, { fetched: 1150, after_dedupe: 640, after_filter: 33, scored: 33, picked: 5,
    errors: [{ source: 'watchlist', error: 'Canonical: not on Greenhouse, Ashby or Lever. Add it manually or remove it.' }], status: 'partial' }),
];

export const demoProfile = {
  id: 1,
  display_name: 'Bala',
  role_families: [
    { priority: 1, family: 'pm', label: 'Product Manager / AI PM', bonus: 15,
      title_keywords: ['product manager', 'product owner', 'ai product', 'technical product manager', 'product lead'] },
    { priority: 2, family: 'support_engineer', label: 'Product Support Engineer', bonus: 10,
      title_keywords: ['product support engineer', 'technical support engineer', 'support engineer', 'application support'] },
    { priority: 3, family: 'support_lead', label: 'Support Lead', bonus: 5,
      title_keywords: ['support lead', 'support team lead', 'support manager', 'technical support manager'] },
    { priority: 4, family: 'csm', label: 'Customer Success Manager', bonus: 0, title_keywords: ['customer success manager'] },
  ],
  locations: { remote_allowed: ['worldwide', 'anywhere', 'global', 'apac', 'asia', 'bangladesh'], onsite_cities: ['dhaka'], us_hours_ok: true },
  exclusions: { drop_us_only_remote: true, drop_title_words: ['intern', 'internship', 'junior', 'entry level', 'director', 'vp', 'vice president', 'head of'] },
  seniority: ['mid', 'senior', 'lead'],
  min_monthly_usd: 2000,
  picks_per_day: 5,
  min_final_score: 60,
  run_time: '09:00 Asia/Dhaka',
  candidate_profile: `Product Owner at a last-mile delivery and fleet management SaaS. Shipped bulk route optimization (helped win $45K and $250K ARR customers), an AI support chat, driver auto-assignment and integrations with Uber, DoorDash and Twilio Flex. Certified Scrum Product Owner.

Before that, about 7 years at Optimizely: support engineer, senior support engineer, then APAC support manager leading 12 engineers across Dhaka, Hanoi and Australia. Debugged APIs in Postman, read logs in Kibana, traced bugs on GitHub, wrote Jira escalations.

Based in Dhaka. Open to remote roles worldwide or in APAC, and on-site or hybrid roles in Dhaka. Happy to work US hours.`,
  active: true,
  hired_at: ago(1),
  run_hour: 9,
  run_days: [1, 2, 3, 4, 5, 6, 7],
  timezone: 'Asia/Dhaka',
  email_to: 'you@example.com',
};

export const demoCompanies = [
  ['RouteWise', 'Logistics and delivery', 'greenhouse'],
  ['StoryHub', 'Content and martech', 'lever'],
  ['Helpdeskly', 'AI support', 'ashby'],
  ['Answerly', 'AI support', 'ashby'],
  ['Fleetbase Cloud', 'Logistics and delivery', 'greenhouse'],
  ['Stackmint', 'Remote-first SaaS', 'unknown'],
].map(([name, group_name, ats], i) => ({ id: i + 1, name, group_name, ats, slug: ats === 'unknown' ? null : name.toLowerCase().replace(/\W/g, ''), active: true, last_checked_at: todayRun }));
