'use client';

import { useEffect, useState } from 'react';
import { useSara } from '../lib/useSara';
import Today from '../components/Today';
import Pipeline from '../components/Pipeline';
import AddJob from '../components/AddJob';
import Settings from '../components/Settings';
import Hire from '../components/Hire';
import { nextRunLabel } from '../lib/setup';
import Activity from '../components/Activity';
import SignIn from '../components/SignIn';

const TABS = [
  ['today', 'Today'],
  ['pipeline', 'Pipeline'],
  ['add', 'Add a job'],
  ['settings', 'Settings'],
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
      if (h === 'brief') setTab('settings');
      else if ([...TABS.map(([k]) => k), 'signin', 'hire'].includes(h)) setTab(h);
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
  const p = sara.profile;
  // Signed in, but the database hasn't got the hiring columns yet
  const needsMigration = sara.mode === 'live' && p && !('hired_at' in p);
  // Signed in and never hired: setup comes first
  const mustHire = sara.mode === 'live' && p && !needsMigration && !p.hired_at;
  const showHire = mustHire || tab === 'hire';
  const next = p ? nextRunLabel(p, sara.runs) : null;

  return (
    <div className="shell">
      <header className="topbar">
        <a className="wordmark" href="#today" onClick={(e) => { e.preventDefault(); goTo('today'); }}>
          <span className="wordmark-dot" aria-hidden="true" />
          <span className="wordmark-name">Sara</span>
        </a>
        <div className="topbar-right">
          {p?.hired_at && !showHire && (
            <button className={`duty ${p.active ? 'on' : 'off'}`} onClick={() => goTo('settings')}>
              <span className="duty-dot" aria-hidden="true" />
              {p.active ? (next ? `On duty, next run ${next}` : 'On duty') : 'Paused'}
            </button>
          )}
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

      {!showHire && <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => goTo(k)}>
            {label}
            {k === 'pipeline' && applied > 0 && <span className="tab-count">{applied} active</span>}
          </button>
        ))}
      </nav>}

      <main>
        {!mounted ? null : <>
        {sara.notOwner && (
          <p className="notice">
            You're signed in as {sara.session?.user?.email}, which isn't the owner account, so there's nothing to show.
            Sign out to see the demo.
          </p>
        )}
        {sara.loading && <p className="notice">Loading Sara's latest work…</p>}
        {needsMigration && (
          <p className="notice">
            One database update is needed before you can manage Sara here: run <code>supabase/002_hire_sara.sql</code> in
            the Supabase SQL Editor, then reload this page.
          </p>
        )}

        {showHire && p ? <Hire sara={sara} onDone={() => goTo('today')} onCancel={mustHire ? null : () => goTo('settings')} /> : <>
          {tab === 'today' && <Today sara={sara} goTo={goTo} next={next} />}
          {tab === 'pipeline' && <Pipeline sara={sara} />}
          {tab === 'add' && <AddJob sara={sara} goTo={goTo} />}
          {tab === 'settings' && p && !needsMigration && <Settings sara={sara} onReplay={() => goTo('hire')} />}
          {tab === 'activity' && <Activity sara={sara} />}
          {tab === 'signin' && <SignIn sara={sara} />}
        </>}
        </>}
      </main>

      <footer className="footer">
        Sara is a job-search agent: you hire her, tell her what you want and when, and she sends the best matches on your schedule, then tracks each one from pick to offer.
        She runs on free tiers: GitHub Actions, Gemini, Supabase and Vercel.{' '}
        <a href="https://github.com/bala-shovan/sara-job-agent">See how she works</a>.
      </footer>

      {sara.message && (
        <div className={`toast ${sara.message.tone === 'error' ? 'error' : ''}`} role="status">{sara.message.text}</div>
      )}
    </div>
  );
}
