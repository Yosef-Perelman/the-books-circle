# integrations/books-api.md

Google Books — metadata lookup for the search and scan flows. Load with `features/add-book.md`.

## What it's for

Turning a title (typed, or read off a cover by Gemini) into real metadata: author, genre, page count, cover art, ISBN. Two uses:

1. **Search flow** — user types a query, we show candidates.
2. **Scan flow** — Gemini gives us title + author, we look them up to fill in the rest.

Everything lives in `server/src/integrations/googleBooks.js`. The client never calls Google directly — the key stays server-side and the messy response shape gets normalised in exactly one place.

## Endpoint

```
GET https://www.googleapis.com/books/v1/volumes?q=<query>&maxResults=10&printType=books
    [&key=GOOGLE_BOOKS_API_KEY]
```

No auth required at a lower quota; `GOOGLE_BOOKS_API_KEY` is optional and just raises it. Use `fetch` — no SDK, no axios.

Query syntax worth knowing:

| Use | Query |
|---|---|
| Free search | `q=the hobbit` |
| Title + author (scan flow) | `q=intitle:"The Hobbit"+inauthor:"Tolkien"` |
| ISBN | `q=isbn:9780547928227` |

For the scan flow, try the qualified `intitle`/`inauthor` query first; if it returns nothing, retry as a plain free-text query. Publishers list authors inconsistently and the strict query misses often.

## Normalisation

Google's `volumeInfo` is inconsistent — half the fields are missing on any given book. Every response goes through one mapper and **nothing downstream ever sees Google's shape**:

```js
function normalize(item) {
  const v = item.volumeInfo ?? {};
  return {
    title:     v.title ?? null,
    author:    v.authors?.[0] ?? null,              // first author only
    genre:     v.categories?.[0] ?? null,           // first category only
    pageCount: v.pageCount > 0 ? v.pageCount : null,
    coverUrl:  pickCover(v.imageLinks),
    isbn:      v.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier
            ?? v.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier
            ?? null,
  };
}

function pickCover(links) {
  const url = links?.thumbnail ?? links?.smallThumbnail ?? null;
  return url ? url.replace(/^http:/, 'https:') : null;   // Google returns http — it breaks on HTTPS pages
}
```

Gotchas baked into the above:

- **`http` cover URLs** get blocked as mixed content on a deployed HTTPS site. Always rewrite to `https:`.
- **Multiple authors** — take the first. Our schema has one `author` text column and "Tolkien, J.R.R. & Others" helps nobody.
- **Categories are noisy** — `"Fiction / Fantasy / Epic"` is a real value. Take the first segment before ` / ` so the genre leaderboard category stays meaningful.
- **`pageCount: 0`** appears often; treat it as null, not zero, or "Most Pages" gets polluted.
- **No results** is `{ totalItems: 0 }` with **no `items` key at all** — `data.items ?? []`, never `data.items.map`.

Drop results with no title. Cap at 10.

## Genre cleanup

```js
const genre = raw?.split('/')[0].trim() ?? null;   // "Fiction / Fantasy / Epic" → "Fiction"
```

Consider mapping to a short canonical list (Fiction, Non-fiction, Fantasy, Sci-Fi, Mystery, Thriller, Romance, History, Biography, Self-help, Poetry, Other) so the "Various Genres" leaderboard doesn't count `"Fiction"` and `"Juvenile Fiction"` as two different genres. Same list backs the manual form's genre `Select` (`features/add-book.md`).

## Failure handling

| Case | Behaviour |
|---|---|
| Network error / timeout (8s) | Search: `502` "Book search is unavailable right now. You can enter the book manually." Scan: **continue** with Gemini's title/author only |
| 429 | `429 RATE_LIMITED` "Too many searches. Please wait a moment." |
| Zero results, search flow | `200` with `results: []` — the client shows "No matches" plus a manual-entry link. Not an error. |
| Zero results, scan flow | Return the candidate with just title/author from Gemini; client pre-fills the manual form |

**The scan flow must never fail because Google Books failed.** Gemini already gave us a title and author — that's enough to add a book. Missing metadata is a degraded result, not an error.

## Caching

None. A 5-day build doesn't need it, and the `books` table already acts as a de-facto cache: once anyone adds a title, it's resolved from our own DB by ISBN or title+author for every future user (`database.md` → deduplication).

Do debounce the search input 400ms client-side and require ≥2 characters, which removes most of the traffic.

## What we store vs. link

| Field | Treatment |
|---|---|
| title, author, genre, pageCount, isbn | Copied into our `books` row |
| coverUrl | **Stored as an external URL.** Not re-hosted. |
| user's scan photo | Uploaded to **Supabase Storage** (`integrations/storage.md`) |

The course's external-media-storage requirement is satisfied by the scan uploads. Re-hosting publisher cover art would be needless work and a licensing question nobody asked for.

## Out of scope

Open Library fallback · book descriptions/blurbs · series info · publication dates · multiple editions · author pages · ratings from Google.
