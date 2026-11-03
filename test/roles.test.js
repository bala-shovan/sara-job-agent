// Role suggestions, search and custom roles used when hiring Sara, plus
// resume text cleanup. Pure functions from the dashboard, no browser needed.

import { test } from 'node:test';
import assert from 'node:assert/strict';

const { suggestRoles, searchRoles, customRole, ROLE_CATALOG } = await import('../dashboard/lib/roles.js');
const { cleanResumeText } = await import('../dashboard/lib/resume.js');
const { sanitize } = await import('../src/score.js');

test('suggests roles from experience text', () => {
  const pm = suggestRoles('Product manager for 4 years. Wrote PRDs, owned the roadmap and backlog, ran Scrum with engineers.');
  assert.equal(pm[0].family, 'pm');
  const data = suggestRoles('Data analyst building dashboards in Tableau and Power BI; heavy SQL and Excel reporting for finance teams.');
  assert.equal(data[0].family, 'data_analyst');
  const designer = suggestRoles('Designer working in Figma: wireframes, prototypes and a design system, backed by user research.');
  assert.equal(designer[0].family, 'product_designer');
});

test('no suggestions from too little text, and none already chosen', () => {
  assert.deepEqual(suggestRoles('hi'), []);
  const s = suggestRoles('Product manager, roadmap, backlog, PRDs, user stories and Scrum ceremonies.', ['pm']);
  assert.ok(!s.some((r) => r.family === 'pm'));
});

test('search finds roles by name or title phrase', () => {
  assert.equal(searchRoles('recruit')[0].family, 'recruiter');
  assert.ok(searchRoles('ux').some((r) => r.family === 'product_designer'));
  assert.ok(searchRoles('devops').some((r) => r.family === 'devops'));
  assert.deepEqual(searchRoles(''), []);
});

test('anyone can add their own role', () => {
  const r = customRole('  veterinary   nurse ');
  assert.equal(r.family, 'custom_veterinary_nurse');
  assert.equal(r.label, 'Veterinary Nurse');
  assert.deepEqual(r.keywords, ['veterinary nurse']);
});

test('catalog families are unique', () => {
  const families = ROLE_CATALOG.map((r) => r.family);
  assert.equal(new Set(families).size, families.length);
});

test('resume text loses emails and phone numbers', () => {
  const t = cleanResumeText('Jane Doe\njane.doe@example.com | +880 1712-345678\nProduct Manager, 2021 - 2024');
  assert.ok(!t.includes('@'));
  assert.ok(!t.includes('1712'));
  assert.ok(t.includes('2021 - 2024'), 'years are kept');
});

test('AI may file a job under any of the person\'s own roles', () => {
  const families = ['data_analyst', 'custom_veterinary_nurse', 'other'];
  assert.equal(sanitize({ fit_score: 80, role_family: 'custom_veterinary_nurse' }, { role_family: 'data_analyst' }, families).role_family, 'custom_veterinary_nurse');
  assert.equal(sanitize({ fit_score: 80, role_family: 'astronaut' }, { role_family: 'data_analyst' }, families).role_family, 'data_analyst');
});

test('local phone formats are removed too', () => {
  const t = cleanResumeText('Call 01712-345678 or (02) 555-1234 or 415 555 0199. Led support 2016 – 2023.');
  assert.ok(!/1712|555/.test(t), t);
  assert.ok(t.includes('2016 – 2023'));
});
