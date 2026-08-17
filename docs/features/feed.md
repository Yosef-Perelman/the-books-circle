# features/feed.md

The home screen: circle-scoped post feed, likes, comments. Load with `api-contract.md`.

## What the feed is

The app's home (`/feed`). A reverse-chronological list of everything that happened in the **active circle**. Posts are not written by users — they are produced automatically by three actions. There is no free-text posting in MVP.

| Action | Post type | Weight |
|---|---|---|
| Added a book to want-to-read | `added` | light |
| Moved a book to Reading | `started` | light |
| Finished a book (review submitted) | `finished` | rich |

Posts are created by the service that caused them (`database.md` → "Feed post creation"). The client never calls a create-post endpoint.

## Layout

Desktop three columns — circles sidebar · feed · members sidebar (`design/ui-patterns.md`). Feed column max-width 680px, 16px between cards.

### Composer (top of the feed)
Card with a rounded input reading `Add a post — what are you reading?` and a primary `+ Post` button.

**In MVP the composer opens `AddBookModal`.** It is not a text box — clicking anywhere in it opens the add-book flow. The placeholder copy is aspirational; wire the whole card as one button. (If free-text posts get added later, `feed_posts.user_book_id` is already nullable.)

### Light post (`added` / `started`)
```
avatar  Ben
        added "Harry Potter and the Sorcerer's Stone" to want to read · 10 Aug, 14:32
```
**No cover — instructor note 7 asked for these simpler than the mockup.** One sentence combining the verb and the title, no separate title/author lines. No stars, no article, no like/comment bar. Verb: `started reading "<title>"` / `added "<title>" to want to read`.

### Rich post (`finished`)
```
avatar  Avi
        finished a book · 10 Aug, 14:32
        The Hobbit
        J.R.R. Tolkien
        ★★★★☆  4.5
        "…the generated article, serif, 16/1.7…"
        ────────────────────────────
        ♥ 7
```

**No cover image on `finished` posts.** The mockup shows one; the spec removed it. Title, author, stars, article.

The article renders in the serif at 16/1.7 wrapped in curly quotes (`fonts.md`). Clamp to 8 lines with a `muted` `Read more` toggle if longer — the AI is instructed to stay around 150 words, but don't let a long one blow up the feed.

### Reactions bar
`finished` posts only in MVP. **Heart with count — no comment icon.** Comments are deferred to phase B (instructor-approved, see `TASKS.md` note 8), so nothing renders an affordance that doesn't work yet. The API still returns `commentCount` for forward compatibility; the UI just doesn't display it.

Heart is **optimistic** — flip `likedByMe` and `likeCount` immediately, 200ms scale pop, revert + toast on failure.

## Empty & error states

| Case | Render |
|---|---|
| No active circle | Join-or-create empty state, auto-open the modal (`circles.md`) |
| Circle has no posts | Empty state: "Nothing here yet" / "Add a book to get your circle started." / primary `Add a book` |
| Fetch failed | `<ErrorBanner>` with Retry, in place of the list |
| Loading | 3 skeleton post cards, not a spinner |

## Server — `GET /api/circles/:id/feed`

`requireAuth` → `requireCircleMember` → one embedded query (`database.md` → "Circle feed"), `created_at desc`, limit 50.

The model collapses `reactions` and `comments` into counts before responding:

```js
likeCount: p.reactions.length,
likedByMe: p.reactions.some(r => r.user_id === viewerId),
commentCount: p.comments.length,
```

Never send raw reaction rows to the client — it's a privacy leak (who liked what) and needless payload.

`viewerId` comes from `req.user.id`, threaded into the service. It is not a query param.

## Likes

`POST /api/posts/:id/like` inserts, `DELETE` removes. Both **idempotent** — double-liking returns 200 with the current count, it does not 409. The `unique (post_id, user_id)` constraint does the real work; catch `23505` and treat it as success.

Both check that the post's circle is one the caller belongs to → else `404`, not `403` — same rule as `requireCircleMember`: never reveal a post in a circle you're not in. There's no `requireCircleMember` here (the route only carries a post id, not a circle id), so `post.service.js` resolves the post's `circle_id` and checks membership by hand.

Return `{ likeCount, likedByMe }` so the client can reconcile against its optimistic guess.

## Comments

**Deferred to phase B** — instructor-approved (`TASKS.md` note 8: ship likes only first). Not built in this stage; the contract below is the target once comments are picked up.

`GET /api/posts/:id/comments` — oldest first, no pagination (cap at 100).
`POST /api/posts/:id/comments` — Zod: trimmed, 1–1000 chars. Returns the created comment with its user embedded so the client can append without refetching.

No editing, no deleting, no nesting, no mentions.

## Refresh strategy

No websockets, no polling. The feed refetches on:

- `FeedPage` mount
- `activeCircleId` change
- after any mutation that creates a post (add book, start reading, submit review)

That last one is a plain `loadFeed()` call after the mutation resolves. Good enough — and honest in the demo.

## Client shape

```
FeedPage
├── PostComposer            → opens AddBookModal
└── PostCard  (per post)
    ├── PostHeader          avatar, name → /profile/:id, verb line, absolute timestamp
    └── (light body | rich body + like button, finished only)
```

`PostCard` switches on `post.type`. The two bodies are kept separate inside the file — they share only the header — rather than as their own exported components, since neither is used anywhere else.

Feed data is **page-local state**, not a store. It refetches on mount.

## Rules that are easy to get wrong

- No cover on **any** post type, light or rich.
- Light posts have no reactions bar.
- The composer is a button, not a text field.
- Names and avatars in posts link to `/profile/:userId`.
- **Timestamps are absolute** (`10 Aug, 14:32`, or `10 Aug 2025, 14:32` in a prior year) per instructor note 9 — this supersedes `fonts.md`'s relative-timestamp rule for the feed specifically.
- Posts belong to a circle. Switching circles shows a completely different feed — never merge them.

## Out of scope

Free-text posts · post editing/deleting · emoji reactions beyond the heart · notifications · pagination/infinite scroll · realtime · sharing outside the circle.
