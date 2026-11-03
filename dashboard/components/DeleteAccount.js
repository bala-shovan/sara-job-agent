'use client';

import { useState } from 'react';

// Anyone but the owner can delete their account and everything Sara stored
export default function DeleteAccount({ sara }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const ok = await sara.deleteAccount();
    setBusy(false);
    if (ok) window.location.hash = '';
  }

  return (
    <section aria-labelledby="delete-heading" style={{ marginTop: 40 }}>
      <div className="section-head">
        <div>
          <h2 id="delete-heading">Delete my account</h2>
          <p>Removes your account, settings, watchlist, saved jobs and Sara's history for you. This can't be undone.</p>
        </div>
      </div>
      <div className="form danger-zone">
        {!confirming ? (
          <div className="form-actions" style={{ marginTop: 0 }}>
            <button className="btn" onClick={() => setConfirming(true)}>Delete my account…</button>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="del-confirm">Type DELETE to confirm</label>
              <input id="del-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </div>
            <div className="form-actions">
              <button className="btn btn-danger" disabled={typed !== 'DELETE' || busy} onClick={remove}>{busy ? 'Deleting…' : 'Delete everything'}</button>
              <button className="btn btn-quiet" onClick={() => { setConfirming(false); setTyped(''); }}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
