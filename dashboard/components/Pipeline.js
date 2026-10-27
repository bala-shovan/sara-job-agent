'use client';

import { useState } from 'react';
import { ROUTE, STATUSES, FAMILY_LABELS, shortDate, daysAgo } from '../lib/format';
import JobActions from './JobActions';

function Track({ job }) {
  const reached = STATUSES.indexOf(job.status);
  const exited = job.status === 'Rejected' || job.status === 'Not interested';
  const steps = [
    { label: 'Found', date: job.found_at, done: true },
    { label: 'Applied', date: job.applied_at, done: Boolean(job.applied_at) || (reached >= 1 && !exited) },
    { label: 'Interview', date: job.interview_at, done: reached >= 2 && !exited },
    { label: exited ? job.status : 'Offer', date: null, done: reached === 3 || exited },
  ];
  return (
    <ol className="track" aria-label="Application progress">
      {steps.map((s) => (
        <li key={s.label} className={s.done ? 'done' : ''}>
          {s.label}{s.date ? <><br />{shortDate(s.date)}</> : null}
        </li>
      ))}
    </ol>
  );
}

function Row({ job, sara }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(job.notes || '');

  const changeStatus = (status) => {
    const patch = { status };
    if (status === 'Applied' && !job.applied_at) patch.applied_at = new Date().toISOString();
    if (status === 'Interview scheduled' && !job.interview_at) patch.interview_at = new Date().toISOString();
    sara.updateJob(job.id, patch);
  };

  return (
    <li className="row">
      <div className="row-main">
        <button className="row-title" aria-expanded={open} onClick={() => setOpen(!open)}>
          <strong>{job.title}</strong>
          <span className="meta" style={{ marginTop: 2 }}>
            <span>{job.company}</span>
            <span>{job.source === 'manual' ? 'Added by you' : `Found ${daysAgo(job.found_at)}`}</span>
            {job.final_score ? <span>Fit {job.fit_score}</span> : null}
          </span>
        </button>
        <label>
          <span className="visually-hidden">Status for {job.title}</span>
          <select value={job.status} onChange={(e) => changeStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      {open && (
        <div className="row-detail">
          <Track job={job} />
          {job.why_fit && <p>{job.why_fit}</p>}
          {job.role_family && <p className="meta">{FAMILY_LABELS[job.role_family]}{job.location ? `, ${job.location}` : ''}</p>}
          <div className="field">
            <label htmlFor={`notes-${job.id}`}>Notes</label>
            <textarea
              id={`notes-${job.id}`} value={notes} placeholder="Interview prep, contacts, follow-up dates"
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (job.notes || '') && sara.updateJob(job.id, { notes })}
            />
          </div>
          <JobActions job={job} sara={sara} />
        </div>
      )}
    </li>
  );
}

export default function Pipeline({ sara }) {
  const [selected, setSelected] = useState('Applied');
  // Sara saves every job she scores, but only picks and jobs you've touched
  // or added belong in the pipeline.
  const tracked = sara.jobs.filter((j) => j.is_pick || j.source === 'manual' || j.status !== 'New');
  const count = (s) => tracked.filter((j) => j.status === s).length;
  const shown = tracked.filter((j) => j.status === selected);

  return (
    <section aria-labelledby="pipeline-heading">
      <div className="section-head">
        <div>
          <h2 id="pipeline-heading">Pipeline</h2>
          <p>Every job you've kept, from Sara's pick to an offer. Choose a stop to see its jobs.</p>
        </div>
      </div>

      <div className="route" role="group" aria-label="Pipeline stages">
        {ROUTE.map((s) => (
          <button
            key={s} className={`stop ${count(s) === 0 ? 'stop-empty' : ''}`}
            aria-pressed={selected === s} onClick={() => setSelected(s)}
          >
            <span className="stop-dot">{count(s)}</span>
            <span className="stop-label">{s}</span>
          </button>
        ))}
      </div>
      <div className="exits" role="group" aria-label="Closed">
        <span>Closed:</span>
        {['Rejected', 'Not interested'].map((s) => (
          <button key={s} className="exit-btn" aria-pressed={selected === s} onClick={() => setSelected(s)}>
            {s} ({count(s)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="empty" style={{ marginTop: 0 }}>
          <h2>Nothing at {selected.toLowerCase()} yet</h2>
          <p>
            {selected === 'New' ? 'New picks from Sara land here until you act on them.'
              : selected === 'Applied' ? 'Mark a pick as applied and it moves here.'
              : 'Change a job\'s status from its row and it moves here.'}
          </p>
        </div>
      ) : (
        <ul className="list">{shown.map((job) => <Row key={job.id} job={job} sara={sara} />)}</ul>
      )}
    </section>
  );
}
