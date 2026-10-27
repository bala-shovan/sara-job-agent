// Company careers pages on Greenhouse, Ashby and Lever. These systems publish
// each company's open roles through free public endpoints (the same ones the
// company's own careers page uses).
//
// Sara doesn't know which system each watchlist company uses, so on the first
// run she tries likely slugs on all three and remembers what worked.

import { fetchJson, stripHtml, toIso, mapLimit, log } from '../util.js';

const ATS = {
  greenhouse: {
    url: (slug) => `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`,
    parse: (data, company, slug) => (data.jobs || []).map((j) => {
      const loc = j.location?.name || '';
      return {
        source: `greenhouse:${slug}`,
        external_id: String(j.id),
        url: j.absolute_url,
        title: j.title,
        company,
        location: loc,
        remote_scope: loc,
        is_remote: /remote|anywhere|worldwide/i.test(loc),
        salary_text: null,
        posted_at: toIso(j.first_published || j.updated_at),
        description: stripHtml(j.content),
      };
    }),
    isBoard: (data) => Array.isArray(data?.jobs),
  },
  ashby: {
    url: (slug) => `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`,
    parse: (data, company, slug) => (data.jobs || [])
      .filter((j) => j.isListed !== false)
      .map((j) => {
        const loc = [j.location, ...(j.secondaryLocations || []).map((l) => l.location)]
          .filter(Boolean).join('; ');
        return {
          source: `ashby:${slug}`,
          external_id: String(j.id),
          url: j.jobUrl || j.applyUrl,
          title: j.title,
          company,
          location: loc,
          remote_scope: j.isRemote ? `Remote (${loc})` : loc,
          is_remote: Boolean(j.isRemote) || /remote/i.test(j.workplaceType || ''),
          salary_text: j.compensation?.compensationTierSummary || null,
          posted_at: toIso(j.publishedAt),
          description: j.descriptionPlain || stripHtml(j.descriptionHtml),
        };
      }),
    isBoard: (data) => Array.isArray(data?.jobs),
  },
  lever: {
    url: (slug) => `https://api.lever.co/v0/postings/${slug}?mode=json`,
    parse: (data, company, slug) => (Array.isArray(data) ? data : []).map((j) => {
      const loc = j.categories?.location || (j.categories?.allLocations || []).join('; ') || '';
      const sal = j.salaryRange;
      return {
        source: `lever:${slug}`,
        external_id: String(j.id),
        url: j.hostedUrl || j.applyUrl,
        title: j.text,
        company,
        location: loc,
        remote_scope: loc,
        is_remote: j.workplaceType === 'remote' || /remote/i.test(loc),
        salary_text: sal ? `${sal.currency || ''} ${sal.min}–${sal.max} per ${String(sal.interval || 'year').replace('per-', '')}`.trim() : null,
        salary_min: sal?.min || null,
        salary_max: sal?.max || null,
        salary_currency: sal?.currency || null,
        salary_period: sal?.interval?.includes('month') ? 'month' : (sal ? 'year' : null),
        posted_at: toIso(j.createdAt),
        description: j.descriptionPlain || stripHtml(j.description),
      };
    }),
    isBoard: (data) => Array.isArray(data),
  },
};

export function slugCandidates(name) {
  const lower = name.toLowerCase().trim();
  const compact = lower.replace(/[^a-z0-9]/g, '');
  const hyphen = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return [...new Set([compact, hyphen, `${compact}hq`, `${compact}com`, `${compact}inc`])];
}

async function tryBoard(ats, slug) {
  try {
    const data = await fetchJson(ATS[ats].url(slug), { timeoutMs: 12000 });
    return ATS[ats].isBoard(data) ? data : null;
  } catch {
    return null;
  }
}

// Find which job system and slug a company uses.
async function detect(company) {
  for (const slug of slugCandidates(company.name)) {
    for (const ats of ['greenhouse', 'ashby', 'lever']) {
      const data = await tryBoard(ats, slug);
      // An empty Lever array is ambiguous (unknown slugs can return []), so
      // only accept Lever when it actually has postings.
      if (data && !(ats === 'lever' && data.length === 0)) return { ats, slug, data };
    }
  }
  return null;
}

// Fetch every active watchlist company. Returns jobs plus the ats/slug
// discoveries and errors to save back to the companies table.
export async function fetchWatchlist(companies) {
  const jobs = [];
  const updates = [];
  const errors = [];

  await mapLimit(companies.filter((c) => c.active !== false), 4, async (company) => {
    try {
      let { ats, slug } = company;
      let data = null;

      if (ATS[ats] && slug) {
        data = await tryBoard(ats, slug);
        if (!data) errors.push({ source: `${ats}:${slug}`, error: `${company.name}: board not reachable, will re-detect next run` });
        if (!data) updates.push({ id: company.id, ats: 'unknown', slug: null });
      } else if (ats === 'unknown' || !ats) {
        const found = await detect(company);
        if (found) {
          ({ ats, slug, data } = found);
          log(`Detected ${company.name} on ${ats} (${slug})`);
        } else {
          ats = 'other';
          errors.push({ source: 'watchlist', error: `${company.name}: not on Greenhouse, Ashby or Lever. Add it manually or remove it.` });
        }
        updates.push({ id: company.id, ats, slug: slug || null });
      }

      if (data) jobs.push(...ATS[ats].parse(data, company.name, slug));
      updates.push({ id: company.id, last_checked_at: new Date().toISOString() });
    } catch (e) {
      errors.push({ source: `watchlist:${company.name}`, error: e.message });
    }
  });

  return { jobs, updates, errors };
}
