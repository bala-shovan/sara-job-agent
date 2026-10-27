'use client';

import { FAMILY_LABELS, greeting, prettyDay, timeOf } from '../lib/format';
import JobActions from './JobActions';
import { Flag } from './Icons';

export default function Today({ sara, goTo, next }) {
  // A run saves all its picks within moments, so "the latest picks" are the
  // ones found within a few hours of the newest pick.
  const picks = sara.jobs.filter((j) => j.is_pick && j.source !== 'manual');
  const newest = picks.length ? Math.max(...picks.map((j) => new Date(j.found_at).getTime())) : 0;
  const shown = picks
    .filter((j) => newest - new Date(j.found_at).getTime() < 3 * 3600000)
    // Sara chose these by fit plus role priority; within the five, show best fit first
    .sort((a, b) => b.fit_score - a.fit_score);
  const run = sara.runs[0];
  const lastRunFoundNothing = run && shown.length > 0 && new Date(run.started_at).getTime() - newest > 3 * 3600000;

  return (
    <section aria-labelledby="today-heading">
      <div className="hello">
        <h1 id="today-heading">{greeting()}, Bala</h1>
        {run ? (
          <p>
            Sara checked <strong>{run.fetched.toLocaleString()} jobs</strong> at {timeOf(run.started_at)} on {prettyDay(run.started_at)}.{' '}
            {run.after_filter} passed your filters and <strong>{run.picked} made the cut</strong>.
          </p>
        ) : (
          <p>Sara hasn't run yet. {next ? `Her first picks arrive ${next}.` : 'Resume her in Settings to get picks.'}</p>
        )}
      </div>

      {shown.length === 0 ? (
        <div className="empty">
          <h2>No picks yet</h2>
          <p>When Sara finds jobs that clear your quality bar, they'll appear here and in your email{next ? `, next ${next}` : ''}. Found one yourself?</p>
          <button className="btn btn-primary" onClick={() => goTo('add')}>Add a job</button>
        </div>
      ) : (
        <>
          {lastRunFoundNothing && (
            <p className="notice" style={{ marginTop: 24 }}>
              Sara's latest run found nothing above your quality bar. Showing her previous picks, from {prettyDay(shown[0].found_at)}.
            </p>
          )}
          <ol className="picks" aria-label="Picks, best match first">
            {shown.map((job) => (
              <li key={job.id} className="pick">
                <div className="score" style={{ '--pct': Math.min(100, job.fit_score) }} title={`Fit score ${job.fit_score} of 100`}>
                  <span aria-label={`Fit score ${job.fit_score} of 100`}>{job.fit_score}</span>
                </div>
                <div>
                  <h3>{job.title}</h3>
                  <div className="meta">
                    <span>{job.company}</span>
                    <span>{job.location || 'Remote'}</span>
                    {job.salary_text && <span>{job.salary_text}</span>}
                    <span>{FAMILY_LABELS[job.role_family] || 'Role'}</span>
                  </div>
                  {job.why_fit && <p className="why">{job.why_fit}</p>}
                  {job.red_flags && <p className="flag"><Flag /> {job.red_flags}</p>}
                  <JobActions job={job} sara={sara} />
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
