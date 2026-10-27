// Step 0 of every hourly wake-up: is anyone's Sara due right now?
// Reads every hired Sara's schedule from Supabase with plain HTTP calls (no
// npm install needed) and tells GitHub Actions whether to continue. The full
// run then works only for the people who are due.
//
//   node src/due.js              -> due=true|false
//   SARA_FORCE=1 node src/due.js -> always due (the "Run workflow" button)

import { appendFileSync } from 'node:fs';
import { isDue, localDayStartUtc } from './schedule.js';

async function rest(path) {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

function output(due, reason) {
  console.log(`[sara] ${due ? 'Working now' : 'Not now'}: ${reason}`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `due=${due}\n`);
}

try {
  if (process.env.SARA_FORCE === '1') {
    output(true, 'started by hand');
  } else {
    const profiles = await rest('profile?select=*&hired_at=not.is.null');
    const reasons = [];
    let anyDue = false;
    for (const p of profiles) {
      const since = localDayStartUtc(new Date(), p.timezone || 'Asia/Dhaka').toISOString();
      const runs = await rest(`runs?select=status&user_id=eq.${p.user_id}&started_at=gte.${encodeURIComponent(since)}`);
      const { due, reason } = isDue(p, runs);
      reasons.push(`${p.display_name || 'someone'}: ${reason}`);
      anyDue ||= due;
    }
    output(anyDue, reasons.join('; ') || 'nobody has hired Sara yet');
  }
} catch (e) {
  // If the check itself fails, don't run blind; the next hour tries again.
  output(false, `schedule check failed: ${e.message}`);
}
