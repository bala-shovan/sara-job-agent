// Sara's morning run, start to finish.
//   1. wake up (GitHub Actions)  2. fetch  3. normalize  4. dedupe
//   5. filter in code  6. score with AI  7. rank  8. pick top 5
//   9. save, log the run, email the picks

import { readFile } from 'node:fs/promises';
import { config } from './config.js';
import { createStore } from './db.js';
import { BOARD_SOURCES } from './sources/boards.js';
import { fetchWatchlist } from './sources/ats.js';
import { filterJobs, capForScoring } from './filter.js';
import { scoreJobs } from './score.js';
import { rankAndPick } from './rank.js';
import { sendEmail } from './email.js';
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

async function fetchAll(store, errors) {
  if (config.mock) {
    const fx = await loadFixtures();
    log(`Mock mode: loaded ${fx.jobs.length} sample jobs`);
    return { jobs: fx.jobs, seed: fx.already_seen || [] };
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

  const companies = await store.getCompanies();
  const watch = await fetchWatchlist(companies);
  log(`watchlist (${companies.length} companies): ${watch.jobs.length} jobs`);
  jobs.push(...watch.jobs);
  errors.push(...watch.errors);
  await store.updateCompanies(watch.updates).catch((e) => errors.push({ source: 'companies', error: e.message }));
  return { jobs };
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

export async function run() {
  const errors = [];
  let store = createStore();
  const stats = { fetched: 0, after_dedupe: 0, after_filter: 0, scored: 0, picked: 0 };

  // In mock mode, pre-seed "already seen" jobs to prove dedupe works
  if (config.mock) {
    const fx = await loadFixtures();
    store = createStore({ existingJobs: fx.already_seen || [] });
  }

  const runId = await store.startRun();
  try {
    const profile = await store.getProfile();

    const { jobs } = await fetchAll(store, errors);
    stats.fetched = jobs.length;

    const fresh = dedupe(jobs, await store.findExisting(jobs));
    stats.after_dedupe = fresh.length;

    const { kept, dropped } = filterJobs(fresh, profile, { maxAgeDays: config.maxJobAgeDays });
    stats.after_filter = kept.length;
    log('Dropped by filters:', dropped);

    const toScore = capForScoring(kept, profile, config.maxJobsToScore);
    const { scored, errors: aiErrors, provider } = await scoreJobs(toScore, profile);
    errors.push(...aiErrors);
    stats.scored = scored.length;
    log(`Scored ${scored.length} jobs (${provider})`);

    const { ranked, picks } = rankAndPick(scored, profile);
    stats.picked = picks.length;

    // Save every scored job (so it's never re-scored) with picks flagged
    await store.saveJobs(ranked);

    const mail = await sendEmail(picks, { ...stats, errorCount: errors.length }, profile);
    log(mail.sent ? `Email sent: "${mail.subject}"` : `Email preview written to ${mail.preview}: "${mail.subject}"`);

    const status = errors.length ? 'partial' : 'success';
    await store.finishRun(runId, { ...stats, status, email_sent: mail.sent, errors });
    log(`Done (${status}).`, stats);
    return { stats, picks, ranked, dropped, errors, store };
  } catch (e) {
    errors.push({ source: 'run', error: e.message });
    await store.finishRun(runId, { ...stats, status: 'failed', errors }).catch(() => {});
    throw e;
  }
}

// Run when called directly (npm start / npm run dry-run)
if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((e) => {
    console.error('Sara run failed:', e.message);
    process.exit(1);
  });
}
