'use client';

import { useEffect, useState } from 'react';
import { useSara } from '../lib/useSara';
import Today from '../components/Today';
import Pipeline from '../components/Pipeline';
import AddJob from '../components/AddJob';
import Brief from '../components/Brief';
import Activity from '../components/Activity';
import SignIn from '../components/SignIn';

const TABS = [
  ['today', 'Today'],
  ['pipeline', 'Pipeline'],
  ['add', 'Add a job'],
  ['brief', "Sara's brief"],
  ['activity', 'Activity'],
];

export default function Page() {
  const sara = useSara();
  const [tab, setTab] = useState('today');
  // Dates and greetings depend on the viewer's clock, so render after mount
  // to avoid a server/client mismatch on the prerendered page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Keep the tab in the URL so links like /#pipeline work
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if ([...TABS.map(([k]) => k), 'signin'].includes(h)) setTab(h);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const goTo = (k) => {
    setTab(k);
    history.replaceState(null, '', `#${k}`);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => { if (sara.mode === 'live' && tab === 'signin') goTo('today'); }, [sara.mode]);

  const applied = sara.jobs.filter((j) => j.status === 'Applied' || j.status === 'Interview scheduled').length;

  return (
    <div className="shell">
      <header className="topbar">
        <a className="wordmark" href="#today" onClick={(e) => { e.preventDefault(); goTo('today'); }}>
          <span className="wordmark-dot" aria-hidden="true" />
          <span className="wordmark-name">Sara</span>
        </a>
        <div className="topbar-right">
          {sara.mode === 'demo' ? (
            <>
              <span className="mode-pill" title="You're viewing fictional sample jobs">Demo data</span>
              <button className="btn" onClick={() => goTo('signin')}>Sign in</button>
            </>
          ) : (
            <>
              <span>{sara.session?.user?.email}</span>
              <button className="btn btn-quiet" onClick={sara.signOut}>Sign out</button>
            </>
          )}
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => goTo(k)}>
            {label}
            {k === 'pipeline' && applied > 0 && <span className="tab-count">{applied} active</span>}
          </button>
        ))}
      </nav>

      <main>
        {!mounted ? null : <>
        {sara.notOwner && (
          <p className="notice">
            You're signed in as {sara.session?.user?.email}, which isn't the owner account, so there's nothing to show.
            Sign out to see the demo.
          </p>
        )}
        {sara.loading && <p className="notice">Loading Sara's latest work…</p>}

        {tab === 'today' && <Today sara={sara} goTo={goTo} />}
        {tab === 'pipeline' && <Pipeline sara={sara} />}
        {tab === 'add' && <AddJob sara={sara} goTo={goTo} />}
        {tab === 'brief' && sara.profile && <Brief sara={sara} />}
        {tab === 'activity' && <Activity sara={sara} />}
        {tab === 'signin' && <SignIn sara={sara} />}
        </>}
      </main>

      <footer className="footer">
        Sara finds the best-matching jobs every morning at 9:00 AM Dhaka time and tracks each one from pick to offer.
        She runs on free tiers: GitHub Actions, Gemini, Supabase and Vercel.{' '}
        <a href="https://github.com/bala-shovan/sara-job-agent">See how she works</a>.
      </footer>

      {sara.message && (
        <div className={`toast ${sara.message.tone === 'error' ? 'error' : ''}`} role="status">{sara.message.text}</div>
      )}
    </div>
  );
}
