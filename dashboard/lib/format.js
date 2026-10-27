export const STATUSES = ['New', 'Applied', 'Interview scheduled', 'Offer', 'Rejected', 'Not interested'];

// The main route a job travels; the last two statuses are exits.
export const ROUTE = ['New', 'Applied', 'Interview scheduled', 'Offer'];

export const FAMILY_LABELS = {
  pm: 'Product / AI PM',
  support_engineer: 'Product Support Engineer',
  support_lead: 'Support Lead',
  csm: 'Customer Success',
  other: 'Other',
};

const TZ = 'Asia/Dhaka';

export function dhakaDay(iso) {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
}

export function prettyDay(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
}

export function shortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: TZ });
}

export function timeOf(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
}

export function greeting() {
  const h = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: TZ }));
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function daysAgo(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  return `${d} days ago`;
}
