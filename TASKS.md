# TASKS — work split for 2 people

From the instructor's feedback PDF (24 notes + task list). Ordered by priority: do Stage 1 before Stage 2, etc.

**Split:** both work full-stack on their own features. A owns the circle/social side, B owns the book/shelf side.

| | **Person A — Circles & Social** | **Person B — Shelf & Books** |
|---|---|---|
| Server | circles, posts, feed, likes, leaderboard | books, user_books, status, reviews, Gemini |
| Client | `FeedPage`, `LeaderboardPage`, `AppShell`, `AuthPage`, `circleStore` | `ProfilePage`, `AddBookModal`, `InterviewModal` |

**File rule:** A owns `AppShell.jsx`. B never edits it — `AddBookModal` is already wired in there, B only changes the modal's own file.

---

## ⚠️ First thing: A unblocks B

Three of A's files gate B's work. A does these **first** and pushes right away:

1. `server/src/models/post.model.js` with `createPost({ circleId, userId, type, userBookId })` — B calls it when adding a book / changing status
2. `server/src/middleware/requireCircleMember.js` — B's `POST /api/user-books` needs it
3. `client/src/stores/circleStore.js` with `activeCircleId` — B's AddBookModal needs it

B does this first (45 min, prevents merge conflicts): extract `BookCover`, `StarRating`, `StatusPills` into `src/components/`. `BookCard` is currently copy-pasted in 4 files.

Agree on the `Post` and `UserBook` JSON shapes from `docs/api-contract.md` before splitting up.

---

## Stage 1 — foundations (nothing else works without these)

**A**
- [ ] `POST /api/circles`, `POST /api/circles/join`, `GET /api/circles/:id` + invite code generator
- [ ] `circleStore` + real circles sidebar and members sidebar (replaces hardcoded lists)
- [ ] New-circle / join modal → activates the `new circle` button *(note 21: name only, image optional → skip)*

**B**
- [ ] `book.model.findOrCreate` — ISBN, then title+author, then insert (`docs/database.md`)
- [ ] `POST /api/user-books` → creates the row **and** an `added` post via A's `createPost`
- [ ] `AddBookModal`: Manual + Search tabs working. Search reuses `booksApi.searchBooks`, which already exists and is currently unused *(note 15: title, author, page count, genre)*

✅ **Done when** two accounts in one circle can each add a book and rows land in `feed_posts`.

---

## Stage 2 — the instructor's task list

**A**
- [ ] `GET /api/circles/:id/feed` + `FeedPage` renders real posts *(note 7: simple text posts, no cover images)*
- [ ] Likes — `POST`/`DELETE /api/posts/:id/like`
- [ ] Note 5: highlight the active circle
- [ ] Note 6: loader while a circle's feed loads
- [ ] Note 9: show real date + time instead of `2h`
- [ ] Note 4: member avatars link to `/profile/:userId`

**B**
- [ ] `PATCH /api/user-books/:id` (status) → creates `started` post. Reject `finished` here with 400
- [ ] `GET /api/users/:id/books?status=` + `ProfilePage` on real data (real name/avatar from the logged-in user)
- [ ] Change route `/profile` → `/profile/:userId` — **tell A, they link to it**
- [ ] Note 12: status pills interactive only on your own profile — **enforce server-side too, not just hidden buttons**
- [ ] Note 13: "are you sure?" on status change, but **not** for `finished` (the interview covers that)
- [ ] Note 10: show book details in the profile list · Note 11: link rows to the existing `BookDetailsPage`

---

## Stage 3 — ratings, interview, polish

**A**
- [ ] `GET /api/circles/:id/leaderboard?period=month|year` — 3 categories: books read, pages, genres
- [ ] `LeaderboardPage` wired (the existing `LeaderboardCard` is reusable) *(note 19: real member list, remove the `". . ."`)*
- [ ] Notes 1, 2, 3: home button in navbar, real logo, bigger bottom margin
- [ ] Notes 22–24: route the orphaned `WelcomePage` at `/`, `AuthPage` at `/auth`, "Welcome" not "Welcome back", add a register button
- [ ] Note 20: about button explaining the app
- [ ] Task: make logout smooth

**B**
- [ ] `InterviewModal` revived — opens on status → `finished` *(note 16)*, with `post` + `cancel` buttons at the bottom *(note 17, missing from the mockup)*
- [ ] `POST /api/user-books/:id/review` — transactional: save review, flip status + `finished_at`, create `finished` post. All three or none
- [ ] `gemini.js` for the article, with a template fallback so a failed API call never blocks the demo

**Both, last:** toasts on every mutation (`notifications.show()` is currently called zero times), loading/empty/error states, seed data so the leaderboard isn't all zeros.

---

## Cut / deferred

- **Comments** — instructor approved deferring: *"אפשר להשאיר את הפיצ'ר של תגובות לשלב ב', ולהתחיל רק עם לייקים"* (note 8). Likes only.
- **Photo scan** (note 14, *"אם זה אפשרי"*) — stretch. Needs `multer` + `gemini.js` + `storage.js`, all missing. Only after Stage 3 is green.
- **Reading-streak category** — note 18 names only 3 as certain.
- **Circle images** — note 21 says the name is required, image optional.

## Decisions to make

- **The `post` composer button** is on the task list, but the DB `type` check only allows `started`/`added`/`finished`. Adding free-text posts = one-line migration adding `'text'` (`user_book_id` is already nullable for this). ~1h, A's side.
- **Leaderboard period**: the PDF says monthly **and yearly** (*חודשי ושנתי*), but `docs/api-contract.md` says `month|all`. Pick one and update the doc.

## Before submitting

- Delete `server/test_google.js`, `test_ol*.js` (scratch files)
- Delete `client/src/api/auth.js` — it calls `/auth/login` and `/auth/register`, which don't exist
- Test with **two Google accounts in two browser profiles** — single-user testing hides every authorization bug
- Verify a user can't PATCH someone else's `user_books` row (should be 403)
