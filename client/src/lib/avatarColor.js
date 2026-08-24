import { palette } from '../theme';

// Same person -> same colour, every time. Returns real hex values (not
// Mantine colour-scale names) because 'sage' etc. aren't registered scales
// in theme.js and would silently fail to render — see colors.md.
const AVATAR_COLORS = [palette.terracotta, palette.forest, palette.sage, palette.gold, palette.slate];

export function avatarColorFor(id) {
  if (!id) return AVATAR_COLORS[0];

  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
