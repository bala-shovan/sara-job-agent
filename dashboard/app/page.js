'use client';

import { useEffect, useState } from 'react';
import { useSara } from '../lib/useSara';
import Today from '../components/Today';
import Pipeline from '../components/Pipeline';
import AddJob from '../components/AddJob';
import Settings from '../components/Settings';
import Hire from '../components/Hire';
import Activity from '../components/Activity';
import SignIn from '../components/SignIn';
import Welcome from '../components/Welcome';
import { nextRunLabel } from '../lib/setup';

const TABS = [
  ['today', 'Today'],
  ['pipeline', 'Pipeline'],
  ['add', 'Add a job'],
  ['settings', 'Settings'],
  ['activity', 'Activity'],
];
const VIEWS = [...TABS.map(([k]) => k), 'signin', 'hire'];

export default function Page() {
  const sara = useSara();
  const [tab, setTab] = useState('today');
  // Signed-out visitors see the welcome page until they choose the demo
  const [demo, setDemo] = useState(false);
  // Dates and greetings depend on the viewer's clock, so render after mount
  // to avoid a server/client mismatch on the prerendered page.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Keep the view in the URL so links like /#pipeline and /#demo work
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1);
      if (h === 'demo') { setDemo(true); setTab('today'); }
      else if (h === 'brief') setTab('settings');
      else if (VIEWS.includes(h)) setTab(h);
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

  const live = sara.mode === 'live';
  const p = sara.profile;
  const showWelcome = !live && !demo && tab !== 'signin';
  // Signed in, but the database hasn't been updated for multiple users yet
  const needsMigration = live && sara.loaded && p && !('user_id' in p);
  // Signed in and never hired: setup comes first
  const mustHire = live && sara.loaded && !needsMigration && (!p || !p.hired_at);
  const showHire = mustHire || (tab === 'hire' && (demo || live));
  const next = p ? nextRunLabel(p, sara.runs) : null;
  const active = sara.jobs.filter((j) => j.status === 'Applied' || j.status === 'Interview scheduled').length;

  const leaveDemo = () => { setDemo(false); setTab('today'); history.replaceState(null, '', '#'); window.scrollTo({ top: 0 }); };
  const openDemo = () => { setDemo(true); setTab('today'); history.replaceState(null, '', '#demo'); window.scrollTo({ top: 0 }); };

  return (
    <div className="shell">
      <header className="topbar">
        <a className="wordmark" href="#today" onClick={(e) => { e.preventDefault(); live || demo ? goTo('today') : leaveDemo(); }}>
          <span className="wordmark-dot" aria-hidden="true" />
          <span className="wordmark-name">Sara</span>
        </a>
        {mounted && (
          <div className="topbar-right">
            {p?.hired_at && !showHire && !showWelcome && (
              <button className={`duty ${p.active ? 'on' : 'off'}`} onClick={() => goTo('settings')}>
                <span className="duty-dot" aria-hidden="true" />
                {p.active ? (next ? `On duty, next run ${next}` : 'On duty') : 'Paused'}
              </button>
            )}
            {live ? (
              <>
                <span className="who">{sara.email}</span>
                <button className="btn btn-quiet" onClick={() => { sara.signOut(); leaveDemo(); }}>Sign out</button>
              </>
            ) : demo ? (
              <>
                <span className="mode-pill" title="You're viewing fictional sample jobs">Demo data</span>
                <button className="btn" onClick={leaveDemo}>Sign in</button>
              </>
            ) : null}
          </div>
        )}
      </header>

      {mounted && !showWelcome && !showHire && (
        <nav className="tabs" role="tablist" aria-label="Sections">
          {TABS.map(([k, label]) => (
            <button key={k} role="tab" className="tab" aria-selected={tab === k} onClick={() => goTo(k)}>
              {label}
              {k === 'pipeline' && active > 0 && <span className="tab-count">{active} active</span>}
            </button>
          ))}
        </nav>
      )}

      <main>
        {!mounted ? null : showWelcome ? (
          <Welcome sara={sara} onDemo={openDemo} />
        ) : <>
          {live && !sara.loaded && <p className="notice">Loading your Sara…</p>}
          {needsMigration && (
            <p className="notice">
              One database update is needed: run <code>supabase/003_multi_user.sql</code> in the Supabase SQL Editor, then reload this page.
            </p>
          )}

          {showHire ? (
            <Hire key={p?.id || 'new'} sara={sara} onDone={() => goTo('today')} onCancel={mustHire ? null : () => goTo('settings')} />
          ) : (live && !sara.loaded) ? null : <>
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
        Sara is an AI job-search agent: you hire her, tell her what you want and when, and she sends the best matches on
        your schedule, then tracks each one from pick to offer. Built by Bala on free tiers: GitHub Actions, Gemini,
        Supabase and Vercel.{' '}
        <a href="https://github.com/bala-shovan/sara-job-agent">See how she works</a>.
      </footer>

      {sara.message && (
        <div className={`toast ${sara.message.tone === 'error' ? 'error' : ''}`} role="status">{sara.message.text}</div>
      )}
    </div>
  );
}
