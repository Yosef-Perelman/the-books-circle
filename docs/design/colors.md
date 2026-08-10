# design/colors.md

The palette and how to apply it. Load for any UI work.

**Rule: never write a hex value in a component.** Use the Mantine theme token. If a colour you need isn't here, it isn't in the design.

## Palette

| Token | Hex | Use |
|---|---|---|
| `cream` | `#F7F0E1` | Page background — the app's base surface |
| `surface` | `#FFFDF8` | Cards, inputs, navbar, modals |
| `terracotta` | `#C96F4B` | Primary actions, active nav, wordmark, stars, likes |
| `terracottaDark` | `#B25E3C` | Terracotta text sitting on a terracotta tint |
| `terracottaTint` | `#FBE9E0` | Selected/primary tile backgrounds (active circle, "Snap the cover" tile) |
| `forest` | `#35594A` | Secondary actions, "AI" badges, section labels, progress |
| `greenTint` | `#E6EDE8` | Secondary highlighted backgrounds |
| `sage` | `#6E8B7B` | Tertiary accent — avatars, tags |
| `ink` | `#3A322A` | Primary text |
| `muted` | `#8A7E70` | Secondary text, placeholders, timestamps |
| `line` | `#EADFC9` | Borders, dividers |
| `stale` | `#B9AE9C` | Disabled / inactive |
| `gold` | `#D9A45B` | Rank badges, tags, accent tiles |
| `slate` | `#6B7E8C` | Extra avatar/tag accent |

Feel: warm reading nook, not corporate dashboard. Cream page, near-white cards, terracotta doing the pointing.

## Semantic mapping — use these, not the raw names

| Role | Token |
|---|---|
| Page background | `cream` |
| Card / input / modal background | `surface` |
| Primary button fill | `terracotta`, text `surface` |
| Primary button hover | `terracottaDark` |
| Secondary button | outline `forest`, text `forest`, transparent fill |
| Tertiary / ghost button | text `muted`, no border |
| Destructive | `terracottaDark` — there is no separate red in this palette |
| Body text | `ink` |
| Secondary text, timestamps, placeholders | `muted` |
| Section label (`CIRCLES`, `CIRCLE MEMBERS`, `DETECTED`) | `forest`, uppercase, letter-spaced |
| Border / divider | `line` |
| Disabled control | bg `line`, text `stale` |
| Active/selected list row | bg `terracottaTint`, text `terracottaDark`, 3px left bar `terracotta` |
| AI badge | bg `forest`, text `surface` |
| Star rating | `terracotta` filled, `line` empty |
| Like (active) | `terracotta` |
| Success toast | `forest` |
| Error toast / inline error | `terracottaDark` |

## Status pill colours

| Status | Inactive | Active |
|---|---|---|
| Want to read | text `muted`, border `line`, bg `surface` | bg `gold`, text `surface` |
| Reading | same | bg `terracotta`, text `surface` |
| Finished | same | bg `forest`, text `surface` |
| Read-only (other's profile) | text `stale`, bg `line`, no border, no hover | active status keeps its colour but is not clickable |

## Leaderboard rank badges

1st `gold` · 2nd `forest` · 3rd `sage` · rest — no badge, `muted` "···" row.

## Avatars & tags

Deterministic colour, so the same person is always the same colour:

```js
const AVATAR_COLORS = [terracotta, forest, sage, gold, slate];
const color = AVATAR_COLORS[hashToIndex(userId, AVATAR_COLORS.length)];
```

Avatar text is always `surface`.

## Mantine theme

`client/src/theme.js` — the single definition. Mantine needs 10-shade arrays; index 6 is the base shade Mantine uses by default.

```js
import { createTheme } from '@mantine/core';

export const palette = {
  cream: '#F7F0E1',
  surface: '#FFFDF8',
  terracotta: '#C96F4B',
  terracottaDark: '#B25E3C',
  terracottaTint: '#FBE9E0',
  forest: '#35594A',
  greenTint: '#E6EDE8',
  sage: '#6E8B7B',
  ink: '#3A322A',
  muted: '#8A7E70',
  line: '#EADFC9',
  stale: '#B9AE9C',
  gold: '#D9A45B',
  slate: '#6B7E8C',
};

export const theme = createTheme({
  primaryColor: 'terracotta',
  primaryShade: 6,
  white: palette.surface,
  black: palette.ink,
  colors: {
    terracotta: ['#FDF4F0','#FBE9E0','#F2CDBC','#E7AF97','#DC9174','#D28059','#C96F4B','#B25E3C','#964E32','#7A3F28'],
    forest:     ['#F2F6F4','#E6EDE8','#C6D6CD','#A5BFB1','#85A895','#6E8B7B','#35594A','#2E4C3F','#263F34','#1F3229'],
    gold:       ['#FDF7EE','#F8EAD3','#F0D5A8','#E8C07D','#E0AB52','#D9A45B','#C58F45','#A67739','#87602E','#684A23'],
    slate:      ['#F3F5F6','#E4E9EC','#C6D0D6','#A8B7C0','#8A9EAA','#6B7E8C','#5D6E7A','#4E5C66','#3F4B53','#30393F'],
    // neutral ramp used for text, borders, disabled states
    sand:       ['#FFFDF8','#F7F0E1','#EADFC9','#DDCEB4','#B9AE9C','#8A7E70','#6E6459','#544C43','#3A322A','#241F1A'],
  },
  defaultRadius: 'lg',
  radius: { sm: '8px', md: '12px', lg: '16px', xl: '24px' },
  shadows: {
    sm: '0 1px 2px rgba(58,50,42,0.06)',
    md: '0 4px 12px rgba(58,50,42,0.08)',
    lg: '0 10px 28px rgba(58,50,42,0.10)',
  },
  components: {
    Card:   { defaultProps: { radius: 'lg', shadow: 'md', bg: palette.surface, withBorder: false } },
    Button: { defaultProps: { radius: 'xl' } },
    Modal:  { defaultProps: { radius: 'xl', centered: true, overlayProps: { backgroundOpacity: 0.45, blur: 2 } } },
    Input:  { defaultProps: { radius: 'md' } },
  },
});
```

Set the page background once, globally:

```css
/* index.css */
body { background: #F7F0E1; }
```

## Usage in components

```jsx
import { palette } from '../theme';

<Button color="terracotta">Post</Button>
<Text c={palette.muted} size="sm">2h</Text>
<Box bg={palette.terracottaTint} style={{ borderLeft: `3px solid ${palette.terracotta}` }} />
```

Prefer Mantine's named colours (`color="terracotta"`, `c="forest.6"`) where the prop supports them; import `palette` only for `style` values Mantine has no prop for.

## Contrast — check before shipping

Safe pairs: `ink`/`cream`, `ink`/`surface`, `surface`/`terracotta`, `surface`/`forest`, `terracottaDark`/`terracottaTint`, `forest`/`greenTint`.

Do **not** use: `muted` on `terracotta`, `stale` on `cream` (fails at body size — fine for a 12px disabled label only), `gold` text on `cream`.

## Prohibited

Pure `#000` or `#FFF` · default Mantine blue anywhere · a separate green for success or red for error (the palette handles both) · gradients · more than one accent colour per card.
