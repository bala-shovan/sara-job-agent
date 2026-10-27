// Step 0 of every hourly wake-up: should Sara work now?
// Reads the schedule from Supabase with a plain HTTP call (no npm install
// needed), prints the reason, and tells GitHub Actions whether to continue.
//
//   node src/due.js            -> due=true|false
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
    const [profile] = await rest('profile?id=eq.1&select=*');
    const tz = profile?.timezone || 'Asia/Dhaka';
    const since = localDayStartUtc(new Date(), tz).toISOString();
    const runs = await rest(`runs?select=status&started_at=gte.${encodeURIComponent(since)}`);
    const { due, reason } = isDue(profile, runs);
    output(due, reason);
  }
} catch (e) {
  // If the check itself fails, don't run blind; the next hour tries again.
  output(false, `schedule check failed: ${e.message}`);
}
