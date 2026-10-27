'use client';

import { prettyDay, timeOf } from '../lib/format';

const STEPS = [
  ['fetched', 'Fetched'],
  ['after_dedupe', 'New to Sara'],
  ['after_filter', 'Passed filters'],
  ['scored', 'Scored by AI'],
  ['picked', 'Picked'],
];

const STATUS_TEXT = {
  success: 'Ran cleanly',
  partial: 'Ran with issues',
  failed: 'Failed',
  running: 'Running now',
};

export default function Activity({ sara }) {
  return (
    <section aria-labelledby="activity-heading">
      <div className="section-head">
        <div>
          <h2 id="activity-heading">Activity</h2>
          <p>What Sara did each morning, from every job she fetched down to your picks.</p>
        </div>
      </div>

      {sara.runs.length === 0 ? (
        <div className="empty">
          <h2>No runs yet</h2>
          <p>Sara runs every day at 9:00 AM Dhaka time. To run her now, open your GitHub repo, go to Actions, choose Sara daily run, and select Run workflow.</p>
        </div>
      ) : (
        <ul className="runs">
          {sara.runs.map((r) => {
            const max = Math.max(1, r.fetched || 0);
            const errors = Array.isArray(r.errors) ? r.errors : [];
            return (
              <li key={r.id} className="run">
                <div className="run-head">
                  <strong>{prettyDay(r.started_at)}, {timeOf(r.started_at)}</strong>
                  <span className={`run-status ${r.status}`}>
                    {STATUS_TEXT[r.status] || r.status}{r.email_sent ? ', email sent' : ''}
                  </span>
                </div>
                <div className="funnel">
                  {STEPS.map(([k, label]) => {
                    const v = r[k] || 0;
                    // Log scale so 5 picks are still visible next to 1,200 fetched jobs
                    const width = v ? Math.max(6, (Math.log10(v + 1) / Math.log10(max + 1)) * 100) : 0;
                    return (
                      <div key={k}>
                        <b>{v.toLocaleString()}</b>
                        <i style={{ width: `${width}%`, opacity: v ? 0.8 : 0 }} />
                        <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
                {errors.length > 0 && (
                  <ul className="run-errors" aria-label="Issues">
                    {errors.map((e, i) => <li key={i}><strong>{e.source}</strong>: {e.error}</li>)}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
