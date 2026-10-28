// The hourly "is Sara due?" check.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDue, localParts, localDayStartUtc } from '../src/schedule.js';

const hired = {
  hired_at: '2026-10-27T00:00:00Z', active: true, run_hour: 9,
  run_days: [1, 2, 3, 4, 5], timezone: 'Asia/Dhaka',
};
// Wednesday 28 October 2026
const at = (dhakaHour) => new Date(Date.UTC(2026, 9, 28, dhakaHour - 6, 17));

test('Dhaka local time and weekday', () => {
  const p = localParts(at(9), 'Asia/Dhaka');
  assert.equal(p.hour, 9);
  assert.equal(p.isoWeekday, 3);
  assert.equal(p.dateKey, '2026-10-28');
});

test('local day starts at Dhaka midnight', () => {
  assert.equal(localDayStartUtc(at(15), 'Asia/Dhaka').toISOString(), '2026-10-27T18:00:00.000Z');
});

test('not hired or paused means no run', () => {
  assert.equal(isDue({ ...hired, hired_at: null }, [], at(10)).due, false);
  assert.equal(isDue({ ...hired, active: false }, [], at(10)).due, false);
});

test('waits until the chosen hour, then runs once', () => {
  assert.equal(isDue(hired, [], at(8)).due, false);
  assert.equal(isDue(hired, [], at(9)).due, true);
  assert.equal(isDue(hired, [], at(14)).due, true, 'catches up if GitHub skipped the 9:00 wake-up');
  assert.equal(isDue(hired, [{ status: 'success' }], at(10)).due, false);
  assert.equal(isDue(hired, [{ status: 'partial' }], at(10)).due, false);
});

test('skips days you switched off', () => {
  const saturday = new Date(Date.UTC(2026, 9, 31, 4, 17));
  assert.equal(isDue(hired, [], saturday).due, false);
  assert.equal(isDue({ ...hired, run_days: [6] }, [], saturday).due, true);
});

test('retries failures, but gives up after three', () => {
  assert.equal(isDue(hired, [{ status: 'failed' }], at(10)).due, true);
  assert.equal(isDue(hired, [{ status: 'failed' }, { status: 'failed' }, { status: 'failed' }], at(12)).due, false);
});

test('other time zones', () => {
  const ny = { ...hired, timezone: 'America/New_York', run_days: [1, 2, 3, 4, 5, 6, 7] };
  // 13:17 UTC on 28 Oct = 09:17 in New York (EDT)
  assert.equal(isDue(ny, [], new Date(Date.UTC(2026, 9, 28, 13, 17))).due, true);
  assert.equal(isDue(ny, [], new Date(Date.UTC(2026, 9, 28, 12, 17))).due, false);
});

test('a run earlier that day, before the chosen hour, does not cancel the scheduled one', () => {
  // Manual test run at 00:39 Dhaka, then the 9 AM wake-up
  const early = { status: 'partial', started_at: '2026-10-27T18:39:13Z' };
  assert.equal(isDue(hired, [early], at(9)).due, true);
  const onTime = { status: 'success', started_at: at(9).toISOString() };
  assert.equal(isDue(hired, [early, onTime], at(10)).due, false);
});
