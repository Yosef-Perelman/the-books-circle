// Leaderboard date math — no date library for three functions (leaderboard.md).

export function periodStart(period) {
  if (period === 'all') return null;
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

// ISO-8601 week key, e.g. "2026-W33". Thursday-anchored: a week belongs to
// the year containing its Thursday, which is what makes year boundaries work.
export function isoWeekKey(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sunday -> 7, Monday -> 1
  d.setUTCDate(d.getUTCDate() + 4 - day); // move to this week's Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Monday (UTC) of the ISO week containing `date`.
function isoWeekMonday(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d;
}

// Longest run of consecutive ISO weeks (Mon-Sun) with at least one timestamp.
export function longestConsecutiveWeeks(timestamps) {
  if (timestamps.length === 0) return 0;

  const mondays = [...new Set(timestamps.map((ts) => isoWeekMonday(new Date(ts)).getTime()))].sort(
    (a, b) => a - b
  );

  let longest = 1;
  let current = 1;
  const oneWeekMs = 7 * 86400000;

  for (let i = 1; i < mondays.length; i++) {
    current = mondays[i] === mondays[i - 1] + oneWeekMs ? current + 1 : 1;
    longest = Math.max(longest, current);
  }

  return longest;
}
