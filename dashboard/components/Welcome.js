'use client';

import { SignInForm } from './SignIn';

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
        <h2>Sign in</h2>
        <SignInForm sara={sara} />
        <p className="hint" style={{ marginTop: 14 }}>
          Not invited? <button className="linkish" onClick={onDemo}>Explore the demo with sample jobs</button>.
        </p>
        <p className="hint" style={{ marginTop: 10 }}>
          Your settings and jobs are private to your account. Sara is run by Bala, who manages its database.
        </p>
      </div>
    </section>
  );
}
