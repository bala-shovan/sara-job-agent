// Free public remote-job boards. Each fetcher returns jobs in Sara's
// normalized shape:
// { source, external_id, url, title, company, location, remote_scope, is_remote,
//   salary_text, salary_min, salary_max, salary_currency, salary_period,
//   posted_at, description }
//
// Please respect each board's terms: Sara links back to the original post
// and never republishes full descriptions publicly.

import { fetchJson, stripHtml, toIso } from '../util.js';

// Remote OK: https://remoteok.com/api (first array item is a legal notice)
export async function fetchRemoteOk() {
  const data = await fetchJson('https://remoteok.com/api');
  return data
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
    }));
}

// Remotive: one request returns all current listings.
export async function fetchRemotive() {
  const data = await fetchJson('https://remotive.com/api/remote-jobs');
  return (data.jobs || []).map((j) => ({
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
  }));
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
  { name: 'bdjobs', fetch: fetchBdjobs, disabled: true },
];
