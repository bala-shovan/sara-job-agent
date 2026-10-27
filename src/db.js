// Storage. In production this is Supabase (Postgres), shared by everyone who
// has hired a Sara: every row carries a user_id. In mock mode it is an
// in-memory store with one sample user, so Sara can be tested without
// touching real data.

import { createClient } from '@supabase/supabase-js';
import { config, defaultProfile } from './config.js';
import { normKey } from './util.js';

const JOB_COLUMNS = ['source', 'external_id', 'url', 'title', 'company', 'location', 'remote_scope',
  'salary_text', 'posted_at', 'description', 'role_family', 'fit_score', 'final_score',
  'why_fit', 'red_flags', 'is_pick'];

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k] ?? null]));
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

class SupabaseStore {
  constructor() {
    if (!config.supabaseUrl || !config.supabaseServiceKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set (or run with SARA_MOCK=1)');
    }
    // The service key bypasses Row Level Security, so every query below
    // filters by user_id itself.
    this.db = createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false } });
  }

  async check(promise, what) {
    const { data, error } = await promise;
    if (error) throw new Error(`${what}: ${error.message}`);
    return data;
  }

  // Everyone who has hired a Sara
  getProfiles() {
    return this.check(this.db.from('profile').select('*').not('hired_at', 'is', null), 'Reading profiles');
  }

  runsSince(userId, iso) {
    return this.check(this.db.from('runs').select('status').eq('user_id', userId).gte('started_at', iso), 'Reading runs');
  }

  getCompanies(userIds) {
    return this.check(this.db.from('companies').select('*').in('user_id', userIds).eq('active', true), 'Reading companies');
  }

  // Job-system discoveries are shared: if one person's Sara learns that a
  // company is on Ashby, everyone's watchlist entry for it is updated.
  async updateCompaniesByName(name, fields) {
    await this.check(this.db.from('companies').update(fields).ilike('name', name), `Updating company ${name}`);
  }

  // Which of these jobs has this user's Sara already seen? Matches by URL,
  // by source id, and by company + title (the same role reposted).
  async findExisting(userId, jobs) {
    const urls = new Set();
    const ids = new Set();
    for (const part of chunk(jobs.map((j) => j.url), 100)) {
      const data = await this.check(this.db.from('jobs').select('url').eq('user_id', userId).in('url', part), 'Checking existing jobs');
      data.forEach((r) => urls.add(r.url));
    }
    for (const part of chunk(jobs.map((j) => j.external_id).filter(Boolean), 100)) {
      const data = await this.check(this.db.from('jobs').select('source, external_id').eq('user_id', userId).in('external_id', part), 'Checking existing jobs');
      data.forEach((r) => ids.add(`${r.source}|${r.external_id}`));
    }
    const since = new Date(Date.now() - 120 * 86400000).toISOString();
    const data = await this.check(this.db.from('jobs').select('company, title').eq('user_id', userId).gte('found_at', since), 'Checking existing jobs');
    const titles = new Set(data.map((r) => `${normKey(r.company)}|${normKey(r.title)}`));
    return { urls, ids, titles };
  }

  async saveJobs(userId, jobs) {
    const rows = jobs.map((j) => ({ ...pick(j, JOB_COLUMNS), user_id: userId }));
    for (const part of chunk(rows, 50)) {
      await this.check(this.db.from('jobs').upsert(part, { onConflict: 'user_id,url', ignoreDuplicates: true }), 'Saving jobs');
    }
  }

  async startRun(userId) {
    const data = await this.check(this.db.from('runs').insert({ user_id: userId }).select('id').single(), 'Starting run log');
    return data.id;
  }

  async finishRun(id, fields) {
    await this.check(this.db.from('runs').update({ ...fields, finished_at: new Date().toISOString() }).eq('id', id), 'Finishing run log');
  }
}

class MemoryStore {
  constructor({ existingJobs = [], profiles } = {}) {
    this.profiles = profiles || [{ ...defaultProfile, user_id: 'mock-user', display_name: 'Bala' }];
    this.jobs = existingJobs.map((j) => ({ user_id: this.profiles[0].user_id, ...j }));
    this.runs = [];
    this.companies = [];
  }
  async getProfiles() { return this.profiles; }
  async runsSince(userId) { return this.runs.filter((r) => r.user_id === userId); }
  async getCompanies() { return this.companies; }
  async updateCompaniesByName() {}
  async findExisting(userId) {
    const mine = this.jobs.filter((j) => j.user_id === userId);
    return {
      urls: new Set(mine.map((j) => j.url)),
      ids: new Set(mine.map((j) => `${j.source}|${j.external_id}`)),
      titles: new Set(mine.map((j) => `${normKey(j.company)}|${normKey(j.title)}`)),
    };
  }
  async saveJobs(userId, jobs) { this.jobs.push(...jobs.map((j) => ({ ...pick(j, JOB_COLUMNS), user_id: userId }))); }
  async startRun(userId) { this.runs.push({ id: this.runs.length + 1, user_id: userId, status: 'running' }); return this.runs.length; }
  async finishRun(id, fields) { Object.assign(this.runs[id - 1], fields); }
}

export function createStore(options) {
  return config.mock ? new MemoryStore(options) : new SupabaseStore();
}
