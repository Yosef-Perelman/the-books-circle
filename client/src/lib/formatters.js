const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Absolute timestamps, per instructor note 9 — not fonts.md's relative
// format ('2h'/'1d'). e.g. "10 Aug, 14:32" or "10 Aug 2025, 14:32" if the
// post is from a previous year.
export function formatPostTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

  if (date.getFullYear() !== now.getFullYear()) {
    return `${day} ${month} ${date.getFullYear()}, ${time}`;
  }
  return `${day} ${month}, ${time}`;
}
