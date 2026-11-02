// End-to-end test of Sara's pipeline on fictional sample jobs.
// Runs in mock mode: no network, no database, no email, no AI keys
// (the keyword scorer stands in for the AI).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

process.env.SARA_MOCK = '1';
for (const k of ['GEMINI_API_KEY', 'GROQ_API_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD']) delete process.env[k];

const { run } = await import('../src/index.js');
const { monthlyUsd, classifyTitle } = await import('../src/filter.js');
const { sanitize } = await import('../src/score.js');
const { defaultProfile } = await import('../src/config.js');

const fixtures = JSON.parse(await readFile(new URL('../fixtures/sample-jobs.json', import.meta.url), 'utf8'));
const all = await run();
const result = { ...all.users[0], store: all.store };
const rankedUrls = new Set(result.ranked.map((j) => j.url));
const pickUrls = new Set(result.picks.map((j) => j.url));

for (const job of fixtures.jobs) {
  test(`${job.expect} — ${job.title} @ ${job.company}`, () => {
    if (job.expect.startsWith('PICK')) assert.ok(pickUrls.has(job.url), 'expected to be picked');
    if (job.expect.startsWith('CANDIDATE')) assert.ok(rankedUrls.has(job.url), 'expected to reach scoring');
    if (job.expect.startsWith('BELOW')) {
      assert.ok(rankedUrls.has(job.url), 'expected to reach scoring');
      assert.ok(!pickUrls.has(job.url), 'expected to be dropped for a match below the minimum');
    }
    if (job.expect.startsWith('DROP') || job.expect.startsWith('DEDUPE')) {
      assert.ok(!rankedUrls.has(job.url), 'expected to be filtered out before scoring');
    }
  });
}

test('each list stays within its picks (5 Product + 5 Technical Support)', () => {
  for (const g of defaultProfile.pick_groups) {
    const n = result.picks.filter((p) => g.families.includes(p.role_family)).length;
    assert.ok(n <= g.picks, `${g.label}: ${n} picks`);
  }
});

test('every pick is at least a 75% match, best first within its list', () => {
  for (const g of defaultProfile.pick_groups) {
    const scores = result.picks.filter((p) => g.families.includes(p.role_family)).map((p) => p.fit_score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  }
  assert.ok(result.picks.every((p) => p.fit_score >= 75));
});

test('reads the years of experience a posting asks for', async () => {
  const { requiredYears } = await import('../src/filter.js');
  assert.equal(requiredYears('5+ years of experience in support'), 5);
  assert.equal(requiredYears('3-5 years experience with SaaS'), 3);
  assert.equal(requiredYears('at least seven years of technical support experience'), 7);
  assert.equal(requiredYears('2+ years in product and 5+ years overall experience'), 5);
  assert.equal(requiredYears('Founded 10 years ago, we are growing'), null);
});

test('RSS job feeds are read without extra libraries', async () => {
  const { parseRss } = await import('../src/util.js');
  const [item] = parseRss('<rss><channel><item><title><![CDATA[Acme: Senior Support Engineer]]></title><region>Anywhere in the World</region><link>https://example.com/1</link></item></channel></rss>');
  assert.equal(item.title, 'Acme: Senior Support Engineer');
  assert.equal(item.region, 'Anywhere in the World');
  assert.equal(item.link, 'https://example.com/1');
});

test('a busy list cannot use the whole AI budget', async () => {
  const { capForScoring } = await import('../src/filter.js');
  const jobs = Array.from({ length: 30 }, (_, i) => ({ url: `p${i}`, role_family: 'pm' }))
    .concat(Array.from({ length: 30 }, (_, i) => ({ url: `s${i}`, role_family: 'support_engineer' })));
  const chosen = capForScoring(jobs, defaultProfile, 20);
  assert.equal(chosen.filter((j) => j.role_family === 'pm').length, 10);
  assert.equal(chosen.filter((j) => j.role_family === 'support_engineer').length, 10);
});

test('apply links come from the source, never the AI', () => {
  for (const p of result.picks) assert.ok(fixtures.jobs.some((j) => j.url === p.url));
});

test('run log records counts and email preview', () => {
  const runLog = result.store.runs[0];
  assert.equal(runLog.user_id, 'mock-user');
  assert.equal(runLog.fetched, fixtures.jobs.length);
  assert.equal(runLog.picked, result.picks.length);
  assert.equal(runLog.email_sent, false);
});

test('monthly pay parsing', () => {
  assert.equal(monthlyUsd({ salary_text: '$1,200 per month' }), 1200);
  assert.equal(monthlyUsd({ salary_max: 96000, salary_period: 'year', salary_currency: 'USD' }), 8000);
  assert.equal(monthlyUsd({ salary_text: 'BDT 240,000 per month' }), 2000);
  assert.equal(monthlyUsd({ salary_text: 'Competitive' }), null);
});

test('role family priority: product titles win', () => {
  assert.equal(classifyTitle('Product Support Engineer', defaultProfile), 'support_engineer');
  assert.equal(classifyTitle('Technical Product Manager', defaultProfile), 'pm');
  assert.equal(classifyTitle('Senior Customer Success Manager', defaultProfile), 'csm');
  assert.equal(classifyTitle('Data Scientist', defaultProfile), null);
});

test('AI output is clamped and validated', () => {
  const s = sanitize({ fit_score: 140, role_family: 'astronaut', why_fit: 'x' }, { role_family: 'pm' });
  assert.equal(s.fit_score, 100);
  assert.equal(s.role_family, 'pm');
});

test('picks the newest stable Gemini Flash model when one is retired', async () => {
  const { pickFlashModel } = await import('../src/score.js');
  const gen = ['generateContent'];
  const models = [
    { name: 'models/gemini-3.6-flash', supportedGenerationMethods: gen },
    { name: 'models/gemini-3.8-flash', supportedGenerationMethods: gen },
    { name: 'models/gemini-3.8-flash-lite', supportedGenerationMethods: gen },
    { name: 'models/gemini-3.9-flash-preview-11-2026', supportedGenerationMethods: gen },
    { name: 'models/gemini-3.8-pro', supportedGenerationMethods: gen },
    { name: 'models/text-embedding-005', supportedGenerationMethods: ['embedContent'] },
  ];
  assert.equal(pickFlashModel(models), 'gemini-3.8-flash');
  assert.equal(pickFlashModel([]), null);
});
