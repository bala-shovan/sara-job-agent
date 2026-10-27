// One wake-up, start to finish. Several people can have their own Sara, so:
//   0. find everyone whose Sara is due (their own days, hour and time zone)
//   1. fetch jobs ONCE from the boards and the combined company watchlist
//   then, for each person, using their own settings:
//   2. dedupe against what their Sara has seen   3. filter in code
//   4. score with AI   5. rank and pick   6. save, log the run, email them

import { readFile } from 'node:fs/promises';
import { config } from './config.js';
import { createStore } from './db.js';
import { BOARD_SOURCES } from './sources/boards.js';
import { fetchWatchlist } from './sources/ats.js';
import { filterJobs, capForScoring } from './filter.js';
import { scoreJobs } from './score.js';
import { rankAndPick } from './rank.js';
import { sendEmail } from './email.js';
import { isDue, localDayStartUtc } from './schedule.js';
import { log, normKey } from './util.js';

async function loadFixtures() {
  const raw = await readFile(new URL('../fixtures/sample-jobs.json', import.meta.url), 'utf8');
  const fx = JSON.parse(raw);
  // Sample jobs use "posted_days_ago" so they never go stale
  const withDate = (j) => ({
    ...j,
    posted_at: j.posted_days_ago === undefined ? null : new Date(Date.now() - j.posted_days_ago * 86400000).toISOString(),
  });
  return { jobs: fx.jobs.map(withDate), already_seen: fx.already_seen || [] };
}

const isWatchlistJob = (j) => /^(greenhouse|ashby|lever):/.test(j.source);

// Who should Sara work for right now?
async function dueProfiles(store, force) {
  const profiles = await store.getProfiles();
  const due = [];
  for (const p of profiles) {
    if (force && p.active) { due.push(p); continue; }
    const since = localDayStartUtc(new Date(), p.timezone || 'Asia/Dhaka').toISOString();
    const result = isDue(p, await store.runsSince(p.user_id, since));
    log(`${p.display_name || p.user_id}: ${result.reason}`);
    if (result.due) due.push(p);
  }
  return due;
}

// Fetch once for everyone who is due
async function fetchShared(store, profiles) {
  const errors = [];
  if (config.mock) {
    const fx = await loadFixtures();
    log(`Mock mode: loaded ${fx.jobs.length} sample jobs`);
    return { jobs: fx.jobs, errors, companiesByUser: new Map() };
  }

  const jobs = [];
  for (const src of BOARD_SOURCES.filter((s) => !s.disabled)) {
    try {
      const found = await src.fetch();
      log(`${src.name}: ${found.length} jobs`);
      jobs.push(...found);
    } catch (e) {
      log(`${src.name} failed: ${e.message}`);
      errors.push({ source: src.name, error: e.message });
    }
  }

  // Each company is fetched once, even if several people watch it. Prefer
  // the row whose job system is already known.
  const rows = await store.getCompanies(profiles.map((p) => p.user_id));
  const byName = new Map();
  for (const c of rows) {
    const key = c.name.toLowerCase();
    const known = byName.get(key);
    if (!known || (known.ats === 'unknown' && c.ats !== 'unknown')) byName.set(key, c);
  }
  const reps = [...byName.values()];
  const watch = await fetchWatchlist(reps);
  log(`watchlist (${reps.length} companies): ${watch.jobs.length} jobs`);
  jobs.push(...watch.jobs);
  errors.push(...watch.errors.map((e) => ({ ...e, company: e.error.split(':')[0] })));

  const nameById = new Map(reps.map((c) => [c.id, c.name]));
  for (const { id, ...fields } of watch.updates) {
    const name = nameById.get(id);
    if (name) await store.updateCompaniesByName(name, fields).catch((e) => errors.push({ source: 'companies', error: e.message }));
  }

  const companiesByUser = new Map();
  for (const c of rows) {
    if (!companiesByUser.has(c.user_id)) companiesByUser.set(c.user_id, new Set());
    companiesByUser.get(c.user_id).add(c.name.toLowerCase());
  }
  return { jobs, errors, companiesByUser };
}

function dedupe(jobs, existing) {
  const seenNow = new Set();
  return jobs.filter((j) => {
    const titleKey = `${normKey(j.company)}|${normKey(j.title)}`;
    if (!j.url || existing.urls.has(j.url) || existing.ids.has(`${j.source}|${j.external_id}`)) return false;
    if (existing.titles.has(titleKey)) return false;
    if (seenNow.has(j.url) || seenNow.has(titleKey)) return false;
    seenNow.add(j.url);
    seenNow.add(titleKey);
    return true;
  });
}

async function runForUser(store, profile, shared) {
  const userId = profile.user_id;
  const name = profile.display_name || 'user';
  const mine = shared.companiesByUser.get(userId) || new Set();

  // Board jobs are for everyone; watchlist jobs only for people watching that company
  const jobs = shared.jobs.filter((j) => !isWatchlistJob(j) || config.mock || mine.has(j.company.toLowerCase()));
  const errors = shared.errors.filter((e) => !e.company || mine.has(e.company.toLowerCase()))
    .map(({ company, ...e }) => e);
  const stats = { fetched: jobs.length, after_dedupe: 0, after_filter: 0, scored: 0, picked: 0 };

  const runId = await store.startRun(userId);
  try {
    const fresh = dedupe(jobs, await store.findExisting(userId, jobs));
    stats.after_dedupe = fresh.length;

    const { kept, dropped } = filterJobs(fresh, profile, { maxAgeDays: config.maxJobAgeDays });
    stats.after_filter = kept.length;
    log(`${name}: dropped by filters`, dropped);

    const toScore = capForScoring(kept, profile, config.maxJobsToScore);
    const { scored, errors: aiErrors, provider } = await scoreJobs(toScore, profile);
    errors.push(...aiErrors);
    stats.scored = scored.length;
    log(`${name}: scored ${scored.length} jobs (${provider})`);

    const { ranked, picks } = rankAndPick(scored, profile);
    stats.picked = picks.length;

    // Save every scored job (so it's never re-scored) with picks flagged
    await store.saveJobs(userId, ranked);

    const mail = await sendEmail(picks, { ...stats, errorCount: errors.length }, profile);
    log(mail.sent ? `${name}: email sent, "${mail.subject}"` : `${name}: email preview written to ${mail.preview}`);

    const status = errors.length ? 'partial' : 'success';
    await store.finishRun(runId, { ...stats, status, email_sent: mail.sent, errors });
    log(`${name}: done (${status}).`, stats);
    return { profile, stats, picks, ranked, dropped, errors };
  } catch (e) {
    errors.push({ source: 'run', error: e.message });
    await store.finishRun(runId, { ...stats, status: 'failed', errors }).catch(() => {});
    log(`${name}: run failed: ${e.message}`);
    return { profile, stats, picks: [], ranked: [], errors, failed: true };
  }
}

export async function run({ force = process.env.SARA_FORCE === '1' } = {}) {
  let store = createStore();
  if (config.mock) {
    const fx = await loadFixtures();
    store = createStore({ existingJobs: fx.already_seen || [] });
  }

  const due = await dueProfiles(store, force || config.mock);
  if (!due.length) {
    log('Nobody is due right now.');
    return { users: [], store };
  }
  log(`Working for ${due.length} ${due.length === 1 ? 'person' : 'people'}.`);

  const shared = await fetchShared(store, due);
  const users = [];
  for (const profile of due) users.push(await runForUser(store, profile, shared));
  return { users, store };
}

// Run when called directly (npm start / npm run dry-run)
if (import.meta.url === `file://${process.argv[1]}`) {
  run()
    .then(({ users }) => { if (users.some((u) => u.failed)) process.exitCode = 1; })
    .catch((e) => {
      console.error('Sara run failed:', e.message);
      process.exit(1);
    });
}
