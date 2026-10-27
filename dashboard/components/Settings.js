'use client';

import { useEffect, useState } from 'react';
import { draftFromProfile, patchFromDraft, problems, nextRunLabel, hourLabel, daysLabel } from '../lib/setup';
import { AboutYou, JobsYouWant, Alerts } from './SetupSections';
import Watchlist from './Watchlist';
import Invites from './Invites';

function Section({ id, title, intro, children }) {
  return (
    <section className="form" aria-labelledby={id} style={{ marginTop: 24 }}>
      <div>
        <h2 id={id} style={{ fontSize: 'var(--step-1)' }}>{title}</h2>
        <p className="hint" style={{ marginTop: 4 }}>{intro}</p>
      </div>
      {children}
    </section>
  );
}

export function StatusCard({ sara, onReplay }) {
  const p = sara.profile;
  const next = nextRunLabel(p, sara.runs);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const ok = await sara.saveProfile({ active: !p.active });
    setBusy(false);
    if (ok) sara.notify(p.active ? 'Sara is paused. She won\'t run until you resume her.' : 'Sara is back on duty.');
  }

  return (
    <div className={`status-card ${p.active ? 'on' : 'off'}`}>
      <div>
        <h2>{p.active ? 'Sara is on duty' : 'Sara is paused'}</h2>
        <p>
          {p.active
            ? <>Works at {hourLabel(p.run_hour)}, {daysLabel(p.run_days)}. Next run {next || 'not scheduled'}.</>
            : <>No runs and no emails until you resume her. Your jobs and settings are kept.</>}
        </p>
      </div>
      <div className="form-actions">
        <button className={`btn ${p.active ? '' : 'btn-primary'}`} disabled={busy} onClick={toggle}>
          {p.active ? 'Pause Sara' : 'Resume Sara'}
        </button>
        {onReplay && <button className="btn btn-quiet" onClick={onReplay}>See the hiring flow</button>}
      </div>
    </div>
  );
}

export default function Settings({ sara, onReplay }) {
  const [draft, setDraft] = useState(() => draftFromProfile(sara.profile));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setDraft(draftFromProfile(sara.profile)); setDirty(false); }, [sara.mode]);

  const set = (patch) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const issue = Object.values(problems(draft)).find(Boolean);

  async function save() {
    setSaving(true);
    const ok = await sara.saveProfile(patchFromDraft(draft, sara.profile));
    setSaving(false);
    if (ok) { setDirty(false); sara.notify('Settings saved. Sara uses them from her next run.'); }
  }

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Settings</h2>
          <p>Everything Sara works from. Changes apply from her next run.</p>
        </div>
      </div>

      <StatusCard sara={sara} onReplay={sara.mode === 'demo' ? onReplay : null} />

      <Section id="s-about" title="About you" intro="Sara judges every job against this.">
        <AboutYou draft={draft} set={set} />
      </Section>
      <Section id="s-jobs" title="Jobs you want" intro="Roles, levels, locations and pay.">
        <JobsYouWant draft={draft} set={set} />
      </Section>
      <Section id="s-alerts" title="Alerts" intro="When Sara works and where she sends your picks.">
        <Alerts draft={draft} set={set} />
      </Section>

      <div className={`savebar ${dirty ? 'show' : ''}`} role="region" aria-label="Unsaved changes">
        <span>{issue || (dirty ? 'You have unsaved changes.' : 'All changes saved.')}</span>
        <button className="btn btn-primary" disabled={!dirty || saving || Boolean(issue)} onClick={save}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>

      <Watchlist sara={sara} />
      {sara.isOwner && sara.mode === 'live' && <Invites sara={sara} />}
    </>
  );
}
