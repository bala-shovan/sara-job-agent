'use client';

import { useState } from 'react';

// The sign-in form, used on the welcome page and the demo's sign-in tab
export function SignInForm({ sara }) {
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

  if (sent) {
    return (
      <div className="form">
        <p style={{ margin: 0 }}>Sign-in link sent to <strong>{email}</strong>. Open it on this device to continue. It can take a minute, and may land in spam.</p>
        <div className="form-actions"><button className="btn" onClick={() => setSent(false)}>Use a different email</button></div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <p className="hint">Sara is invite-only. Use the email address you were invited with; no password needed.</p>
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" disabled={sending || !sara.canSignIn}>{sending ? 'Sending…' : 'Email me a sign-in link'}</button>
      </div>
      {!sara.canSignIn && <p className="hint" style={{ margin: 0 }}>Sign-in is off until the Supabase keys are set in Vercel.</p>}
    </form>
  );
}

export default function SignIn({ sara }) {
  return (
    <section aria-labelledby="signin-heading" className="signin">
      <div className="section-head">
        <div>
          <h2 id="signin-heading">Sign in</h2>
          <p>Sign in to hire your own Sara, or to see the jobs she found for you.</p>
        </div>
      </div>
      <SignInForm sara={sara} />
    </section>
  );
}
