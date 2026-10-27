'use client';

import { useState } from 'react';
import { shortDate } from '../lib/format';

const LIMIT = 5;

// Owner only: the people allowed to sign up and hire their own Sara
export default function Invites({ sara }) {
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const full = sara.invites.length >= LIMIT;

  async function add(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await sara.addInvite(email, note);
    setBusy(false);
    if (ok) {
      sara.notify(`${email.trim().toLowerCase()} can now sign in at ${window.location.host} and hire their own Sara.`);
      setEmail(''); setNote('');
    }
  }

  return (
    <section aria-labelledby="invites-heading" style={{ marginTop: 40 }}>
      <div className="section-head">
        <div>
          <h2 id="invites-heading">Who can use Sara</h2>
          <p>Invite up to {LIMIT} people. Each gets their own private Sara; nobody else can sign up. Only you see this list.</p>
        </div>
      </div>

      {sara.invites.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Email</th><th>Note</th><th>Invited</th><th><span className="visually-hidden">Remove</span></th></tr></thead>
            <tbody>
              {sara.invites.map((i) => (
                <tr key={i.email}>
                  <td>{i.email}</td>
                  <td>{i.note || ''}</td>
                  <td>{shortDate(i.invited_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-quiet" onClick={() => sara.removeInvite(i.email)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="form" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="inv-email">Email</label>
            <input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={full} />
          </div>
          <div className="field">
            <label htmlFor="inv-note">Note</label>
            <input id="inv-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Interviewer at Acme" disabled={full} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy || full}>{busy ? 'Inviting…' : 'Invite'}</button>
          <span className="hint">
            {full ? `The list is full (${LIMIT} of ${LIMIT}). Remove someone to invite another.`
              : `${sara.invites.length} of ${LIMIT} invites used. Removing someone stops new sign-ins, not an account they already made.`}
          </span>
        </div>
      </form>
    </section>
  );
}
