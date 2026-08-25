# features/add-book.md

The Add-a-Book modal and its two entry methods. Load with `api-contract.md` and `integrations/books-api.md` for search.

## The point

Friction is the enemy. The two methods are presented in speed order:

1. **Search** — by title or author.
2. **Enter manually** — full typed form.

Whichever route is taken, a book lands on the shelf as **`status: 'want'`** and produces an `added` feed post. No exceptions.

## Modal structure

Title `Add a Book`, subtitle `How would you like to add it?`, then two selectable tiles (`design/ui-patterns.md` → "Selectable tile"):

| Tile | Icon | Subtitle | Styling |
|---|---|---|---|
| Search | magnifier | "Find it by title or author" | default |
| Enter manually | pencil | "Type in the details yourself" | default |

Selecting a tile expands its panel below the tiles. The tiles stay visible so the user can switch methods without closing. Below, a `DETECTED` / `RESULTS` section appears when there's something to show.

Modal max-width 560, full-screen below 768px.

## Method 1 — Search

Input with a `muted` magnifier, debounced 400ms, minimum 2 characters. `GET /api/books/search?q=&limit=10`.

Results are rows: 40×60 cover, title (`h3`), author (`small muted`), `genre · N pages`. Clicking a row selects it and shows the same confirm card as the detected state.

Empty results → inline `muted` line: "No matches. Try a different spelling, or enter it manually." with a link to the manual tab. Never leave a dead end.

Search hits Google Books through the server — the API key stays server-side and we can normalise the messy response shape in one place.

## Method 2 — Enter manually

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

`source` is `'search' | 'manual'` and is required — it's cheap analytics and it proves in the demo that both paths work.

`circleId` comes from the client's active circle and is checked with `requireCircleMember`.

## After success

Close the modal → toast "Added to your shelf." → refetch the feed (a new `added` post is there) and, if the user is on their own profile, refetch the Want-to-read tab.

## No status control in this modal

There is no status picker in the Add-a-Book modal (nor on the book detail page's "Add to my shelf" button, nor in the AI chat's `add_book_to_list` tool). Every entry path creates the book as `want` and nothing else — `POST /api/user-books` doesn't even accept a `status` field in the body; the service function has no `status` parameter to pass one to.

Moving the book to `reading` or `finished` is a separate action, taken afterward from the profile's status pills (`features/book-status.md`) — the normal path, not a shortcut offered at add time. This closes the only remaining way to reach `finished` without completing the review interview.

## Rules that are easy to get wrong

- Every book starts as `want`, whatever the entry method.
- Duplicates are a friendly 409, never a 500.
- Books-API cover art stays as an external URL and is **not** re-hosted.

## Out of scope

Cover scanning · barcode/ISBN scanning · bulk import · Goodreads import · editing a book's catalog metadata after adding · removing a book from the shelf.
