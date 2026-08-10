# features/leaderboard.md

`/leaderboard` — four ranked categories, scoped to the active circle, All-Time or Monthly. Load with `database.md`.

## Shape

A segmented control (All-Time / Monthly) above a **2×2 grid** of category cards. One column on mobile.

Each card: category title (`h2`), a one-line `muted` explanation, then the top 3 with rank badges, then a `muted` `···` row standing in for everyone else.

```
┌─── Read Books ────────────┐  ┌─── Various Genres ────────┐
│ Books finished this month │  │ Different genres finished │
│ ① Avi      7              │  │ ① Dan      5              │
│ ② Dan      5              │  │ ② Avi      4              │
│ ③ Ben      4              │  │ ③ Gadi     2              │
│ ···                       │  │ ···                       │
└───────────────────────────┘  └───────────────────────────┘
┌─── Most Pages ────────────┐  ┌─── Reading Streak ────────┐
```

Rank badges: ① `gold` · ② `forest` · ③ `sage`. A member row is avatar + name + value, value right-aligned with `tabular-nums`. Clicking a row goes to that member's profile.

## The four categories

| Key | Title | Measures | Value |
|---|---|---|---|
| `books` | Read Books | Count of books finished in the period | integer |
| `genres` | Various Genres | Count of **distinct** genres finished in the period | integer |
| `pages` | Most Pages | Sum of `page_count` of books finished in the period | integer |
| `streak` | Reading Streak | Longest run of **consecutive weeks** with ≥1 book finished | integer (weeks) |

`genres` exists to reward variety over volume — someone reading five different genres beats someone reading five thrillers.

## Streak definition — decided, don't re-open

**A streak is consecutive ISO weeks (Mon–Sun) in which the member finished at least one book.** The value is the longest such run within the period.

Weeks, not days, because almost nobody finishes a book daily — a daily streak would read `1` for everyone and the category would be dead weight in the demo.

Computed from `finished_at` at query time. **No streak table, no cron, no activity log.**

```js
// service-level, after fetching finished_at timestamps for a user in the period
const weeks = new Set(timestamps.map(isoWeekKey));       // "2026-W32"
const sorted = [...weeks].sort();
// longest run where week n+1 is exactly one ISO week after week n
```

Write `isoWeekKey(date)` in `server/src/utils/date.js` by hand. Do not add a date library for one function.

## Periods

| `period` | Window |
|---|---|
| `month` | Current calendar month, `[first of month 00:00, now]`, server timezone |
| `all` | Everything, no lower bound |

The default view is **Monthly** — a fresh start every month keeps a five-day-old app from looking permanently settled.

## API

**One request returns all four categories.** The page shows all four at once; four requests for one screen is wasteful.

```
GET /api/circles/:id/leaderboard?period=month|all
```

```jsonc
{ "data": { "period": "month",
  "categories": {
    "books":  [ { "rank": 1, "user": { id, displayName, avatarUrl }, "value": 7 }, ... ],
    "genres": [ ... ], "pages": [ ... ], "streak": [ ... ] } } }
```

Each array contains **every member**, ordered, including zeros — the client slices to 3. Returning everyone means the "···" row can show a real remainder count and a future "see all" is free.

`requireAuth` + `requireCircleMember`. Non-members get 403.

## Computation

No leaderboard table. No materialised view. One query, then aggregate in the service.

```
1. member ids  ← circle_members where circle_id = :id
2. rows        ← user_books
                   .select('user_id, finished_at, book:books(genre, page_count)')
                   .in('user_id', memberIds)
                   .eq('status', 'finished')
                   [.gte('finished_at', periodStart)]
3. group by user_id in JS:
     books  = rows.length
     genres = new Set(rows.map(r => r.book.genre).filter(Boolean)).size
     pages  = sum(r.book.page_count ?? 0)
     streak = longestConsecutiveWeeks(rows.map(r => r.finished_at))
4. for each category: sort desc, assign ranks with ties sharing a rank
5. include members with zero activity, value 0, ranked last
```

At bootcamp scale (a handful of members, tens of books) this is trivially fast and much easier to reason about than four SQL aggregations. If it ever mattered, it'd become a Postgres view — it won't.

## Ties

Tied values **share a rank**, and the next rank skips (1, 1, 3 — standard competition ranking). Within a tie, order by display name so the output is stable across refreshes. Never break a tie arbitrarily.

## Edge cases

| Case | Behaviour |
|---|---|
| No member has finished anything | Card renders an empty state: "No finished books yet this month." |
| Books with `genre = null` | Excluded from the distinct-genre count, not counted as a genre |
| Books with `page_count = null` | Counted as 0 pages |
| Everyone at 0 | Show the empty state rather than a list of zeros |
| Member with zero activity | Present in the array with value 0, ranked last, not shown in the top 3 |
| Circle with 1–2 members | Render however many exist; no placeholder rows |
| No active circle | Full-page join-or-create empty state (`features/circles.md`) |

## Client

`LeaderboardPage` holds `{ period, data, loading, error }` in local state. Changing the period refetches. Four `CategoryCard`s read from one response.

Loading → four skeleton cards. Error → `<ErrorBanner>` with Retry.

Category descriptions (render them — they make the ranking legible):

- Read Books — "Books finished{ this month}"
- Various Genres — "Different genres finished{ this month}"
- Most Pages — "Pages read{ this month}"
- Reading Streak — "Consecutive weeks with a finished book"

## Rules that are easy to get wrong

- One request, four categories.
- Genres are **distinct**, not total.
- Streaks are **weeks**, computed from `finished_at`, with no extra table.
- Only `status = 'finished'` rows count. Reading and want-to-read count for nothing.
- Ties share a rank.
- Everything is scoped to the active circle — never global.
- Default period is Monthly.

## Demo note

Seed `finished_at` values across the current month **and** earlier months, or the All-Time/Monthly toggle produces identical numbers and the feature looks broken on stage (`database.md` → Seed data).

## Out of scope

Per-category "see all" pages · historical months · badges/achievements · cross-circle rankings · charts · a points system combining categories.
