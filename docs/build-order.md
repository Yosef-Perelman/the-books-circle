# build-order.md

What to build, in what order, and what to cut when time runs short. 3 people, 5 days.

## Dependency order (the part that actually matters)

```
env + supabase project + schema
        ↓
auth (server) ──→ auth (client) ──→ protected routes + AppShell
        ↓
circles (server + client)          ← nothing circle-scoped works without this
        ↓
add-book: manual ──→ search ──→ scan
        ↓
feed (posts appear from add-book)
        ↓
status pills + confirm dialog
        ↓
interview + review article ──→ finished posts in the feed
        ↓
profile ──→ leaderboard
        ↓
responsive pass ──→ deploy ──→ seed ──→ rehearse
```

Two hard rules:

1. **Nothing circle-scoped can be built before circles exist.** The feed, leaderboard, and every post need a `circleId`.
2. **Build add-book manual-first.** Manual entry needs no external API, so the feed becomes testable on day 2 without waiting on Gemini or Google Books.

## Ownership split

| Person | Owns |
|---|---|
| A | Express skeleton, auth, validation, error middleware, Supabase schema + models |
| B | Feed, posts, likes, comments, leaderboard queries, profile data |
| C | React shell, Mantine theme, routing, all modals, Gemini + Books integrations |

Everyone builds their own screens against their own endpoints. A owns `api-contract.md`; changes to it get announced, not silently made.

## Day by day

### Day 1 — foundation
- [ ] Supabase project, `001_init.sql` applied, `book-scans` bucket created
- [ ] Both `package.json`s, `.env.example`, `env.js` boot validation
- [ ] Express skeleton: `app.js`, routes index, `errorHandler`, `ApiError`, `asyncHandler`
- [ ] `POST /register`, `POST /login`, `GET /me`, `requireAuth`
- [ ] Vite + Mantine theme from `design/colors.md` + `design/fonts.md`
- [ ] Router, `ProtectedRoute`, `AppShell`, `authStore`
- [ ] Welcome + Auth screens, working end to end

**Day 1 is done when** you can register, log in, refresh the page, and stay logged in.

### Day 2 — circles + books on the shelf
- [ ] Circle create / join / detail, `requireCircleMember`, invite codes
- [ ] Circles + members sidebars, `circleStore`, active-circle switching
- [ ] `POST /api/user-books` + `book.model.findOrCreate` + `added` feed post
- [ ] Add-a-Book modal shell + **manual** tab with full validation
- [ ] `GET /api/circles/:id/feed` + light post cards

**Day 2 is done when** two accounts in one circle can each add a book manually and see each other's posts.

### Day 3 — the differentiator
- [ ] `gemini.js` — all three functions
- [ ] `googleBooks.js` + `GET /api/books/search` + Search tab
- [ ] `storage.js` + `POST /api/books/scan` + Scan tab
- [ ] Status pills, confirm-reading dialog, ownership check, `started` posts
- [ ] Interview modal + `POST /review` + article generation + `finished` posts
- [ ] Likes and comments

**Day 3 is done when** the full loop works: snap a cover → add → start reading → finish → interview → article in the feed. **This is the demo.** If day 3 slips, cut from day 4, not from here.

### Day 4 — the rest of the surface
- [ ] Profile page, tabs, book rows, read-only pills on others' profiles
- [ ] Leaderboard: all four categories, both periods, ranks and ties
- [ ] Responsive pass — every screen at 375px, sidebars as drawers, modals full-screen
- [ ] Every loading / empty / error state from the feature docs
- [ ] Deploy all three pieces (`deployment.md`) — **deploy today, not day 5**

### Day 5 — polish and rehearse
- [ ] Seed data with `finished_at` spread across months
- [ ] Walk every screen looking for hardcoded colours, missing error states, `console.log`s
- [ ] Check the authorization holes yourself (`api-contract.md` checklist)
- [ ] README with setup steps and screenshots
- [ ] Rehearse the demo **twice**, on the deployed URL, on a phone-sized window too

## Cut list, in the order you cut

Under time pressure, drop from the top:

1. Comments (keep likes)
2. Search tab (keep manual + scan — scan is the wow, manual is the fallback)
3. Leaderboard streak category (ship three categories)
4. Monthly/All-time toggle (ship all-time only)
5. Scan-image downscaling
6. Multi-circle sidebar polish

**Never cut:** the scan flow, the interview, the article, auth, validation, the read-only-pills rule, the responsive pass. Those are either the demo or the grade.

## Demo script (5 minutes)

1. Log in as a seeded user — feed already has activity. *(One sentence on the problem: nobody logs the books they read.)*
2. Add a book by **snapping a cover**. Narrate the wait: Gemini reads it, Google Books fills the rest.
3. Move it to **Reading** — the confirmation appears. Show the new post in the feed.
4. Mark a book **Finished** → the interview → answer two questions → Post → **the article appears in the feed.** Pause here; this is the moment.
5. Open another member's profile — their pills are read-only. Mention the server enforces it too.
6. Leaderboard, toggle Monthly → All-Time.
7. Close on the architecture: React/Zustand/Mantine · Express MVC with JWT, Zod, unified errors · Supabase Postgres + Storage · Gemini for vision and text.

Have two browser profiles logged in as different circle members before you start. Never register a new account live.

## Known gaps to state before you're asked

No rate limiting on login · no password reset · no tests · no pagination · no realtime (the feed refetches) · orphaned scan images are never cleaned up · one retry on AI failures.

Naming a limitation yourself reads as judgment. Being caught by it doesn't.
