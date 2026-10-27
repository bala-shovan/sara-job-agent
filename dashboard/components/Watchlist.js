'use client';

import { useState } from 'react';
import { shortDate } from '../lib/format';

export default function Watchlist({ sara }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');

  async function add(e) {
    e.preventDefault();
    if (await sara.addCompany(name.trim(), group.trim())) {
      sara.notify(`${name.trim()} added. Sara checks it on her next run.`);
      setName(''); setGroup('');
    }
  }

  return (
    <section aria-labelledby="watch-heading" style={{ marginTop: 40 }}>
      <div className="section-head">
        <div>
          <h2 id="watch-heading">Company watchlist</h2>
          <p>Sara checks these companies' own careers pages on every run, on top of the job boards.</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Company</th><th>Group</th><th>Job system</th><th>Last checked</th><th>Watching</th></tr></thead>
          <tbody>
            {sara.companies.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.group_name || ''}</td>
                <td className={c.ats === 'other' ? 'ats-unknown' : ''}>
                  {c.ats === 'unknown' ? 'Detecting on next run'
                    : c.ats === 'other' ? 'Not readable yet'
                    : c.ats[0].toUpperCase() + c.ats.slice(1)}
                </td>
                <td>{c.last_checked_at ? shortDate(c.last_checked_at) : 'Not yet'}</td>
                <td>
                  <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <input type="checkbox" checked={c.active} onChange={(e) => sara.updateCompany(c.id, { active: e.target.checked })} />
                    <span className="visually-hidden">Watch {c.name}</span>
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form className="form" onSubmit={add} style={{ marginTop: 16 }}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="co-name">Company name</label>
            <input id="co-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="As it appears on its careers page" />
          </div>
          <div className="field">
            <label htmlFor="co-group">Group</label>
            <input id="co-group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="AI support" />
          </div>
        </div>
        <div className="form-actions"><button className="btn btn-primary">Add company</button></div>
      </form>
    </section>
  );
}
