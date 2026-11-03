'use client';

import { useState } from 'react';

// The sign-in form, used on the welcome page and the demo's sign-in tab
// When Sara is full: leave an email for when a spot opens
export function WaitlistForm({ sara, initialEmail = '' }) {
  const [email, setEmail] = useState(initialEmail);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await sara.joinWaitlist(email);
    setBusy(false);
    if (ok) setJoined(true);
  }

  if (joined) {
    return <p className="notice" style={{ margin: 0 }}>You're on the waitlist. Bala will email <strong>{email.trim().toLowerCase()}</strong> when a spot opens.</p>;
  }
  return (
    <form className="form" onSubmit={submit}>
      <p style={{ margin: 0 }}><strong>Sara is full right now.</strong> She works for up to {sara.capacity?.cap || 50} people on free tools. Join the waitlist and you'll hear when a spot opens.</p>
      <div className="field">
        <label htmlFor="wait-email">Email</label>
        <input id="wait-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Joining…' : 'Join the waitlist'}</button>
      </div>
    </form>
  );
}

export function SignInForm({ sara }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [full, setFull] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    const result = await sara.signIn(email.trim());
    setSending(false);
    if (result === 'full') setFull(true);
    else if (result) setSent(true);
  }

  if (full) return <WaitlistForm sara={sara} initialEmail={email} />;

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
        <p className="hint">New here? The same link creates your free account. No password needed.</p>
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
