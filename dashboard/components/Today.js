'use client';

import { dhakaDay, greeting, prettyDay, timeOf } from '../lib/format';
import PickCard from './PickCard';

// Today = the picks from Sara's latest check, minus any you've saved.
// If her latest check found nothing new, say so plainly.
export default function Today({ sara, goTo, next }) {
  const run = sara.runs.find((r) => r.status === 'success' || r.status === 'partial');
  const picks = sara.jobs.filter((j) => j.is_pick && j.source !== 'manual');
  const runAt = run ? new Date(run.started_at).getTime() : 0;
  // A run saves its picks within minutes of starting
  const fromLatest = run ? picks.filter((j) => Math.abs(new Date(j.found_at).getTime() - runAt) < 3 * 3600000) : [];
  const shown = fromLatest.filter((j) => !j.saved_at).sort((a, b) => b.fit_score - a.fit_score);
  const savedFromLatest = fromLatest.length - shown.length;
  const checkedToday = run && dhakaDay(run.started_at) === dhakaDay(new Date().toISOString());
  const nextLine = next ? <> Next run: <strong>{next}</strong>.</> : <> Sara is paused; resume her in Settings.</>;

  return (
    <section aria-labelledby="today-heading">
      <div className="hello">
        <h1 id="today-heading">{greeting()}{sara.profile?.display_name ? `, ${sara.profile.display_name}` : ''}</h1>
        {run ? (
          <p>
            {checkedToday ? "Today's check is done" : 'Last check'}: {timeOf(run.started_at)} on {prettyDay(run.started_at)},{' '}
            {run.fetched.toLocaleString()} jobs checked,{' '}
            <strong>{fromLatest.length ? `${fromLatest.length} new ${fromLatest.length === 1 ? 'pick' : 'picks'}` : 'no new picks'}</strong>.
            {nextLine}
          </p>
        ) : (
          <p>Sara hasn't run yet.{nextLine}</p>
        )}
      </div>

      {!run ? (
        <div className="empty">
          <h2>No picks yet</h2>
          <p>Sara's first picks will appear here and in your email.</p>
        </div>
      ) : fromLatest.length === 0 ? (
        <div className="empty">
          <h2>No new job postings {checkedToday ? 'today' : 'in the last check'}</h2>
          <p>Sara checked {run.fetched.toLocaleString()} jobs and none were new jobs that match you.{next ? ` She'll look again ${next}.` : ''}</p>
        </div>
      ) : shown.length === 0 ? (
        <div className="empty">
          <h2>You saved all of {checkedToday ? "today's" : 'the latest'} picks</h2>
          <p>They're on your Saved tab.{next ? ` New picks arrive ${next}.` : ''}</p>
          <button className="btn btn-primary" onClick={() => goTo('saved')}>Open Saved</button>
        </div>
      ) : (
        <>
          {savedFromLatest > 0 && (
            <p className="hint" style={{ marginTop: 24 }}>
              {savedFromLatest} of these picks {savedFromLatest === 1 ? 'is' : 'are'} on your{' '}
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
