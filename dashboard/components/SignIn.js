'use client';

import { useState } from 'react';

export default function SignIn({ sara }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    const ok = await sara.signIn(email.trim());
    setSending(false);
    if (ok) setSent(true);
  }

  return (
    <section aria-labelledby="signin-heading" className="signin">
      <div className="section-head">
        <div>
          <h2 id="signin-heading">Sign in</h2>
          <p>Sign in to see your real jobs instead of the demo. Only the owner's account can see Sara's data.</p>
        </div>
      </div>
      {sent ? (
        <div className="form">
          <p style={{ margin: 0 }}>Sign-in link sent to <strong>{email}</strong>. Open it on this device to continue.</p>
          <div className="form-actions"><button className="btn" onClick={() => setSent(false)}>Use a different email</button></div>
        </div>
      ) : (
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={sending || !sara.canSignIn}>{sending ? 'Sending…' : 'Email me a sign-in link'}</button>
          </div>
          {!sara.canSignIn && <p className="hint" style={{ margin: 0, color: 'var(--muted)' }}>Sign-in is off until the Supabase keys are set in Vercel.</p>}
        </form>
      )}
    </section>
  );
}
