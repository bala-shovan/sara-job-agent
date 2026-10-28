'use client';

import { shortDate } from '../lib/format';
import PickCard from './PickCard';

// Jobs kept for later. Saving takes a job off Today; it stays here until
// it's unsaved, whatever its status.
export default function Saved({ sara, goTo }) {
  const saved = sara.jobs
    .filter((j) => j.saved_at)
    .sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));

  return (
    <section aria-labelledby="saved-heading">
      <div className="hello">
        <h1 id="saved-heading">Saved</h1>
        <p>Jobs you're keeping for later. Saving a pick takes it off Today, so each morning's list shows only what's new.</p>
      </div>

      {sara.savedNeedsMigration && (
        <p className="notice" style={{ marginTop: 24 }}>
          One database update is needed to save jobs: run <code>supabase/004_saved_jobs.sql</code> in the Supabase SQL Editor, then reload.
        </p>
      )}

      {saved.length === 0 ? (
        <div className="empty">
          <h2>Nothing saved yet</h2>
          <p>Use <strong>Save</strong> on any of Sara's picks to keep it here and clear it from Today.</p>
          <button className="btn btn-primary" onClick={() => goTo('today')}>See today's picks</button>
        </div>
      ) : (
        <ol className="picks" aria-label="Saved jobs, most recently saved first">
          {saved.map((job) => (
            <PickCard key={job.id} job={job} sara={sara}>
              <p className="saved-when">Saved {shortDate(job.saved_at)}</p>
            </PickCard>
          ))}
        </ol>
      )}
    </section>
  );
}
