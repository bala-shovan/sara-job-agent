'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { demoJobs, demoRuns, demoProfile, demoCompanies } from './demo';
import { OWNER_EMAIL, DEFAULT_WATCHLIST } from './setup';

const demoData = () => ({ jobs: demoJobs, runs: demoRuns, profile: demoProfile, companies: demoCompanies, invites: [] });

// One hook for all of Sara's data. Signed in: the person's own Sara (Row
// Level Security returns only their rows). Signed out: the demo, with
// sample data whose changes stay in the browser tab.
export function useSara() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [data, setData] = useState(demoData);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const mode = session ? 'live' : 'demo';
  const email = session?.user?.email?.toLowerCase() || '';
  const isOwner = email === OWNER_EMAIL;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const notify = useCallback((text, tone = 'ok') => setMessage({ text, tone, at: Date.now() }), []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(t);
  }, [message]);

  const load = useCallback(async () => {
    if (!session) {
      setData(demoData());
      setLoaded(true);
      return;
    }
    setLoading(true);
    const [jobs, runs, profile, companies, invites] = await Promise.all([
      supabase.from('jobs').select('*').order('found_at', { ascending: false }).limit(500),
      supabase.from('runs').select('*').order('started_at', { ascending: false }).limit(30),
      supabase.from('profile').select('*').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('companies').select('*').order('name'),
      isOwner ? supabase.from('invites').select('*').order('invited_at') : Promise.resolve({ data: [] }),
    ]);
    setLoading(false);
    setLoaded(true);
    const err = jobs.error || runs.error || profile.error || companies.error;
    if (err) notify(`Couldn't load your Sara: ${err.message}`, 'error');
    setData({
      jobs: jobs.data || [],
      runs: runs.data || [],
      profile: profile.data || null,
      companies: companies.data || [],
      invites: invites.data || [],
    });
  }, [session, isOwner, notify]);

  useEffect(() => { if (authReady) { setLoaded(false); load(); } }, [authReady, load]);

  const patchLocal = (table, id, patch) => setData((d) => ({
    ...d, [table]: d[table].map((r) => (r.id === id ? { ...r, ...patch } : r)),
  }));

  const updateJob = useCallback(async (id, patch) => {
    const before = data.jobs.find((j) => j.id === id);
    patchLocal('jobs', id, patch);
    if (mode === 'demo') return true;
    const { error } = await supabase.from('jobs').update(patch).eq('id', id);
    if (error) {
      patchLocal('jobs', id, before);
      notify(`Couldn't update the job: ${error.message}`, 'error');
      return false;
    }
    return true;
  }, [data.jobs, mode, notify]);

  // Live databases need supabase/004_saved_jobs.sql before jobs can be saved
  const savedNeedsMigration = mode === 'live' && data.jobs.length > 0 && !('saved_at' in data.jobs[0]);

  const toggleSaved = useCallback(async (job) => {
    if (savedNeedsMigration) {
      notify('Saving needs one database update: run supabase/004_saved_jobs.sql in Supabase.', 'error');
      return false;
    }
    const saving = !job.saved_at;
    const ok = await updateJob(job.id, { saved_at: saving ? new Date().toISOString() : null });
    if (ok) notify(saving ? `Saved "${job.title}". Find it on the Saved tab.` : `Removed "${job.title}" from Saved.`);
    return ok;
  }, [savedNeedsMigration, updateJob, notify]);

  const addJob = useCallback(async (fields) => {
    const row = {
      source: 'manual', external_id: null, role_family: fields.role_family || null, is_pick: false,
      found_at: new Date().toISOString(), ...fields,
      applied_at: fields.status === 'Applied' ? new Date().toISOString() : null,
    };
    if (mode === 'demo') {
      setData((d) => ({ ...d, jobs: [{ id: Date.now(), ...row }, ...d.jobs] }));
      return true;
    }
    const { data: saved, error } = await supabase.from('jobs').insert(row).select().single();
    if (error) {
      notify(error.code === '23505' ? 'That link is already in Sara.' : `Couldn't add the job: ${error.message}`, 'error');
      return false;
    }
    setData((d) => ({ ...d, jobs: [saved, ...d.jobs] }));
    return true;
  }, [mode, notify]);

  // Creates this person's Sara on first hire, updates it afterwards
  const saveProfile = useCallback(async (patch) => {
    const now = new Date().toISOString();
    const next = { ...(data.profile || {}), ...patch, updated_at: now };
    if (mode === 'demo') {
      setData((d) => ({ ...d, profile: next }));
      return true;
    }
    const isNew = !data.profile?.id;
    const query = isNew
      ? supabase.from('profile').insert({ ...next, user_id: session.user.id }).select().single()
      : supabase.from('profile').update({ ...patch, updated_at: now }).eq('id', data.profile.id).select().single();
    const { data: saved, error } = await query;
    if (error) { notify(`Couldn't save: ${error.message}`, 'error'); return false; }

    let companies = data.companies;
    if (isNew && companies.length === 0) {
      const rows = DEFAULT_WATCHLIST.map(([name, group_name]) => ({ name, group_name, ats: 'unknown', active: true }));
      const { data: seeded } = await supabase.from('companies').insert(rows).select();
      companies = seeded || [];
    }
    setData((d) => ({ ...d, profile: saved, companies }));
    return true;
  }, [data.profile, data.companies, mode, session, notify]);

  const updateCompany = useCallback(async (id, patch) => {
    patchLocal('companies', id, patch);
    if (mode === 'demo') return true;
    const { error } = await supabase.from('companies').update(patch).eq('id', id);
    if (error) { notify(`Couldn't update the company: ${error.message}`, 'error'); return false; }
    return true;
  }, [mode, notify]);

  const addCompany = useCallback(async (name, group_name) => {
    const row = { name, group_name: group_name || null, ats: 'unknown', active: true };
    if (mode === 'demo') {
      setData((d) => ({ ...d, companies: [...d.companies, { id: Date.now(), ...row }] }));
      return true;
    }
    const { data: saved, error } = await supabase.from('companies').insert(row).select().single();
    if (error) {
      notify(error.code === '23505' ? `${name} is already on your watchlist.` : `Couldn't add the company: ${error.message}`, 'error');
      return false;
    }
    setData((d) => ({ ...d, companies: [...d.companies, saved].sort((a, b) => a.name.localeCompare(b.name)) }));
    return true;
  }, [mode, notify]);

  // Owner only: who may sign up
  const addInvite = useCallback(async (inviteEmail, note) => {
    const row = { email: inviteEmail.trim().toLowerCase(), note: note?.trim() || null };
    const { data: saved, error } = await supabase.from('invites').insert(row).select().single();
    if (error) {
      notify(error.code === '23505' ? `${row.email} is already invited.`
        : /row-level security/i.test(error.message) ? 'The invite list is full (5 people). Remove someone to add another.'
        : `Couldn't add the invite: ${error.message}`, 'error');
      return false;
    }
    setData((d) => ({ ...d, invites: [...d.invites, saved] }));
    return true;
  }, [notify]);

  const removeInvite = useCallback(async (inviteEmail) => {
    const { error } = await supabase.from('invites').delete().eq('email', inviteEmail);
    if (error) { notify(`Couldn't remove the invite: ${error.message}`, 'error'); return false; }
    setData((d) => ({ ...d, invites: d.invites.filter((i) => i.email !== inviteEmail) }));
    return true;
  }, [notify]);

  const signIn = useCallback(async (signInEmail) => {
    if (!supabase) { notify('Sign-in needs the Supabase keys set in Vercel.', 'error'); return false; }
    const { error } = await supabase.auth.signInWithOtp({
      email: signInEmail,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    if (error) {
      const notInvited = /SARA_NOT_INVITED|database error saving new user/i.test(error.message);
      const rateLimited = /rate limit|too many/i.test(error.message);
      notify(notInvited ? `${signInEmail} isn't invited yet. Ask Bala for an invite.`
        : rateLimited ? 'Too many sign-in emails were sent in the last hour. Try again a little later.'
        : `Couldn't send the sign-in link: ${error.message}`, 'error');
      return false;
    }
    return true;
  }, [notify]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
  }, []);

  return {
    mode, session, email, isOwner, authReady, loaded, loading, canSignIn: Boolean(supabase),
    ...data, message, notify, reload: load,
    updateJob, toggleSaved, savedNeedsMigration, addJob, saveProfile, updateCompany, addCompany, addInvite, removeInvite, signIn, signOut,
  };
}
