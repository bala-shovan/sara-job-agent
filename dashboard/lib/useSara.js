'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { demoJobs, demoRuns, demoProfile, demoCompanies } from './demo';

// One hook for all of Sara's data. Signed out (or no Supabase keys) means
// demo mode with sample data; changes stay in the browser tab.
export function useSara() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [data, setData] = useState({ jobs: demoJobs, runs: demoRuns, profile: demoProfile, companies: demoCompanies });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const mode = session ? 'live' : 'demo';

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const notify = useCallback((text, tone = 'ok') => {
    setMessage({ text, tone, at: Date.now() });
  }, []);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  const load = useCallback(async () => {
    if (!session) {
      setData({ jobs: demoJobs, runs: demoRuns, profile: demoProfile, companies: demoCompanies });
      return;
    }
    setLoading(true);
    const [jobs, runs, profile, companies] = await Promise.all([
      supabase.from('jobs').select('*').order('found_at', { ascending: false }).limit(500),
      supabase.from('runs').select('*').order('started_at', { ascending: false }).limit(30),
      supabase.from('profile').select('*').eq('id', 1).maybeSingle(),
      supabase.from('companies').select('*').order('name'),
    ]);
    setLoading(false);
    const err = jobs.error || runs.error || profile.error || companies.error;
    if (err) notify(`Couldn't load Sara's data: ${err.message}`, 'error');
    setData({
      jobs: jobs.data || [],
      runs: runs.data || [],
      profile: profile.data || null,
      companies: companies.data || [],
    });
  }, [session, notify]);

  useEffect(() => { if (authReady) load(); }, [authReady, load]);

  // In live mode the owner can always read the profile row. If it's missing
  // while signed in, this account isn't the owner (Row Level Security).
  const notOwner = mode === 'live' && !loading && authReady && data.profile === null;

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

  const saveProfile = useCallback(async (patch) => {
    const next = { ...data.profile, ...patch, updated_at: new Date().toISOString() };
    setData((d) => ({ ...d, profile: next }));
    if (mode === 'demo') return true;
    const { error } = await supabase.from('profile').update({ ...patch, updated_at: next.updated_at }).eq('id', 1);
    if (error) { notify(`Couldn't save the brief: ${error.message}`, 'error'); return false; }
    return true;
  }, [data.profile, mode, notify]);

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
      notify(error.code === '23505' ? `${name} is already on the watchlist.` : `Couldn't add the company: ${error.message}`, 'error');
      return false;
    }
    setData((d) => ({ ...d, companies: [...d.companies, saved].sort((a, b) => a.name.localeCompare(b.name)) }));
    return true;
  }, [mode, notify]);

  const signIn = useCallback(async (email) => {
    if (!supabase) { notify('Sign-in needs the Supabase keys set in Vercel.', 'error'); return false; }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: true },
    });
    if (error) { notify(`Couldn't send the sign-in link: ${error.message}`, 'error'); return false; }
    return true;
  }, [notify]);

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    setSession(null);
  }, []);

  return {
    mode, session, authReady, loading, notOwner, canSignIn: Boolean(supabase),
    ...data, message, notify, reload: load,
    updateJob, addJob, saveProfile, updateCompany, addCompany, signIn, signOut,
  };
}
