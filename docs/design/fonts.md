# design/fonts.md

Typography. Load with `colors.md` for any UI work.

## The one rule

**Sans-serif for everything. Serif only for the wordmark and a handful of decorative headings.** The serif is a literary wink, not the app's voice. Using it broadly makes the product feel like a 2009 blog.

## Families

| Role | Stack | Where |
|---|---|---|
| **Sans** (default) | `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` | All UI, all body copy, all data |
| **Serif** (accent) | `Georgia, 'Iowan Old Style', 'Times New Roman', serif` | Wordmark, auth panel headline, review article body |
| **Mono** | `ui-monospace, SFMono-Regular, Menlo, monospace` | Invite codes only |

Inter loads from Google Fonts (weights 400/500/600/700). If it hasn't loaded, the system stack is a clean fallback — do not block render on it.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Georgia is a system font. Do not load a webfont for it.

## Where serif is allowed — exhaustive list

1. The wordmark **"The Reading Circles"** — navbar, auth panel, welcome page.
2. The auth screen's decorative left-panel headline ("A cosy corner for you and your reading circle.").
3. The welcome page hero headline.
4. **The generated review article body** in a `finished` feed post — this is the "newspaper" cue and it earns the serif. 16px/1.7, colour `ink`, wrapped in curly quotes.

Everywhere else: sans. Book titles are sans, semibold. Section labels are sans.

## Type scale

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 34 / 1.2 | 700 serif | Welcome hero, auth panel headline |
| `wordmark` | 24 / 1.2 | 700 serif | Navbar logo (18px on mobile) |
| `h1` | 26 / 1.3 | 700 | Page titles — "Leaderboard", "Add a Book" |
| `h2` | 20 / 1.35 | 600 | Card titles, modal section headings, member name on profile |
| `h3` | 16 / 1.4 | 600 | Book title in a post or row |
| `body` | 15 / 1.6 | 400 | Default text, comments, descriptions |
| `article` | 16 / 1.7 | 400 serif | The AI review article only |
| `small` | 13 / 1.45 | 400 | Author names, "started reading · 2h", helper text |
| `label` | 12 / 1.3 | 700, `+0.08em` tracking, UPPERCASE | `CIRCLES`, `CIRCLE MEMBERS`, `DETECTED` |
| `pill` | 13 / 1 | 600 | Status pills, tabs, badges |
| `code` | 14 / 1.4 | 600 mono, `+0.05em` | Invite codes |

Mantine mapping: `xs=12 · sm=13 · md=15 · lg=17 · xl=20`. `<Text size="sm">` is our `small`; `size="md"` is `body`.

## Weights

400 body · 500 emphasis inside body · 600 titles, buttons, pills, names · 700 wordmark, page titles, labels, ranks.

Never 300 or lighter — it disappears on a cream background. Never `italic` except the auth panel's pull-quote and the review's opening quote.

## Rules

- **Colour, not size, creates hierarchy.** Secondary info is `muted` at the same size, not smaller grey text.
- Line length in the feed and article caps at ~68 characters (`maxWidth: 640px`).
- Book titles never truncate to one line — wrap to two, then ellipsis (`-webkit-line-clamp: 2`).
- Review snippets on the profile clamp to 2 lines; the full article renders only in the feed post.
- Numbers in the leaderboard use `font-variant-numeric: tabular-nums` so ranks line up.
- Relative timestamps: `2h`, `4h`, `1d`, `3w`. Past 4 weeks, switch to `12 Mar`.
- Sentence case for buttons and headings ("Add a book", not "Add A Book"). UPPERCASE only for the `label` token.

## Mantine theme fragment

Merge into `theme.js` from `colors.md`:

```js
export const fonts = {
  sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "Georgia, 'Iowan Old Style', 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

// inside createTheme({...})
fontFamily: fonts.sans,
fontFamilyMonospace: fonts.mono,
headings: {
  fontFamily: fonts.sans,          // headings are SANS by default
  sizes: {
    h1: { fontSize: '26px', lineHeight: '1.3', fontWeight: '700' },
    h2: { fontSize: '20px', lineHeight: '1.35', fontWeight: '600' },
    h3: { fontSize: '16px', lineHeight: '1.4', fontWeight: '600' },
  },
},
fontSizes: { xs: '12px', sm: '13px', md: '15px', lg: '17px', xl: '20px' },
lineHeights: { xs: '1.3', sm: '1.45', md: '1.6', lg: '1.7', xl: '1.7' },
```

Serif is opt-in per component, never a default:

```jsx
<Text ff={fonts.serif} fz={24} fw={700} c="terracotta">The Reading Circles</Text>

<Text ff={fonts.serif} fz={16} lh={1.7} c={palette.ink}>
  {review.articleText}
</Text>
```

## Mobile adjustments

`display` 34 → 26 · `wordmark` 24 → 18 · `h1` 26 → 22. Body sizes stay put — 15px is already the mobile floor and shrinking it hurts readability. Never go below 12px anywhere.
