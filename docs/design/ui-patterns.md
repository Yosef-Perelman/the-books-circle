# design/ui-patterns.md

Layout, spacing, and the recurring components. Load with `colors.md` + `fonts.md` for any screen work.

## Feel

Warm, rounded, generous. Soft shadows instead of hard borders. Nothing sharp-cornered, nothing dense. If a screen looks like an admin dashboard, it's wrong.

## Spacing

4px base. Use `4 · 8 · 12 · 16 · 24 · 32 · 48`. Nothing in between.

| Context | Value |
|---|---|
| Inside a card | 20px (16px mobile) |
| Between stacked cards | 16px |
| Between form fields | 16px |
| Page gutter | 24px desktop / 16px mobile |
| Between sidebar rows | 8px |
| Icon to its label | 8px |
| Section label to content | 12px |

## Radii & shadows

| Element | Radius | Shadow |
|---|---|---|
| Card, post, book row | 16px | `md` — `0 4px 12px rgba(58,50,42,0.08)` |
| Modal | 24px | `lg` |
| Button, pill, tab, avatar-adjacent chip | 999px (fully round) | none |
| Input, textarea, small tile | 12px | none, 1px `line` border |
| Book cover | 8px | `sm` |
| Avatar | circle | none |

Never combine a visible border and a shadow on the same element. Cards get the shadow; inputs get the border.

## Layout

### Desktop (≥768px)

```
┌──────────────────────────────────────────────────────────┐
│ navbar: wordmark ······ avatar · Profile · Leaderboard · Logout │ 64px, bg surface, 1px line bottom
├──────────┬─────────────────────────────┬─────────────────┤
│ CIRCLES  │        feed / page          │ CIRCLE MEMBERS  │
│  240px   │      flex, max 680px        │      280px      │
│          │                             │                 │
└──────────┴─────────────────────────────┴─────────────────┘
```

Centre column is centred in remaining space and capped at 680px. Sidebars are sticky below the navbar and scroll independently. Page background `cream`; sidebars have **no** background fill — they sit directly on cream. Only cards use `surface`.

### Mobile (<768px)

Single column, 16px gutters. Navbar keeps the wordmark and collapses nav into a burger menu. Two icon buttons in the navbar open the sidebars as Mantine `<Drawer>`s — circles from the left, members from the right. Modals go `fullScreen`. Feed cards go edge-to-edge minus the gutter.

Profile tabs and the leaderboard's 2×2 grid both become a single column. The leaderboard's All-Time/Monthly toggle stays a full-width segmented control.

## Recurring components

### Navbar
Wordmark (serif, terracotta, with the rounded-square book glyph) left. Right: user avatar, then `Profile` / `Leaderboard` / `Logout` as text links, 15px. Active link is `terracotta` semibold; the others are `ink` regular, hovering to `muted`. Logout is always `muted`.

### Sidebar section
Uppercase `label`-token heading in `forest`, then rows. A row is: 32px coloured circle + name, 12px padding, 999px radius, hover `bg: greenTint`.

**Active row** (active circle): `bg: terracottaTint`, text `terracottaDark` semibold, 3px `terracotta` bar on the left edge.

The circles list ends with a **dashed** `+ New circle` button — 2px dashed `terracotta` border, transparent fill, terracotta text.

The members list ends with a `muted` footer: `5 members · code F1-8KZQ`, the code in mono. Tapping it copies the code and toasts "Invite code copied."

### Card
`bg surface`, radius 16, shadow `md`, padding 20. No border. Hover on interactive cards: shadow `md → lg`, 120ms ease.

### Buttons

| Variant | Look |
|---|---|
| Primary | filled `terracotta`, `surface` text, 600, radius 999, height 40 (44 mobile), 20px horizontal padding |
| Secondary | outline 1px `forest`, `forest` text, transparent |
| Ghost | `muted` text, no border, no fill |
| Dashed | 2px dashed `terracotta`, transparent — "+ New circle" only |
| Disabled | `bg line`, `stale` text, no shadow, `cursor: not-allowed` |

Icon buttons are 36px circles, `muted` icon, hover `bg greenTint`.

### Status pills
Three pills in a row, 8px gap, `pill` type token, height 30, horizontal padding 14, radius 999.

- Inactive: `bg surface`, 1px `line` border, `muted` text.
- Active: filled — `gold` / `terracotta` / `forest` for want / reading / finished, `surface` text.
- **Read-only** (someone else's profile): the active pill only, no border, `bg line`, `stale` text, no hover, no cursor change, not focusable. The other two pills are not rendered at all.

`StatusPills` takes `{ value, onChange, readOnly }`. That single prop is the whole rule — see `features/book-status.md`.

### Tabs
Mantine `<Tabs>` styled as a pill group: container `bg greenTint` radius 999 padding 4; active tab `bg surface`, `ink` semibold, shadow `sm`; inactive `muted`. Used on Profile (Want/Reading/Finished) and Auth (Log in / Create account).

### Segmented control
Leaderboard's All-Time / Monthly. Same look as tabs, but the active segment is filled `terracotta` with `surface` text.

### Inputs
Height 44, radius 12, `bg surface`, 1px `line` border, 14px horizontal padding. Focus: border `terracotta`, 3px `terracottaTint` ring, no default browser outline. Error: border `terracottaDark`, message below at 12px in `terracottaDark`. Placeholder `muted`. Labels sit above at 13px 600 `ink`.

### Modal
Radius 24, `bg surface`, padding 28 (20 mobile), max-width 560 (640 for the interview), centred. Overlay `rgba(58,50,42,0.45)` with 2px blur. Title is `h1`; a `muted` subtitle line may follow. Actions bottom-right: ghost Cancel, then primary. Full-screen below 768px. Escape and overlay click both close — **except** the interview modal mid-answer, which confirms first.

### Selectable tile
Used by the Add-a-Book method picker. Full-width row: 44px rounded-square icon box + title (`h3`) + `muted` subtitle, optional badge right, radius 12, padding 16.

- Default: `bg surface`, 1px `line`.
- Recommended/selected: `bg terracottaTint`, 1.5px `terracotta` border, title `terracottaDark`, icon box `surface`.
- The AI badge sits top-right: `bg forest`, `surface` text, 11px 700, radius 999, padding 3×10.

### Book cover
Aspect 2:3, radius 8, shadow `sm`. Sizes: 40×60 in a lightweight feed post, 64×96 in a finished post or profile row, 88×132 in the interview modal.

**Fallback when `coverUrl` is null:** a solid tile in a deterministic palette colour (terracotta / forest / gold / sage / slate, hashed from the book id) with the title's first two words stacked in 10px 700 `surface` uppercase. Never render a broken image icon.

### Avatar
Circle, deterministic palette colour, first initial in `surface` 600. 32px in sidebars and comments, 40px in post headers and the navbar, 72px on the profile header.

### Star rating
Terracotta filled stars, `line` empty, half-star support, then the numeric value in `muted` 13px. 16px stars in the feed, 14px on profile rows. Input mode (interview modal) uses 28px stars with hover preview.

### Empty state
Centred: 40px `stale` icon, one `h3` line, one `muted` `small` line, optional primary button. Every list needs one — an empty feed, an empty shelf tab, an empty leaderboard category, a member with no circles.

### Toast
`@mantine/notifications`, top-right desktop / top mobile. Radius 12, shadow `lg`, 5s. Success `forest` accent, error `terracottaDark`. One line, no title.

## Motion

Fast and quiet. 120ms hovers, 180ms modal fade+scale (0.98→1), 200ms drawer slide. Skeletons pulse at 1.2s. The like heart gets a 200ms scale pop (1→1.25→1). Nothing else animates. Respect `prefers-reduced-motion`.

## Accessibility floor

Every icon-only button has `aria-label`. Modals trap focus and restore it on close. Focus rings are visible (3px `terracottaTint`) and never removed without replacement. Tap targets ≥44px on mobile. Status is never conveyed by colour alone — the pills carry text.

## Where the mockups are wrong

The PNGs predate three decisions. Build to these:

1. **No book cover on `finished` feed posts.** Title, author, stars, article — that's it. (The mockup shows a cover.)
2. **No stats line on the profile header.** Avatar and name only. (The mockup shows counts.)
3. **Status pills are read-only on other members' profiles.**

Everything else in the mockups is accurate and should be followed.
