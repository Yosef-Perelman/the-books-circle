# features/profile.md

`/profile/:userId` — a member's shelf across three tabs. Load with `features/book-status.md`.

## Scope

Any circle member's profile is viewable, not just your own. **The same page renders both cases**; one derived boolean changes the behaviour:

```js
const isOwnProfile = params.userId === authStore.user.id;
```

Everything conditional flows from that. No separate `OwnProfilePage`.

## Layout

```
┌────────────────────────────────────────────────┐
│  (72px avatar)   Avi                           │   ← header
├────────────────────────────────────────────────┤
│  [ Want to read | Reading | Finished ]   [+ Add book]
├────────────────────────────────────────────────┤
│  book row                                      │
│  book row                                      │
└────────────────────────────────────────────────┘
```

### Header
72px avatar + display name (`h1`). **Nothing else.**

**No stats line.** The mockup shows books-read / reviews-written counts — that was cut from scope. Do not build it.

### Tabs
`Want to read` · `Reading` · `Finished`, styled as the pill tab group (`design/ui-patterns.md`). Default tab is **Want to read**. Tab state lives in the URL query (`?tab=reading`) so it survives a refresh and a back-navigation.

Each tab shows its count as a `muted` number beside the label — `Reading 3`. (This is a per-tab count, not the removed stats line.)

### `+ Add book`
Top right, primary, **own profile only**. Opens `AddBookModal`.

## Book row

```
[64×96 cover]   The Hobbit
                J.R.R. Tolkien
                ★★★★☆ 4.5
                "review snippet clamped to two lines…"
                [Want to read] [Reading] [Finished]
```

- Cover: 64×96, with the coloured-tile fallback (`design/ui-patterns.md`).
- Title `h3`, author `small muted`.
- Stars + numeric rating — **only if a review exists** (Finished tab, in practice).
- Review snippet: `article_text` clamped to 2 lines, `muted`. The full article lives in the feed post; the profile is a shelf, not a reading view.
- Status pills at the bottom.

Rows are cards (`surface`, radius 16, shadow `md`), 12px apart.

## The read-only rule

Covered fully in `features/book-status.md`. The short version:

```jsx
<StatusPills value={ub.status} onChange={handle} readOnly={!isOwnProfile} />
```

On someone else's profile: only the active pill renders, in `bg line` / `stale` text, non-interactive, not focusable. The books themselves and their reviews are fully visible — this is a social app, seeing what your friends read is the point.

And the server refuses a non-owner's mutation independently (`403`). The client hiding pills is UX; the server check is security.

## Data

`GET /api/users/:id/books?status=want|reading|finished`

- `403` if the viewer shares no circle with `:id` — you can't browse strangers' shelves.
- Response is **identical** for own vs. other profiles. Ownership is decided by the client for rendering and by the server for writes; the read payload doesn't differ.
- Includes the user object so the header can render without a second request.

Fetch per tab, on tab change, and cache the three results in page-local state so switching back is instant. No global store for this.

## States

| Case | Render |
|---|---|
| Loading | 3 skeleton book rows |
| Fetch failed | `<ErrorBanner>` with Retry |
| Own profile, empty tab | Empty state + primary `Add a book` |
| Other's profile, empty tab | Empty state, no action button — "Nothing here yet." |
| `:userId` not a circle-mate | Full-page 403 state: "You can only view profiles of people in your circles." |
| `:userId` doesn't exist | 404 state with a link back to the feed |

Empty-state copy per tab, own profile: "No books on your want-to-read list yet." / "You're not reading anything right now." / "You haven't finished a book yet — finish one to write your first review."

## Navigation into the profile

- Members sidebar rows → `/profile/:id`
- Post author names and avatars → `/profile/:id`
- Comment author names → `/profile/:id`
- Navbar `Profile` → `/profile/${currentUser.id}`

There is no `/profile/me` route. Always link the real id.

## Mobile

Single column, 16px gutters. Header centred. Tabs full-width. `+ Add book` becomes a full-width button below the tabs rather than a floating top-right control. Book rows stack cover-left/text-right as on desktop — they already fit at 375px.

## Rules that are easy to get wrong

- No stats line in the header, despite the mockup.
- Pills read-only on others' profiles, and the server enforces it too.
- `+ Add book` on your own profile only.
- The review snippet is clamped; the full article is in the feed.
- Default tab is Want to read, and the tab is in the URL.
- One page component for both cases.

## Out of scope

Editing your display name or avatar · following people outside your circles · a books-read count anywhere on this page · sorting or filtering shelves · removing a book.
