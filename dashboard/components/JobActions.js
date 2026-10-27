'use client';

import { Check, Cross, External, ThumbDown, ThumbUp } from './Icons';
import { shortDate } from '../lib/format';

// The buttons shared by Today's picks and the pipeline detail.
export default function JobActions({ job, sara }) {
  const applied = job.status !== 'New' && job.status !== 'Not interested';

  return (
    <div className="actions">
      <a className="btn" href={job.url} target="_blank" rel="noopener noreferrer">
        <External /> Open job posting
      </a>

      {job.status === 'New' && (
        <>
          <button className="btn btn-primary" onClick={() => sara.updateJob(job.id, { status: 'Applied', applied_at: new Date().toISOString() })}>
            <Check /> Mark applied
          </button>
          <button className="btn btn-quiet" onClick={() => sara.updateJob(job.id, { status: 'Not interested' })}>
            <Cross /> Not interested
          </button>
        </>
      )}

      {applied && (
        <span className="status-chip">
          <Check /> {job.status === 'Applied' && job.applied_at ? `Applied ${shortDate(job.applied_at)}` : job.status}
        </span>
      )}
      {job.status === 'Not interested' && (
        <>
          <span className="status-chip exit">Not interested</span>
          <button className="btn btn-quiet" onClick={() => sara.updateJob(job.id, { status: 'New' })}>Undo</button>
        </>
      )}

      <span className="spacer" />

      {job.is_pick && (
        <span role="group" aria-label="Rate this pick" style={{ display: 'inline-flex', gap: 6 }}>
          <button
            className="btn btn-quiet" aria-pressed={job.rating === 'good'} title="Good pick"
            onClick={() => sara.updateJob(job.id, { rating: job.rating === 'good' ? null : 'good' })}
          >
            <ThumbUp /> <span className="visually-hidden">Good pick</span>
          </button>
          <button
            className="btn btn-quiet" aria-pressed={job.rating === 'bad'} title="Bad pick"
            onClick={() => sara.updateJob(job.id, { rating: job.rating === 'bad' ? null : 'bad' })}
          >
            <ThumbDown /> <span className="visually-hidden">Bad pick</span>
          </button>
        </span>
      )}
    </div>
  );
}
