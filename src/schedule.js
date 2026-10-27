// When is Sara due? GitHub wakes her every hour; this decides whether that
// hour is a work hour, based on the schedule set on the dashboard.
// No dependencies, so the check runs before npm install.

export function localParts(date, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  const isoWeekday = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[parts.weekday];
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), isoWeekday,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

// The UTC instant when the local calendar day containing `date` began.
export function localDayStartUtc(date, timeZone) {
  const p = localParts(date, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const offsetMs = asIfUtc - Math.floor(date.getTime() / 60000) * 60000;
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - offsetMs);
}

export const MAX_ATTEMPTS_PER_DAY = 3;

// runsToday: runs that started since the local day began ({ status }).
export function isDue(profile, runsToday, now = new Date()) {
  if (!profile) return { due: false, reason: 'no profile found' };
  if (!profile.hired_at) return { due: false, reason: 'Sara has not been hired yet' };
  if (!profile.active) return { due: false, reason: 'Sara is paused' };

  const tz = profile.timezone || 'Asia/Dhaka';
  const days = profile.run_days?.length ? profile.run_days : [1, 2, 3, 4, 5, 6, 7];
  const hour = Number.isInteger(profile.run_hour) ? profile.run_hour : 9;
  const local = localParts(now, tz);

  if (!days.includes(local.isoWeekday)) return { due: false, reason: `not a work day (${local.dateKey})` };
  // ">=" means a late or skipped GitHub run still catches up later that day
  if (local.hour < hour) return { due: false, reason: `before ${hour}:00 ${tz}` };

  const done = runsToday.filter((r) => r.status === 'success' || r.status === 'partial');
  if (done.length) return { due: false, reason: 'already ran today' };
  const attempts = runsToday.filter((r) => r.status === 'failed' || r.status === 'running').length;
  if (attempts >= MAX_ATTEMPTS_PER_DAY) return { due: false, reason: `gave up after ${attempts} failed attempts today` };

  return { due: true, reason: `due: ${local.dateKey} ${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')} ${tz}` };
}
