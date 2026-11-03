'use client';

import { useState } from 'react';
import { DAYS, SENIORITY, hourLabel, timeZones, PRIORITY_BONUS } from '../lib/setup';
import { suggestRoles, searchRoles, customRole } from '../lib/roles';
import { readResume, RESUME_ACCEPT } from '../lib/resume';

// Upload a resume to fill in "Your experience". Read in the browser only.
function ResumeUpload({ draft, set }) {
  const [state, setState] = useState({ busy: false, note: '', error: '' });
  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (draft.candidate_profile.trim() && !window.confirm('Replace what\'s in "Your experience" with the text from your resume?')) return;
    setState({ busy: true, note: '', error: '' });
    try {
      const { text, trimmed } = await readResume(file);
      set({ candidate_profile: text });
      setState({ busy: false, error: '', note: `Filled in from ${file.name}${trimmed ? ' (shortened to fit)' : ''}. Phone numbers and emails were removed. Check it reads right, and edit anything.` });
    } catch (err) {
      setState({ busy: false, note: '', error: err.message || 'Couldn\'t read that file.' });
    }
  }
  return (
    <div className="resume-upload">
      <label className="btn" htmlFor="resume-file" aria-disabled={state.busy}>
        {state.busy ? 'Reading your resume…' : 'Upload your resume'}
      </label>
      <input id="resume-file" type="file" accept={RESUME_ACCEPT} onChange={onFile} disabled={state.busy} className="visually-hidden" />
      <span className="hint">PDF, Word (.docx) or text. Sara reads it in your browser and keeps only the text below.</span>
      {state.note && <p className="hint" role="status" style={{ margin: '8px 0 0' }}>{state.note}</p>}
      {state.error && <p className="hint hint-warn" role="alert" style={{ margin: '8px 0 0' }}>{state.error}</p>}
    </div>
  );
}

export function AboutYou({ draft, set }) {
  return (
    <>
    <div className="field">
      <label htmlFor="name">Your first name</label>
      <input id="name" autoComplete="given-name" value={draft.display_name} onChange={(e) => set({ display_name: e.target.value })} style={{ maxWidth: 320 }} />
    </div>
    <div className="field">
      <label htmlFor="about">Your experience</label>
      <p className="hint">
        Upload your resume, or paste a summary: roles, companies, what you shipped, tools you know, where you're based.
        Sara reads this to judge every job and to suggest roles for you. Leave out your phone number and address.
      </p>
      <ResumeUpload draft={draft} set={set} />
      <textarea
        id="about" className="tall" value={draft.candidate_profile}
        placeholder="Senior product manager, 6 years in B2B SaaS. Led payments and onboarding at a fintech, shipped an AI assistant. Based in Singapore, open to remote roles in APAC…"
        onChange={(e) => set({ candidate_profile: e.target.value })}
      />
      <p className="hint">{draft.candidate_profile.trim().split(/\s+/).filter(Boolean).length} words</p>
    </div>
    </>
  );
}

function RoleRow({ role, index, total, update, move, remove }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="role">
      <div className="role-main">
        <span className="role-check">
          <span>
            <strong>{role.label}</strong>
            <span className="hint">Priority {index + 1}{PRIORITY_BONUS[index] ? `, ranks +${PRIORITY_BONUS[index]}` : ''}</span>
          </span>
        </span>
        <span className="role-tools">
          <button type="button" className="btn btn-quiet" onClick={() => setOpen(!open)} aria-expanded={open}>Title phrases</button>
          <button type="button" className="btn btn-quiet" disabled={index === 0} onClick={() => move(-1)} aria-label={`Move ${role.label} up`}>Up</button>
          <button type="button" className="btn btn-quiet" disabled={index === total - 1} onClick={() => move(1)} aria-label={`Move ${role.label} down`}>Down</button>
          <button type="button" className="btn btn-quiet" onClick={remove} aria-label={`Remove ${role.label}`}>Remove</button>
        </span>
      </div>
      {open && (
        <div className="field" style={{ marginTop: 10 }}>
          <label htmlFor={`kw-${role.family}`}>A job title must contain one of these, comma-separated</label>
          <textarea id={`kw-${role.family}`} value={role.keywords} onChange={(e) => update({ keywords: e.target.value })} />
        </div>
      )}
    </li>
  );
}

// Pick roles: suggestions from the person's experience, a search across
// common roles, or any role they type
function RolePicker({ draft, set }) {
  const [query, setQuery] = useState('');
  const roles = draft.roles;
  const chosen = roles.map((r) => r.family);
  const add = (r) => {
    set({ roles: [...roles, { family: r.family, label: r.label, enabled: true, keywords: r.keywords.join(', ') }] });
    setQuery('');
  };
  const updateRole = (family, patch) => set({ roles: roles.map((r) => (r.family === family ? { ...r, ...patch } : r)) });
  const moveRole = (i, dir) => {
    const next = [...roles];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set({ roles: next });
  };
  const removeRole = (family) => set({ roles: roles.filter((r) => r.family !== family) });

  const suggested = suggestRoles(draft.candidate_profile, chosen);
  const results = searchRoles(query, chosen);
  const typed = query.trim();
  // Offer "add your own" only when nothing listed already covers what they typed
  const covered = results.some((r) => r.label.toLowerCase().includes(typed.toLowerCase()) || r.keywords.some((k) => k.includes(typed.toLowerCase())));
  const custom = typed.length >= 3 && !covered ? customRole(typed) : null;
  const customTaken = custom && chosen.includes(custom.family);

  return (
    <div className="field">
      <span className="label">Roles, highest priority first</span>
      <p className="hint">Sara searches every role you add. When she has to choose, higher-priority roles win.</p>

      {roles.length > 0 ? (
        <ul className="roles">
          {roles.map((r, i) => (
            <RoleRow
              key={r.family} role={r} index={i} total={roles.length}
              update={(patch) => updateRole(r.family, patch)} move={(dir) => moveRole(i, dir)} remove={() => removeRole(r.family)}
            />
          ))}
        </ul>
      ) : <p className="notice" style={{ margin: '6px 0 0' }}>No roles yet. Add one from the suggestions or search below.</p>}

      {suggested.length > 0 && (
        <div className="role-suggest">
          <span className="hint">Suggested from your experience</span>
          <div className="chips">
            {suggested.map((r) => (
              <button type="button" key={r.family} className="chip" onClick={() => add(r)}>+ {r.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="role-search">
        <label htmlFor="role-q" className="hint">Find a role</label>
        <input
          id="role-q" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off"
          placeholder="Search roles, e.g. data analyst, designer, recruiter"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (results[0]) add(results[0]); else if (custom && !customTaken) add(custom); } }}
        />
        {typed && (
          <ul className="role-results" role="listbox" aria-label="Matching roles">
            {results.map((r) => (
              <li key={r.family}>
                <button type="button" className="role-result" onClick={() => add(r)}>
                  <strong>{r.label}</strong> <span className="hint">{r.group}</span>
                </button>
              </li>
            ))}
            {custom && !customTaken && (
              <li>
                <button type="button" className="role-result" onClick={() => add(custom)}>
                  <strong>Add “{custom.label}”</strong> <span className="hint">Your own role: Sara looks for job titles containing “{custom.keywords[0]}”</span>
                </button>
              </li>
            )}
            {!results.length && !custom && <li className="hint" style={{ padding: '8px 10px' }}>Keep typing to search, or add your own role.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}

export function JobsYouWant({ draft, set }) {
  const toggleLevel = (v) => set({
    seniority: draft.seniority.includes(v) ? draft.seniority.filter((x) => x !== v) : [...draft.seniority, v],
  });

  return (
    <>
      <RolePicker draft={draft} set={set} />

      <fieldset className="field">
        <legend className="label">Levels</legend>
        <div className="chips">
          {SENIORITY.map((s) => (
            <button
              type="button" key={s.value} className="chip" aria-pressed={draft.seniority.includes(s.value)}
              onClick={() => toggleLevel(s.value)}
            >{s.label}</button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="remote">Remote: regions that can hire you</label>
        <input id="remote" value={draft.remote_allowed} onChange={(e) => set({ remote_allowed: e.target.value })} placeholder="worldwide, anywhere, apac, bangladesh" />
        <p className="hint">Comma-separated. Sara keeps remote jobs open to any of these.</p>
      </div>
      <div className="field">
        <label htmlFor="cities">On-site or hybrid: cities</label>
        <input id="cities" value={draft.onsite_cities} onChange={(e) => set({ onsite_cities: e.target.value })} placeholder="dhaka" />
      </div>
      <label className="toggle">
        <input type="checkbox" checked={draft.drop_us_only_remote} onChange={(e) => set({ drop_us_only_remote: e.target.checked })} />
        <span>Skip remote jobs open only to US residents or US work authorization</span>
      </label>

      <div className="field-row">
        <div className="field">
          <label htmlFor="pay">Minimum pay (USD per month)</label>
          <input id="pay" type="number" min="0" step="100" value={draft.min_monthly_usd} onChange={(e) => set({ min_monthly_usd: e.target.value })} />
          <p className="hint">Jobs that don't list pay are kept.</p>
        </div>
        <div className="field">
          <label htmlFor="skip">Also skip titles containing</label>
          <input id="skip" value={draft.extra_skip} onChange={(e) => set({ extra_skip: e.target.value })} placeholder="contract, part-time" />
          <p className="hint">Optional. Interns are always skipped.</p>
        </div>
      </div>
    </>
  );
}

export function Alerts({ draft, set }) {
  const toggleDay = (n) => set({
    run_days: draft.run_days.includes(n) ? draft.run_days.filter((x) => x !== n) : [...draft.run_days, n],
  });
  const zones = timeZones();

  return (
    <>
      <div className="field">
        <label htmlFor="email-to">Send my picks to</label>
        <input id="email-to" type="email" value={draft.email_to} onChange={(e) => set({ email_to: e.target.value })} placeholder="you@example.com" />
      </div>

      <fieldset className="field">
        <legend className="label">Days</legend>
        <div className="chips">
          {DAYS.map(([n, label]) => (
            <button type="button" key={n} className="chip" aria-pressed={draft.run_days.includes(n)} onClick={() => toggleDay(n)}>{label}</button>
          ))}
        </div>
        <div className="chips" style={{ marginTop: 4 }}>
          <button type="button" className="btn btn-quiet" onClick={() => set({ run_days: [1, 2, 3, 4, 5] })}>Weekdays</button>
          <button type="button" className="btn btn-quiet" onClick={() => set({ run_days: [1, 2, 3, 4, 5, 6, 7] })}>Every day</button>
        </div>
      </fieldset>

      <div className="field-row">
        <div className="field">
          <label htmlFor="hour">Time</label>
          <select id="hour" value={draft.run_hour} onChange={(e) => set({ run_hour: Number(e.target.value) })}>
            {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
          <p className="hint">Picks usually arrive within 30 minutes of this time.</p>
        </div>
        <div className="field">
          <label htmlFor="tz">Time zone</label>
          <select id="tz" value={draft.timezone} onChange={(e) => set({ timezone: e.target.value })}>
            {!zones.includes(draft.timezone) && <option value={draft.timezone}>{draft.timezone}</option>}
            {zones.map((z) => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {draft.pick_groups ? (
        <fieldset className="field">
          <legend>Daily picks</legend>
          <p className="hint">Each list gets its own picks and the years of experience a job may ask for. Jobs outside that range are skipped.</p>
          {draft.pick_groups.map((g, i) => {
            const setGroup = (patch) => set({ pick_groups: draft.pick_groups.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <div key={g.key} className="pick-list-row">
                <p className="pick-list-name">{g.label}{g.level ? <span> · {g.level}</span> : null}</p>
                <div className="field-row three">
                  <div className="field">
                    <label htmlFor={`picks-${g.key}`}>Picks per run</label>
                    <input id={`picks-${g.key}`} type="number" min="0" max="10" value={g.picks} onChange={(e) => setGroup({ picks: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`years-${g.key}`}>Asks at least (years)</label>
                    <input id={`years-${g.key}`} type="number" min="0" max="20" value={g.min_years ?? ''} onChange={(e) => setGroup({ min_years: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor={`max-${g.key}`}>Asks at most (years)</label>
                    <input id={`max-${g.key}`} type="number" min="0" max="30" placeholder="No limit" value={g.max_years ?? ''} onChange={(e) => setGroup({ max_years: e.target.value })} />
                  </div>
                </div>
              </div>
            );
          })}
        </fieldset>
      ) : (
        <div className="field">
          <label htmlFor="ppd">Picks per run</label>
          <input id="ppd" type="number" min="1" max="10" value={draft.picks_per_day} onChange={(e) => set({ picks_per_day: e.target.value })} />
        </div>
      )}

      <div className="field">
        <label htmlFor="minfit">Minimum match (%)</label>
        <input id="minfit" type="number" min="0" max="100" value={draft.min_fit_score} onChange={(e) => set({ min_fit_score: e.target.value })} />
        <p className="hint">How well a job must match your profile. Sara sends fewer picks rather than weaker ones.</p>
      </div>
    </>
  );
}
