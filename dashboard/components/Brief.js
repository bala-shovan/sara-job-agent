'use client';

import { useEffect, useState } from 'react';
import { shortDate } from '../lib/format';

const toList = (s) => s.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
const toText = (a = []) => a.join(', ');

function draftFrom(p) {
  return {
    families: p.role_families.map((f) => ({ ...f, keywords: toText(f.title_keywords) })),
    min_monthly_usd: p.min_monthly_usd,
    picks_per_day: p.picks_per_day,
    min_final_score: p.min_final_score,
    drop_words: toText(p.exclusions?.drop_title_words),
    remote_allowed: toText(p.locations?.remote_allowed),
    onsite_cities: toText(p.locations?.onsite_cities),
  };
}

function Watchlist({ sara }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');

  async function add(e) {
    e.preventDefault();
    if (await sara.addCompany(name.trim(), group.trim())) {
      sara.notify(`${name.trim()} added. Sara checks it on her next run.`);
      setName(''); setGroup('');
    }
  }

  return (
    <section aria-labelledby="watch-heading" style={{ marginTop: 40 }}>
      <div className="section-head">
        <div>
          <h2 id="watch-heading">Company watchlist</h2>
          <p>Sara checks these companies' own careers pages every morning, on top of the job boards.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Group</th><th>Job system</th><th>Last checked</th><th>Watching</th></tr></thead>
          <tbody>
            {sara.companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.group_name || ''}</td>
                <td className={c.ats === 'other' ? 'ats-unknown' : ''}>
                  {c.ats === 'unknown' ? 'Detecting on next run'
                    : c.ats === 'other' ? 'Not readable yet'
                    : c.ats[0].toUpperCase() + c.ats.slice(1)}
                </td>
                <td>{c.last_checked_at ? shortDate(c.last_checked_at) : 'Not yet'}</td>
                <td>
                  <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input type="checkbox" checked={c.active} onChange={(e) => sara.updateCompany(c.id, { active: e.target.checked })} />
                    <span className="visually-hidden">Watch {c.name}</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="form" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="co-name">Company name</label>
            <input id="co-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on its careers page" />
          </div>
          <div className="field">
            <label htmlFor="co-group">Group</label>
            <input id="co-group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="AI support" />
          </div>
        </div>
        <div className="form-actions"><button className="btn btn-primary">Add company</button></div>
      </form>
    </section>
  );
}

export default function Brief({ sara }) {
  const [draft, setDraft] = useState(() => (sara.profile ? draftFrom(sara.profile) : null));
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (sara.profile) setDraft(draftFrom(sara.profile)); }, [sara.profile?.updated_at, sara.mode]);

  if (!draft) return null;
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const setFamily = (i, k) => (e) => setDraft({
    ...draft, families: draft.families.map((f, j) => (j === i ? { ...f, [k]: e.target.value } : f)),
  });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const p = sara.profile;
    const ok = await sara.saveProfile({
      role_families: draft.families.map(({ keywords, ...f }) => ({ ...f, bonus: Number(f.bonus) || 0, title_keywords: toList(keywords) })),
      min_monthly_usd: Number(draft.min_monthly_usd) || 0,
      picks_per_day: Math.max(1, Math.min(10, Number(draft.picks_per_day) || 5)),
      min_final_score: Math.max(0, Math.min(115, Number(draft.min_final_score) || 60)),
      exclusions: { ...p.exclusions, drop_title_words: toList(draft.drop_words) },
      locations: { ...p.locations, remote_allowed: toList(draft.remote_allowed), onsite_cities: toList(draft.onsite_cities) },
    });
    setSaving(false);
    if (ok) sara.notify('Brief saved. Sara uses it from her next run.');
  }

  return (
    <>
      <section aria-labelledby="brief-heading">
        <div className="section-head">
          <div>
            <h2 id="brief-heading">Sara's brief</h2>
            <p>What Sara looks for. Changes apply from her next 9:00 AM run.</p>
          </div>
        </div>

        <form className="form" onSubmit={save}>
          <div className="field">
            <span className="label">Roles, in priority order</span>
            <p className="hint">A job title must contain one of these phrases. The bonus is added to the fit score, so higher-priority roles rank first.</p>
          </div>
          {draft.families.map((f, i) => (
            <div className="family" key={f.family}>
              <div className="family-head">
                <strong>{f.priority}. {f.label}</strong>
              </div>
              <div className="field-row">
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor={`kw-${i}`}>Title phrases, comma-separated</label>
                  <textarea id={`kw-${i}`} value={f.keywords} onChange={setFamily(i, 'keywords')} />
                </div>
                <div className="field">
                  <label htmlFor={`bonus-${i}`}>Priority bonus</label>
                  <input id={`bonus-${i}`} type="number" min="0" max="30" value={f.bonus} onChange={setFamily(i, 'bonus')} />
                </div>
              </div>
            </div>
          ))}

          <div className="field-row">
            <div className="field">
              <label htmlFor="pay">Minimum pay (USD/month)</label>
              <input id="pay" type="number" min="0" step="100" value={draft.min_monthly_usd} onChange={set('min_monthly_usd')} />
              <p className="hint">Jobs with no listed pay are kept.</p>
            </div>
            <div className="field">
              <label htmlFor="ppd">Picks per day</label>
              <input id="ppd" type="number" min="1" max="10" value={draft.picks_per_day} onChange={set('picks_per_day')} />
            </div>
            <div className="field">
              <label htmlFor="bar">Quality bar</label>
              <input id="bar" type="number" min="0" max="115" value={draft.min_final_score} onChange={set('min_final_score')} />
              <p className="hint">Minimum fit score plus bonus.</p>
            </div>
          </div>

          <div className="field">
            <label htmlFor="remote">Remote regions that work for you</label>
            <textarea id="remote" value={draft.remote_allowed} onChange={set('remote_allowed')} />
          </div>
          <div className="field">
            <label htmlFor="cities">Cities for on-site or hybrid roles</label>
            <input id="cities" value={draft.onsite_cities} onChange={set('onsite_cities')} />
          </div>
          <div className="field">
            <label htmlFor="drop">Skip titles containing</label>
            <textarea id="drop" value={draft.drop_words} onChange={set('drop_words')} />
            <p className="hint">Remote roles limited to US residents are always skipped.</p>
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save brief'}</button>
            {sara.mode === 'demo' && <span className="hint" style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>Demo mode: changes stay in this tab only.</span>}
          </div>
        </form>
      </section>
      <Watchlist sara={sara} />
    </>
  );
}
