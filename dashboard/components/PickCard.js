'use client';

import { familyLabel } from '../lib/format';
import JobActions from './JobActions';
import { Flag } from './Icons';

// One job as Sara presents it: fit score, what it is, why it fits, actions.
// Used by Today and Saved.
export default function PickCard({ job, sara, children }) {
  return (
    <li className="pick">
      <div className="score" style={{ '--pct': Math.min(100, job.fit_score || 0) }} title={job.fit_score != null ? `${job.fit_score}% match with your profile` : 'Added by you'}>
        <span aria-label={job.fit_score != null ? `${job.fit_score}% match` : 'No match score'}>{job.fit_score != null ? <>{job.fit_score}<small className="pct">%</small></> : '–'}</span>
      </div>
      <div>
        <h3>{job.title}</h3>
        <div className="meta">
          <span>{job.company}</span>
          <span>{job.location || 'Remote'}</span>
          {job.salary_text && <span>{job.salary_text}</span>}
          <span>{familyLabel(job.role_family, sara.profile)}</span>
        </div>
        {children}
        {job.why_fit && <p className="why">{job.why_fit}</p>}
        {job.red_flags && <p className="flag"><Flag /> {job.red_flags}</p>}
        <JobActions job={job} sara={sara} />
      </div>
    </li>
  );
}
