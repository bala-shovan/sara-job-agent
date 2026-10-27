// Step 6: AI scoring. Sends small batches of jobs plus the candidate profile
// to the model and asks for strict JSON back. Gemini first; Groq if Gemini
// fails; a keyword heuristic if both fail, so the morning email still goes out.

import { readFile } from 'node:fs/promises';
import { config } from './config.js';
import { truncate, log } from './util.js';

const FAMILIES = ['pm', 'support_engineer', 'support_lead', 'csm', 'other'];

let fileProfileCache;
// "About you" comes from the dashboard (profile.candidate_profile). The
// candidate-profile.md file is only a fallback for older setups and tests.
export async function candidateProfile(profile) {
  if (profile?.candidate_profile?.trim()) return profile.candidate_profile.trim();
  if (!fileProfileCache) {
    fileProfileCache = await readFile(new URL('../candidate-profile.md', import.meta.url), 'utf8');
  }
  return fileProfileCache;
}

const list = (a = []) => a.filter(Boolean).join(', ');

export function buildPrompt(profileText, jobs, profile) {
  const jobList = jobs.map((j, i) => ({
    id: i,
    title: j.title,
    company: j.company,
    location: j.location,
    remote: j.is_remote,
    pay: j.salary_text || 'not listed',
    description: truncate(j.description, config.descriptionCharsForAi),
  }));

  const roles = [...(profile?.role_families || [])].sort((a, b) => a.priority - b.priority);
  const roleText = list(roles.map((r) => r.label)) || 'the roles described by the candidate';
  const families = list(roles.map((r) => r.family));
  const seniority = list(profile?.seniority) || 'mid, senior or lead';
  const regions = list(profile?.locations?.remote_allowed) || 'worldwide';
  const cities = list(profile?.locations?.onsite_cities);
  const usOnly = profile?.exclusions?.drop_us_only_remote !== false;

  return `You are Sara, a careful job-matching assistant. Score how well each job fits this candidate.

CANDIDATE
${profileText}

SCORING RUBRIC (total 0-100)
- Role match (0-35): title and duties match one of: ${roleText}.
- Experience and seniority (0-25): fits the candidate's experience above; target level is ${seniority}.
- Domain fit (0-20): matches industries and products the candidate has worked in, as described above.
- Location eligibility (0-20): remote and open to candidates in ${regions}${cities ? `, or on-site/hybrid in ${cities}` : ''}.${usOnly ? ' A remote job limited to US residents or requiring US work authorization gets 0 here and us_only = true.' : ''}

Be strict and honest. Do not inflate scores. Base every judgment only on the job text given.

JOBS
${JSON.stringify(jobList, null, 1)}

Reply with JSON only, no prose, in exactly this shape:
{"results":[{"id":0,"role_family":"${families ? families.replace(/, /g, '|') + '|other' : 'other'}","fit_score":0,"why_fit":"max 2 short sentences on why it fits this candidate","red_flags":"short text, or empty string","us_only":false}]}`;
}

// Google retires Gemini models over time. If the configured model is gone
// (HTTP 404), Sara asks the API which Flash models exist and switches to the
// newest one for the rest of the run, so a retirement never breaks scoring.
let geminiModel = null;

export function pickFlashModel(models) {
  const usable = models
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
    .filter((id) => /^gemini-[\d.]+-flash(-lite)?$/.test(id)); // stable Flash ids only, no previews
  const version = (id) => parseFloat(id.match(/gemini-([\d.]+)/)[1]);
  // Newest version first; at equal version prefer Flash over Flash-Lite
  usable.sort((a, b) => version(b) - version(a) || (a.includes('lite') ? 1 : 0) - (b.includes('lite') ? 1 : 0));
  return usable[0] || null;
}

async function discoverGeminiModel() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
    headers: { 'x-goog-api-key': config.geminiApiKey },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Gemini model list HTTP ${res.status}`);
  return pickFlashModel((await res.json()).models || []);
}

async function geminiRequest(model, prompt) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    // Key goes in a header, not the URL, so it never shows up in logs
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.geminiApiKey },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
    signal: AbortSignal.timeout(90000),
  });
}

async function callGemini(prompt) {
  geminiModel ||= config.geminiModel;
  let res = await geminiRequest(geminiModel, prompt);
  if (res.status === 404) {
    const replacement = await discoverGeminiModel();
    if (replacement && replacement !== geminiModel) {
      log(`Gemini model ${geminiModel} is retired; switching to ${replacement}. Set GEMINI_MODEL=${replacement} to skip this check.`);
      geminiModel = replacement;
      res = await geminiRequest(geminiModel, prompt);
    }
  }
  if (!res.ok) throw new Error(`Gemini (${geminiModel}) HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  return JSON.parse(text);
}

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.groqApiKey}` },
    body: JSON.stringify({
      model: config.groqModel,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content || '{}');
}

// Keyword fallback: used in mock mode without keys, or if every AI call fails.
export function heuristicScore(job, profile) {
  const text = `${job.title} ${job.description || ''}`.toLowerCase();
  let score = 45;
  const domain = ['saas', 'b2b', 'logistics', 'delivery', 'fleet', 'route', 'content', 'martech', 'cms', 'ai ', 'llm', 'api'];
  score += Math.min(20, domain.filter((w) => text.includes(w)).length * 4);
  if (/senior|lead|sr\.?\b/.test(job.title.toLowerCase())) score += 5;
  if (/worldwide|anywhere|apac|bangladesh|dhaka/i.test(`${job.location} ${job.remote_scope}`)) score += 10;
  return {
    role_family: job.role_family,
    fit_score: Math.min(100, score),
    why_fit: 'Scored by keyword match (AI scoring was unavailable for this run).',
    red_flags: '',
    us_only: false,
  };
}

export function sanitize(result, job) {
  const score = Math.max(0, Math.min(100, Math.round(Number(result?.fit_score) || 0)));
  return {
    role_family: FAMILIES.includes(result?.role_family) ? result.role_family : job.role_family,
    fit_score: score,
    why_fit: String(result?.why_fit || '').slice(0, 400),
    red_flags: String(result?.red_flags || '').slice(0, 300),
    us_only: Boolean(result?.us_only),
  };
}

export async function scoreJobs(jobs, profile) {
  const errors = [];
  const scored = [];
  const hasAi = Boolean(config.geminiApiKey || config.groqApiKey);
  const profileText = await candidateProfile(profile);
  let provider = hasAi ? 'ai' : 'heuristic';

  for (let i = 0; i < jobs.length; i += config.scoringBatchSize) {
    const batch = jobs.slice(i, i + config.scoringBatchSize);
    let results = null;

    if (hasAi) {
      const prompt = buildPrompt(profileText, batch, profile);
      const attempts = [
        config.geminiApiKey && ['gemini', callGemini],
        config.groqApiKey && ['groq', callGroq],
      ].filter(Boolean);
      for (const [name, call] of attempts) {
        try {
          results = (await call(prompt)).results;
          if (!Array.isArray(results)) throw new Error('response had no results array');
          break;
        } catch (e) {
          errors.push({ source: `ai:${name}`, error: e.message.slice(0, 300) });
          log(`AI scoring with ${name} failed: ${e.message.slice(0, 120)}`);
          results = null;
        }
      }
      // Stay well under free-tier requests-per-minute limits
      if (i + config.scoringBatchSize < jobs.length) await new Promise((r) => setTimeout(r, 7000));
    }

    batch.forEach((job, idx) => {
      const r = results?.find((x) => Number(x.id) === idx);
      if (!results) provider = hasAi ? 'partial-heuristic' : 'heuristic';
      scored.push({ ...job, ...(r ? sanitize(r, job) : heuristicScore(job, profile)) });
    });
  }
  return { scored, errors, provider };
}
