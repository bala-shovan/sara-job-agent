'use client';

import { greeting, prettyDay, timeOf } from '../lib/format';
import PickCard from './PickCard';

export default function Today({ sara, goTo, next }) {
  // A run saves all its picks within moments, so "the latest picks" are the
  // ones found within a few hours of the newest pick.
  const picks = sara.jobs.filter((j) => j.is_pick && j.source !== 'manual');
  const newest = picks.length ? Math.max(...picks.map((j) => new Date(j.found_at).getTime())) : 0;
  const batch = picks.filter((j) => newest - new Date(j.found_at).getTime() < 3 * 3600000);
  // Saved jobs move to the Saved tab, so Today holds only what's still to decide on
  const shown = batch
    .filter((j) => !j.saved_at)
    // Sara chose these by fit plus role priority; within the five, show best fit first
    .sort((a, b) => b.fit_score - a.fit_score);
  const allSaved = batch.length > 0 && shown.length === 0;
  const run = sara.runs[0];
  const lastRunFoundNothing = run && shown.length > 0 && new Date(run.started_at).getTime() - newest > 3 * 3600000;

  return (
    <section aria-labelledby="today-heading">
      <div className="hello">
        <h1 id="today-heading">{greeting()}{sara.profile?.display_name ? `, ${sara.profile.display_name}` : ''}</h1>
        {run ? (
          <p>
            Sara checked <strong>{run.fetched.toLocaleString()} jobs</strong> at {timeOf(run.started_at)} on {prettyDay(run.started_at)}.{' '}
            {run.after_filter} passed your filters and <strong>{run.picked} made the cut</strong>.
          </p>
        ) : (
          <p>Sara hasn't run yet. {next ? `Her first picks arrive ${next}.` : 'Resume her in Settings to get picks.'} She'll email them to you too.</p>
        )}
      </div>

      {allSaved ? (
        <div className="empty">
          <h2>You've saved every pick</h2>
          <p>They're on your Saved tab. {next ? `Sara brings a fresh set ${next}.` : 'Resume Sara in Settings for a fresh set.'}</p>
          <button className="btn btn-primary" onClick={() => goTo('saved')}>Open Saved</button>
        </div>
      ) : shown.length === 0 ? (
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
          {batch.length > shown.length && (
            <p className="hint" style={{ marginTop: 24 }}>
              {batch.length - shown.length} of today's picks {batch.length - shown.length === 1 ? 'is' : 'are'} on your{' '}
              <button className="linklike" onClick={() => goTo('saved')}>Saved</button> tab.
            </p>
          )}
          <ol className="picks" aria-label="Picks, best match first">
            {shown.map((job) => <PickCard key={job.id} job={job} sara={sara} />)}
          </ol>
        </>
      )}
    </section>
  );
}
