'use client';

import { useState } from 'react';
import { draftFromProfile, patchFromDraft, problems, hourLabel, daysLabel, SENIORITY } from '../lib/setup';
import { AboutYou, JobsYouWant, Alerts } from './SetupSections';

const STEPS = [
  { key: 'about', title: 'About you', intro: 'Sara judges every job against your experience, so start with who you are.' },
  { key: 'jobs', title: 'Jobs you want', intro: 'Which roles to look for, at what level, and where.' },
  { key: 'alerts', title: 'Alerts', intro: 'When Sara works and where she sends your picks.' },
  { key: 'review', title: 'Hire Sara', intro: 'Check the brief, then put Sara to work.' },
];

function Review({ draft }) {
  const roles = draft.roles.filter((r) => r.enabled);
  const rows = [
    ['Roles', roles.map((r, i) => `${i + 1}. ${r.label}`).join('\n')],
    ['Levels', SENIORITY.filter((x) => draft.seniority.includes(x.value)).map((x) => x.label).join(', ')],
    ['Remote', draft.remote_allowed || 'None'],
    ['On-site', draft.onsite_cities || 'None'],
    ['Minimum pay', draft.min_monthly_usd ? `$${Number(draft.min_monthly_usd).toLocaleString()} per month` : 'Any'],
    ['Schedule', `${hourLabel(draft.run_hour)}, ${daysLabel(draft.run_days)} (${draft.timezone.replace(/_/g, ' ')})`],
    ['Picks', `Up to ${draft.picks_per_day} per run, emailed to ${draft.email_to}`],
  ];
  return (
    <dl className="review">
      {rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
    </dl>
  );
}

export default function Hire({ sara, onDone, onCancel }) {
  const [draft, setDraft] = useState(() => {
    const d = draftFromProfile(sara.profile);
    if (!d.email_to && sara.session?.user?.email) d.email_to = sara.session.user.email;
    return d;
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const issues = problems(draft);
  const current = STEPS[step];
  const issue = issues[current.key];

  async function hire() {
    setSaving(true);
    const ok = await sara.saveProfile({
      ...patchFromDraft(draft, sara.profile),
      active: true,
      hired_at: sara.profile.hired_at || new Date().toISOString(),
    });
    setSaving(false);
    if (ok) {
      sara.notify(`Sara is hired. Her first picks arrive at ${hourLabel(draft.run_hour)} on her next work day.`);
      onDone();
    }
  }

  return (
    <section className="hire" aria-labelledby="hire-heading">
      <div className="hire-intro">
        <h1 id="hire-heading">Hire Sara</h1>
        <p>Sara is a job-search agent. Tell her what you're looking for and she'll check job boards and company careers pages on your schedule, then send you the best matches.</p>
      </div>

      <ol className="steps" aria-label="Setup steps">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i === step ? 'current' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            <button type="button" onClick={() => i < step && setStep(i)} disabled={i > step}>
              <span className="step-dot">{i + 1}</span>
              <span>{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="form hire-card">
        <div>
          <h2>{current.title}</h2>
          <p className="hint" style={{ marginTop: 6 }}>{current.intro}</p>
        </div>

        {current.key === 'about' && <AboutYou draft={draft} set={set} />}
        {current.key === 'jobs' && <JobsYouWant draft={draft} set={set} />}
        {current.key === 'alerts' && <Alerts draft={draft} set={set} />}
        {current.key === 'review' && <Review draft={draft} />}

        {issue && <p className="hint hint-warn">{issue}</p>}

        <div className="form-actions">
          {step > 0 && <button type="button" className="btn" onClick={() => setStep(step - 1)}>Back</button>}
          {current.key !== 'review' ? (
            <button type="button" className="btn btn-primary" disabled={Boolean(issue)} onClick={() => setStep(step + 1)}>Continue</button>
          ) : (
            <button
              type="button" className="btn btn-primary btn-big" id="hire-button"
              disabled={saving || Object.values(issues).some(Boolean)} onClick={hire}
            >{saving ? 'Hiring…' : 'Hire Sara'}</button>
          )}
          {onCancel && <button type="button" className="btn btn-quiet" onClick={onCancel}>Back to the dashboard</button>}
          {sara.mode === 'demo' && <span className="hint">Demo mode: nothing is saved.</span>}
        </div>
      </div>
    </section>
  );
}
