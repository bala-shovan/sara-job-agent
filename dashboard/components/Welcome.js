'use client';

import { SignInForm, WaitlistForm } from './SignIn';

const STEPS = [
  ['Hire her', 'Tell Sara about your experience, the roles you want, where you can work and your minimum pay.'],
  ['She searches on your schedule', 'On the days and time you pick, she checks remote job boards and company careers pages and scores every match against your experience.'],
  ['You get the best few', 'She emails you the top picks with why each fits, and tracks every application from pick to offer.'],
];

// What a signed-out visitor sees first
export default function Welcome({ sara, onDemo }) {
  return (
    <section className="welcome" aria-labelledby="welcome-heading">
      <div className="welcome-copy">
        <h1 id="welcome-heading">Hire Sara, an AI agent that searches for jobs for you</h1>
        <p className="lede">
          Set her up once. Every day you choose, she finds the jobs worth your time and sends them to your inbox.
        </p>
        <ol className="how">
          {STEPS.map(([title, body], i) => (
            <li key={title}>
              <span className="step-dot" aria-hidden="true">{i + 1}</span>
              <div><strong>{title}</strong><p>{body}</p></div>
            </li>
          ))}
        </ol>
      </div>

      <div className="welcome-signin">
        {(() => {
          const cap = sara.capacity;
          const left = cap ? Math.max(0, cap.cap - cap.users) : null;
          return (
            <>
              <h2>{left === 0 ? 'Join the waitlist' : 'Get started free'}</h2>
              {left !== null && left > 0 && (
                <p className="spots"><strong>{left} of {cap.cap}</strong> free spots left</p>
              )}
              {left === 0 ? <WaitlistForm sara={sara} /> : <SignInForm sara={sara} />}
            </>
          );
        })()}
        <p className="hint" style={{ marginTop: 14 }}>
          Want to look around first? <button className="linkish" onClick={onDemo}>Explore the demo with sample jobs</button>.
        </p>
        <details className="privacy">
          <summary>What Sara stores, and who can see it</summary>
          <p>
            Sara stores your email, the profile and job preferences you enter, the jobs she finds for you and your notes on them.
            Your account is private: other users can't see it. Sara is a personal project run by Bala (Anik Shovan Bala), who manages
            the database and can see stored data. Your profile text is sent to Google's Gemini AI to score jobs. Don't enter phone
            numbers, addresses or anything sensitive. You can delete your account and all its data any time in Settings.
          </p>
        </details>
      </div>
    </section>
  );
}
