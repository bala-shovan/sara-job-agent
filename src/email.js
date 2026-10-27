// Step 9: the morning email. Sent from your own Gmail to yourself with an
// app password (free, and it won't land in spam). In mock mode the email is
// written to out/email-preview.html instead of being sent.

import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'node:fs/promises';
import { config } from './config.js';

const LABELS = { pm: 'Product / AI PM', support_engineer: 'Product Support Engineer', support_lead: 'Support Lead', csm: 'Customer Success' };

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function localDate(timeZone, d = new Date()) {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone });
}

function greeting(timeZone, d = new Date()) {
  const h = Number(d.toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export function buildEmail(picks, stats, profile = {}) {
  const tz = profile.timezone || 'Asia/Dhaka';
  const date = localDate(tz);
  const subject = picks.length
    ? `Sara: ${picks.length} job pick${picks.length > 1 ? 's' : ''} for ${date}`
    : `Sara: no strong matches today (${date})`;

  const cards = picks.map((j, i) => `
    <tr><td style="padding:16px 0;border-bottom:1px solid #e5e7eb">
      <div style="font-size:12px;color:#6b7280;margin-bottom:4px">#${i + 1} · ${esc(LABELS[j.role_family] || j.role_family)} · Fit ${j.final_score}</div>
      <div style="font-size:17px;font-weight:600;color:#111827">${esc(j.title)}</div>
      <div style="font-size:14px;color:#374151;margin:2px 0 8px">${esc(j.company)} · ${esc(j.location || 'Remote')}${j.salary_text ? ` · ${esc(j.salary_text)}` : ''}</div>
      <div style="font-size:14px;color:#111827;line-height:1.5">${esc(j.why_fit)}</div>
      ${j.red_flags ? `<div style="font-size:13px;color:#b45309;margin-top:6px">Watch out: ${esc(j.red_flags)}</div>` : ''}
      <a href="${esc(j.url)}" style="display:inline-block;margin-top:10px;padding:8px 14px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">View and apply</a>
    </td></tr>`).join('');

  const empty = `<tr><td style="padding:16px 0;font-size:14px;color:#374151;line-height:1.5">
      Nothing cleared the quality bar today, so Sara isn't padding the list. She'll look again on her next run.
    </td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#f9fafb;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:10px;padding:8px 24px 24px">
    <tr><td style="padding:16px 0 8px">
      <div style="font-size:20px;font-weight:700;color:#111827">${greeting(tz)}, Bala</div>
      <div style="font-size:14px;color:#6b7280">${esc(date)}: here ${picks.length === 1 ? 'is' : 'are'} today's ${picks.length || 'no'} pick${picks.length === 1 ? '' : 's'}.</div>
    </td></tr>
    ${picks.length ? cards : empty}
    <tr><td style="padding-top:16px;font-size:12px;color:#9ca3af;line-height:1.6">
      Sara checked ${stats.fetched} jobs: ${stats.after_dedupe} were new, ${stats.after_filter} passed filters, ${stats.scored} were scored.
      ${stats.errorCount ? `${stats.errorCount} source issue(s) are in the activity log.` : ''}
      ${config.dashboardUrl ? `<br><a href="${esc(config.dashboardUrl)}" style="color:#2563eb">Open the dashboard</a> to mark jobs Applied.` : ''}
    </td></tr>
  </table></td></tr></table></body></html>`;

  const text = [
    `${greeting(tz)}, Bala. ${date}`,
    ...picks.map((j, i) => `\n${i + 1}. ${j.title} at ${j.company} (fit ${j.final_score})\n${j.why_fit}\n${j.url}`),
    picks.length ? '' : '\nNo strong matches today.',
  ].join('\n');

  return { subject, html, text };
}

export async function sendEmail(picks, stats, profile = {}) {
  const email = buildEmail(picks, stats, profile);

  if (config.mock || !config.gmailUser || !config.gmailAppPassword) {
    await mkdir(new URL('../out/', import.meta.url), { recursive: true });
    await writeFile(new URL('../out/email-preview.html', import.meta.url), email.html);
    return { sent: false, preview: 'out/email-preview.html', subject: email.subject };
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.gmailUser, pass: config.gmailAppPassword },
  });
  await transport.sendMail({
    from: `Sara <${config.gmailUser}>`,
    to: profile.email_to || config.emailTo,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
  return { sent: true, subject: email.subject };
}
