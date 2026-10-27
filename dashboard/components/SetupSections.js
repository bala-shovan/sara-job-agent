'use client';

import { useState } from 'react';
import { DAYS, SENIORITY, hourLabel, timeZones, PRIORITY_BONUS } from '../lib/setup';

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
        Paste a summary of your CV: roles, companies, what you shipped, tools you know, where you're based.
        Sara reads this to judge every job. Leave out your phone number and address.
      </p>
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

function RoleRow({ role, index, firstEnabled, total, update, move }) {
  const [open, setOpen] = useState(false);
  const rank = role.enabled ? index + 1 : null;
  return (
    <li className={`role ${role.enabled ? '' : 'role-off'}`}>
      <div className="role-main">
        <label className="role-check">
          <input type="checkbox" checked={role.enabled} onChange={(e) => update({ enabled: e.target.checked })} />
          <span>
            <strong>{role.label}</strong>
            <span className="hint">
              {role.enabled ? `Priority ${rank}${PRIORITY_BONUS[index] ? `, ranks +${PRIORITY_BONUS[index]}` : ''}` : 'Not searching'}
            </span>
          </span>
        </label>
        <span className="role-tools">
          <button type="button" className="btn btn-quiet" onClick={() => setOpen(!open)} aria-expanded={open}>Title phrases</button>
          <button type="button" className="btn btn-quiet" disabled={!role.enabled || index === firstEnabled} onClick={() => move(-1)} aria-label={`Move ${role.label} up`}>Up</button>
          <button type="button" className="btn btn-quiet" disabled={!role.enabled || index === total - 1} onClick={() => move(1)} aria-label={`Move ${role.label} down`}>Down</button>
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

export function JobsYouWant({ draft, set }) {
  // Enabled roles first, in priority order
  const roles = [...draft.roles.filter((r) => r.enabled), ...draft.roles.filter((r) => !r.enabled)];
  const enabledCount = roles.filter((r) => r.enabled).length;
  const updateRole = (family, patch) => set({ roles: roles.map((r) => (r.family === family ? { ...r, ...patch } : r)) });
  const moveRole = (i, dir) => {
    const next = [...roles];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    set({ roles: next });
  };
  const toggleLevel = (v) => set({
    seniority: draft.seniority.includes(v) ? draft.seniority.filter((x) => x !== v) : [...draft.seniority, v],
  });

  return (
    <>
      <div className="field">
        <span className="label">Roles, highest priority first</span>
        <p className="hint">Sara searches every role you tick. When she has to choose, higher-priority roles win.</p>
        <ul className="roles">
          {roles.map((r, i) => (
            <RoleRow
              key={r.family} role={r} index={i} firstEnabled={0} total={enabledCount}
              update={(patch) => updateRole(r.family, patch)} move={(dir) => moveRole(i, dir)}
            />
          ))}
        </ul>
      </div>

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

      <div className="field-row">
        <div className="field">
          <label htmlFor="ppd">Picks per run</label>
          <input id="ppd" type="number" min="1" max="10" value={draft.picks_per_day} onChange={(e) => set({ picks_per_day: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="bar">Quality bar</label>
          <input id="bar" type="number" min="0" max="115" value={draft.min_final_score} onChange={(e) => set({ min_final_score: e.target.value })} />
          <p className="hint">Fit score plus priority bonus. Sara sends fewer picks rather than weak ones.</p>
        </div>
      </div>
    </>
  );
}
