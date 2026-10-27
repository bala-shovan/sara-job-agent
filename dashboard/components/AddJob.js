'use client';

import { useState } from 'react';
import { FAMILY_LABELS } from '../lib/format';

const blank = { url: '', title: '', company: '', location: '', role_family: 'pm', status: 'New', notes: '' };

export default function AddJob({ sara, goTo }) {
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const ok = await sara.addJob({
      url: form.url.trim(),
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim() || null,
      role_family: form.role_family,
      status: form.status,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (ok) {
      sara.notify(`Added ${form.title} at ${form.company}.`);
      setForm(blank);
      goTo('pipeline');
    }
  }

  return (
    <section aria-labelledby="add-heading">
      <div className="section-head">
        <div>
          <h2 id="add-heading">Add a job</h2>
          <p>Found a role on LinkedIn or elsewhere? Add it so Sara tracks it with the rest.</p>
        </div>
      </div>

      <form className="form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="url">Job link</label>
          <input id="url" type="url" required placeholder="https://" value={form.url} onChange={set('url')} />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="title">Job title</label>
            <input id="title" required value={form.title} onChange={set('title')} />
          </div>
          <div className="field">
            <label htmlFor="company">Company</label>
            <input id="company" required value={form.company} onChange={set('company')} />
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="location">Location</label>
            <input id="location" placeholder="Remote, Dhaka" value={form.location} onChange={set('location')} />
          </div>
          <div className="field">
            <label htmlFor="family">Role type</label>
            <select id="family" value={form.role_family} onChange={set('role_family')}>
              {Object.entries(FAMILY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={set('status')}>
              <option>New</option>
              <option>Applied</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="add-notes">Notes</label>
          <textarea id="add-notes" placeholder="Who referred you, salary range, anything to remember" value={form.notes} onChange={set('notes')} />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add job'}</button>
          {sara.mode === 'demo' && <span className="hint" style={{ color: 'var(--muted)', fontSize: 'var(--step--1)' }}>Demo mode: added jobs stay in this tab only.</span>}
        </div>
      </form>
    </section>
  );
}
