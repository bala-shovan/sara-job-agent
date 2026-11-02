// Free public remote-job boards. Each fetcher returns jobs in Sara's
// normalized shape:
// { source, external_id, url, title, company, location, remote_scope, is_remote,
//   salary_text, salary_min, salary_max, salary_currency, salary_period,
//   posted_at, description }
//
// Please respect each board's terms: Sara links back to the original post
// and never republishes full descriptions publicly.

import { fetchJson, fetchText, parseRss, stripHtml, toIso } from '../util.js';

// Searches that cover your roles on boards that support them
const SEARCHES = ['product manager', 'product owner', 'support engineer', 'technical support', 'customer support'];

const uniqueBy = (jobs) => [...new Map(jobs.map((j) => [`${j.source}|${j.external_id}`, j])).values()];

// Remote OK: https://remoteok.com/api (first array item is a legal notice)
export async function fetchRemoteOk() {
  // The main feed only shows the newest ~100 jobs; tag feeds reach further back
  const feeds = ['https://remoteok.com/api', 'https://remoteok.com/api?tag=product', 'https://remoteok.com/api?tag=support'];
  const data = [];
  for (const url of feeds) {
    try { data.push(...(await fetchJson(url))); } catch (e) { if (url === feeds[0]) throw e; }
  }
  return uniqueBy(data
    .filter((j) => j && j.id && j.position)
    .map((j) => ({
      source: 'remoteok',
      external_id: String(j.id),
      url: j.apply_url || j.url,
      title: j.position,
      company: j.company || 'Unknown',
      location: j.location || 'Remote',
      remote_scope: j.location || 'Remote',
      is_remote: true,
      salary_text: j.salary_min ? `$${j.salary_min}–$${j.salary_max} per year` : null,
      salary_min: j.salary_min || null,
      salary_max: j.salary_max || null,
      salary_currency: j.salary_min ? 'USD' : null,
      salary_period: j.salary_min ? 'year' : null,
      posted_at: toIso(j.epoch || j.date),
      description: stripHtml(j.description),
    })));
}

// Remotive: the general feed is short, so also ask for the product and
// customer support categories.
export async function fetchRemotive() {
  const urls = ['https://remotive.com/api/remote-jobs', 'https://remotive.com/api/remote-jobs?category=product', 'https://remotive.com/api/remote-jobs?category=customer-support'];
  const all = [];
  for (const url of urls) {
    try { all.push(...((await fetchJson(url)).jobs || [])); } catch (e) { if (url === urls[0]) throw e; }
  }
  return uniqueBy(all.map((j) => ({
    source: 'remotive',
    external_id: String(j.id),
    url: j.url,
    title: j.title,
    company: j.company_name || 'Unknown',
    location: j.candidate_required_location || 'Remote',
    remote_scope: j.candidate_required_location || 'Remote',
    is_remote: true,
    salary_text: j.salary || null,
    posted_at: toIso(j.publication_date),
    description: stripHtml(j.description),
  })));
}

// Himalayas: paginated, 20 jobs per page.
export async function fetchHimalayas({ pages = 5 } = {}) {
  const jobs = [];
  for (let p = 0; p < pages; p++) {
    const data = await fetchJson(`https://himalayas.app/jobs/api?limit=20&offset=${p * 20}`);
    const batch = data.jobs || [];
    for (const j of batch) {
      const scope = Array.isArray(j.locationRestrictions) && j.locationRestrictions.length
        ? j.locationRestrictions.join(', ')
        : 'Worldwide';
      jobs.push({
        source: 'himalayas',
        external_id: String(j.guid || j.applicationLink),
        url: j.applicationLink || j.guid,
        title: j.title,
        company: j.companyName || 'Unknown',
        location: scope,
        remote_scope: scope,
        is_remote: true,
        salary_text: j.minSalary ? `${j.currency || ''} ${j.minSalary}–${j.maxSalary} per year`.trim() : null,
        salary_min: j.minSalary || null,
        salary_max: j.maxSalary || null,
        salary_currency: j.currency || null,
        salary_period: j.minSalary ? 'year' : null,
        posted_at: toIso(j.pubDate),
        description: stripHtml(j.description || j.excerpt),
        seniority: j.seniority || null,
      });
    }
    if (batch.length < 20) break;
  }
  return jobs;
}

// Jobicy: public remote-jobs API, searched by keyword.
// https://jobicy.com/jobs-rss-feed (API docs). Asks for light use: one call per search.
export async function fetchJobicy() {
  const all = [];
  for (const tag of SEARCHES) {
    const data = await fetchJson(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(tag)}`);
    for (const j of data.jobs || []) {
      const geo = j.jobGeo || 'Anywhere';
      all.push({
        source: 'jobicy',
        external_id: String(j.id),
        url: j.url,
        title: stripHtml(j.jobTitle),
        company: j.companyName || 'Unknown',
        location: geo,
        remote_scope: geo,
        is_remote: true,
        salary_text: j.annualSalaryMin ? `${j.salaryCurrency || 'USD'} ${j.annualSalaryMin}–${j.annualSalaryMax} per year` : null,
        salary_min: Number(j.annualSalaryMin) || null,
        salary_max: Number(j.annualSalaryMax) || null,
        salary_currency: j.salaryCurrency || (j.annualSalaryMin ? 'USD' : null),
        salary_period: j.annualSalaryMin ? 'year' : null,
        posted_at: toIso(j.pubDate),
        description: stripHtml(j.jobDescription || j.jobExcerpt),
        seniority: j.jobLevel || null,
      });
    }
  }
  return uniqueBy(all);
}

// We Work Remotely: public RSS feeds per category.
export async function fetchWeWorkRemotely() {
  const feeds = [
    'https://weworkremotely.com/categories/remote-product-jobs.rss',
    'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',
  ];
  const all = [];
  for (const feed of feeds) {
    for (const item of parseRss(await fetchText(feed))) {
      // Titles look like "Company: Job title"
      const [company, ...rest] = stripHtml(item.title || '').split(':');
      const title = rest.join(':').trim() || company;
      const region = stripHtml(item.region || item.country || 'Anywhere in the World');
      all.push({
        source: 'weworkremotely',
        external_id: item.guid || item.link,
        url: item.link || item.guid,
        title,
        company: rest.length ? company.trim() : 'Unknown',
        location: region,
        remote_scope: region,
        is_remote: true,
        salary_text: null,
        posted_at: toIso(item.pubDate),
        description: stripHtml(item.description),
      });
    }
  }
  return uniqueBy(all);
}

// Working Nomads: public JSON of current remote jobs.
export async function fetchWorkingNomads() {
  const data = await fetchJson('https://www.workingnomads.com/api/exposed_jobs/');
  return uniqueBy((Array.isArray(data) ? data : []).map((j) => {
    const loc = j.location || 'Anywhere';
    return {
      source: 'workingnomads',
      external_id: j.url,
      url: j.url,
      title: j.title,
      company: j.company_name || 'Unknown',
      location: loc,
      remote_scope: loc,
      is_remote: true,
      salary_text: null,
      posted_at: toIso(j.pub_date),
      description: stripHtml(j.description),
    };
  }));
}

// Real Work From Anywhere: remote jobs open worldwide, as RSS.
export async function fetchRealWorkFromAnywhere() {
  const items = parseRss(await fetchText('https://www.realworkfromanywhere.com/rss.xml'));
  return uniqueBy(items.map((item) => ({
    source: 'realworkfromanywhere',
    external_id: item.guid || item.link,
    url: item.link || item.guid,
    title: stripHtml(item.title || ''),
    company: stripHtml(item['dc:creator'] || item.company || item.author || 'Unknown'),
    location: 'Worldwide',
    remote_scope: 'Worldwide',
    is_remote: true,
    salary_text: null,
    posted_at: toIso(item.pubDate),
    description: stripHtml(item.description),
  })));
}

// Jobspresso: hand-picked remote jobs, as RSS.
export async function fetchJobspresso() {
  const items = parseRss(await fetchText('https://jobspresso.co/feed/?post_type=job_listing'));
  return uniqueBy(items.map((item) => {
    const loc = stripHtml(item['job_listing:location'] || 'Remote');
    return {
      source: 'jobspresso',
      external_id: item.guid || item.link,
      url: item.link || item.guid,
      title: stripHtml(item.title || ''),
      company: stripHtml(item['job_listing:company'] || 'Unknown'),
      location: loc,
      remote_scope: loc,
      is_remote: true,
      salary_text: null,
      posted_at: toIso(item.pubDate),
      description: stripHtml(item['content:encoded'] || item.description),
    };
  }));
}

// Upwork closed its public job RSS feeds in 2024 and its API needs an
// approved developer key, so it isn't a source here.

// BDJobs has no public API or feed. Rather than guess at its page structure,
// this source stays off until we inspect the public search pages together
// (or switch to reading BDJobs email alerts from Gmail in Phase 3).
export async function fetchBdjobs() {
  return [];
}

export const BOARD_SOURCES = [
  { name: 'remoteok', fetch: fetchRemoteOk },
  { name: 'remotive', fetch: fetchRemotive },
  { name: 'himalayas', fetch: fetchHimalayas },
  { name: 'jobicy', fetch: fetchJobicy },
  { name: 'weworkremotely', fetch: fetchWeWorkRemotely },
  { name: 'workingnomads', fetch: fetchWorkingNomads },
  { name: 'realworkfromanywhere', fetch: fetchRealWorkFromAnywhere },
  { name: 'jobspresso', fetch: fetchJobspresso },
  { name: 'bdjobs', fetch: fetchBdjobs, disabled: true },
];
