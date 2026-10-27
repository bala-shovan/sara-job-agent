// Small helpers shared by every part of Sara.

export function stripHtml(html = '') {
  return String(html)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>|<\/p>|<\/li>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

export function toIso(value) {
  if (value === null || value === undefined || value === '') return null;
  // Unix seconds vs milliseconds vs ISO string
  const d = typeof value === 'number'
    ? new Date(value < 1e12 ? value * 1000 : value)
    : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function normKey(text = '') {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function truncate(text = '', max = 1500) {
  const s = String(text || '');
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// fetch with a timeout and a friendly User-Agent. Throws on non-2xx.
export async function fetchJson(url, { timeoutMs = 20000, headers = {}, ...opts } = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: { 'User-Agent': 'sara-job-agent (personal job search bot)', Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${url}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Run async work over a list with limited concurrency (be polite to job sites).
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export function log(...args) {
  console.log(`[sara ${new Date().toISOString().slice(11, 19)}]`, ...args);
}
