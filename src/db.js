// Storage. In production this is Supabase (Postgres). In mock mode it is an
// in-memory store, so Sara can be tested without touching real data.

import { createClient } from '@supabase/supabase-js';
import { config, defaultProfile } from './config.js';
import { normKey } from './util.js';

const JOB_COLUMNS = ['source', 'external_id', 'url', 'title', 'company', 'location', 'remote_scope',
  'salary_text', 'posted_at', 'description', 'role_family', 'fit_score', 'final_score',
  'why_fit', 'red_flags', 'is_pick'];

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? null]));
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

function mergeUpdates(updates) {
  const byId = new Map();
  for (const u of updates) byId.set(u.id, { ...(byId.get(u.id) || {}), ...u });
  return [...byId.values()];
}

class SupabaseStore {
  constructor() {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set (or run with SARA_MOCK=1)');
    }
    this.db = createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false } });
  }

  async getProfile() {
    const { data, error } = await this.db.from('profile').select('*').eq('id', 1).maybeSingle();
    if (error) throw new Error(`Reading profile: ${error.message}`);
    return data || defaultProfile;
  }

  async getCompanies() {
    const { data, error } = await this.db.from('companies').select('*').eq('active', true);
    if (error) throw new Error(`Reading companies: ${error.message}`);
    return data;
  }

  async updateCompanies(updates) {
    for (const { id, ...fields } of mergeUpdates(updates)) {
      const { error } = await this.db.from('companies').update(fields).eq('id', id);
      if (error) throw new Error(`Updating company ${id}: ${error.message}`);
    }
  }

  // Which of these jobs has Sara already seen? Matches by URL, by source id,
  // and by company + title (the same role reposted with a new link).
  async findExisting(jobs) {
    const urls = new Set();
    const ids = new Set();
    for (const part of chunk(jobs.map((j) => j.url), 100)) {
      const { data, error } = await this.db.from('jobs').select('url').in('url', part);
      if (error) throw new Error(`Checking existing jobs: ${error.message}`);
      data.forEach((r) => urls.add(r.url));
    }
    for (const part of chunk(jobs.map((j) => j.external_id).filter(Boolean), 100)) {
      const { data, error } = await this.db.from('jobs').select('source, external_id').in('external_id', part);
      if (error) throw new Error(`Checking existing jobs: ${error.message}`);
      data.forEach((r) => ids.add(`${r.source}|${r.external_id}`));
    }
    const since = new Date(Date.now() - 120 * 86400000).toISOString();
    const { data, error } = await this.db.from('jobs').select('company, title').gte('found_at', since);
    if (error) throw new Error(`Checking existing jobs: ${error.message}`);
    const titles = new Set(data.map((r) => `${normKey(r.company)}|${normKey(r.title)}`));
    return { urls, ids, titles };
  }

  async saveJobs(jobs) {
    if (!jobs.length) return;
    const rows = jobs.map((j) => pick(j, JOB_COLUMNS));
    for (const part of chunk(rows, 50)) {
      const { error } = await this.db.from('jobs').upsert(part, { onConflict: 'url', ignoreDuplicates: true });
      if (error) throw new Error(`Saving jobs: ${error.message}`);
    }
  }

  async startRun() {
    const { data, error } = await this.db.from('runs').insert({}).select('id').single();
    if (error) throw new Error(`Starting run log: ${error.message}`);
    return data.id;
  }

  async finishRun(id, fields) {
    const { error } = await this.db.from('runs').update({ ...fields, finished_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(`Finishing run log: ${error.message}`);
  }
}

class MemoryStore {
  constructor({ existingJobs = [] } = {}) {
    this.jobs = [...existingJobs];
    this.runs = [];
    this.companies = [];
  }
  async getProfile() { return defaultProfile; }
  async getCompanies() { return this.companies; }
  async updateCompanies() {}
  async findExisting() {
    return {
      urls: new Set(this.jobs.map((j) => j.url)),
      ids: new Set(this.jobs.map((j) => `${j.source}|${j.external_id}`)),
      titles: new Set(this.jobs.map((j) => `${normKey(j.company)}|${normKey(j.title)}`)),
    };
  }
  async saveJobs(jobs) { this.jobs.push(...jobs.map((j) => pick(j, JOB_COLUMNS))); }
  async startRun() { this.runs.push({ id: this.runs.length + 1 }); return this.runs.length; }
  async finishRun(id, fields) { Object.assign(this.runs[id - 1], fields); }
}

export function createStore(options) {
  return config.mock ? new MemoryStore(options) : new SupabaseStore();
}
