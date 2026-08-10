# features/add-book.md

The Add-a-Book modal and its three entry methods. Load with `api-contract.md`; add `integrations/ai-gemini.md` for scan and `integrations/books-api.md` for search.

## The point

Friction is the enemy. The three methods are presented in speed order and the fastest one is visually promoted:

1. **Snap the cover** — primary. AI reads title/author from a photo.
2. **Search** — by title or author.
3. **Enter manually** — full typed form.

Whichever route is taken, a book lands on the shelf as **`status: 'want'`** and produces an `added` feed post. No exceptions.

## Modal structure

Title `Add a Book`, subtitle `How would you like to add it?`, then three selectable tiles (`design/ui-patterns.md` → "Selectable tile"):

| Tile | Icon | Subtitle | Styling |
|---|---|---|---|
| Snap the cover | camera | "Fastest — AI reads the title and author for you" | promoted: `terracottaTint` bg, `terracotta` border, `AI` badge top-right |
| Search | magnifier | "Find it by title or author" | default |
| Enter manually | pencil | "Type in the details yourself" | default |

Selecting a tile expands its panel below the tiles. The tiles stay visible so the user can switch methods without closing. Below, a `DETECTED` / `RESULTS` section appears when there's something to show.

Modal max-width 560, full-screen below 768px.

## Method 1 — Snap the cover

**Client**

- `@mantine/dropzone` accepting `image/*`, max 5MB. On mobile, also render a plain `<input type="file" accept="image/*" capture="environment">` so the camera opens directly.
- Show a local preview immediately (`URL.createObjectURL`).
- POST as `multipart/form-data`, field `image`, to `/api/books/scan`.
- **The wait is 3–6 seconds.** Show explicit staged copy, not a bare spinner: "Uploading…" → "Reading the cover…" → "Looking up the book…". This is the app's signature moment; make it feel deliberate.

**Server — `POST /api/books/scan`**

```
multer (memory, 5MB, image/* only)
  → upload buffer to Supabase Storage bucket `book-scans`   (integrations/storage.md)
  → Gemini vision: image → { title, author, confidence }    (integrations/ai-gemini.md)
  → Google Books lookup on "title author"                   (integrations/books-api.md)
  → merge: Gemini wins on title/author; Books API fills genre, pageCount, coverUrl, isbn
  → 200 { candidate, scanUrl, confidence }
```

Nothing is saved to `books` or `user_books` here. The scan endpoint only *identifies*.

**Result handling**

- `confidence: 'high'` and a Books API match → render the `DETECTED` card: cover, title, author, `Fiction · 304 pages`, and the three status pills with `Want to read` preselected. Primary `Add to shelf`.
- `confidence: 'low'`, or no Books API match → render the **manual form pre-filled** with whatever Gemini read, plus a `muted` note: "We weren't sure — check the details before adding." Never silently save a wrong guess.
- Gemini read nothing → `422`, toast "We couldn't read that cover. Try better lighting, or search instead." and switch the user to the Search tab.

The detected card always allows editing before adding — an `Edit details` ghost link that swaps to the pre-filled manual form.

## Method 2 — Search

Input with a `muted` magnifier, debounced 400ms, minimum 2 characters. `GET /api/books/search?q=&limit=10`.

Results are rows: 40×60 cover, title (`h3`), author (`small muted`), `genre · N pages`. Clicking a row selects it and shows the same confirm card as the detected state.

Empty results → inline `muted` line: "No matches. Try a different spelling, or enter it manually." with a link to the manual tab. Never leave a dead end.

Search hits Google Books through the server — the API key stays server-side and we can normalise the messy response shape in one place.

## Method 3 — Enter manually

This is where the data-validation requirement is most visible. Build the validation properly here.

| Field | Required | Rule | Error message |
|---|---|---|---|
| Title | yes | 1–300 chars, trimmed | "Title is required." |
| Author | no | ≤200 | — |
| Genre | no | ≤100, free text or a Select of common genres | — |
| Page count | no | integer > 0, ≤20000 | "Page count must be a positive number." |
| Cover URL | no | valid URL | "Please enter a valid image URL." |
| ISBN | no | ≤20, digits/`X`/dashes | "That doesn't look like an ISBN." |

Same Zod rules on both sides. Client validates on blur and submit; the server validates regardless and returns `422` with a `details` map that the client renders inline.

A genre `Select` with ~12 common genres plus free entry is better than a bare text input — it keeps the "Various Genres" leaderboard category meaningful instead of splitting on "Sci-Fi" vs "Science Fiction".

## Adding — `POST /api/user-books`

```
validate(createUserBookSchema)
  → book.model.findOrCreate()      ISBN match → title+author match → insert  (database.md)
  → user_books insert { userId, bookId, status: 'want', source }
       23505 unique violation      → 409 "This book is already on your shelf."
  → feed_posts insert { type: 'added', circleId }
  → 201 { userBook }
```

`source` is `'scan' | 'search' | 'manual'` and is required — it's cheap analytics and it proves in the demo that all three paths work.

`circleId` comes from the client's active circle and is checked with `requireCircleMember`.

## After success

Close the modal → toast "Added to your shelf." → refetch the feed (a new `added` post is there) and, if the user is on their own profile, refetch the Want-to-read tab.

## Status pills inside this modal

The confirm card shows the three pills with `Want to read` preselected. The user *may* pick `Reading` or `Finished` up front:

- Choosing **Reading** here still shows the "Are you sure?" confirmation (`features/book-status.md`).
- Choosing **Finished** here adds the book, then immediately opens the interview modal — it cannot be marked finished without a review.

Simplest correct implementation: always create the book as `want`, then apply the chosen transition through the normal status path. One code path, no duplicated rules.

## Rules that are easy to get wrong

- Every book starts as `want`, whatever the entry method.
- The scan endpoint saves nothing; only `POST /api/user-books` writes.
- Duplicates are a friendly 409, never a 500.
- The scan image goes to Supabase Storage (external media storage is a course requirement) — books-API cover art stays as an external URL and is **not** re-hosted.
- Gemini's title/author beat the Books API's; the Books API's metadata beats Gemini's guesses.

## Out of scope

Barcode/ISBN scanning · bulk import · Goodreads import · editing a book's catalog metadata after adding · removing a book from the shelf.
