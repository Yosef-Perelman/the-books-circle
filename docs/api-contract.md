# api-contract.md

The complete REST contract. **Do not invent routes.** If you need a new one, add it here first.

Load with the relevant feature doc whenever you touch the server.

## Conventions

- Base: `/api`. Server runs on `PORT` (default 4000). Client uses `VITE_API_URL`.
- All routes require `Authorization: Bearer <jwt>` **except** `POST /api/auth/register` and `POST /api/auth/login`.
- Request and response bodies are `camelCase` JSON. The DB's `snake_case` never crosses the wire.
- Success: `{ "data": ... }`. Lists: `{ "data": [...] }`.
- Error: always the shape below, produced by `errorHandler.js` and nothing else.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable, safe to show the user.",
    "details": { "pageCount": "must be a positive number" }
  }
}
```

`details` is optional and is only populated for validation errors (field → message).

## Error codes

| HTTP | code | When |
|---|---|---|
| 400 | `BAD_REQUEST` | Malformed request or illegal state transition |
| 401 | `UNAUTHENTICATED` | Missing / expired / invalid JWT |
| 403 | `FORBIDDEN` | Authenticated but not allowed (not your row, not in that circle) |
| 404 | `NOT_FOUND` | Resource doesn't exist, or exists but you can't see it |
| 409 | `CONFLICT` | Email taken, book already on your shelf, already in circle |
| 422 | `VALIDATION_ERROR` | Zod rejected the payload; `details` populated |
| 429 | `RATE_LIMITED` | Upstream AI / Books API throttled us |
| 500 | `INTERNAL` | Anything unhandled. Never leak a stack trace or upstream error text. |

Rule: prefer 404 over 403 when revealing existence would leak information (e.g. another circle's feed).

---

## Auth — `features/auth.md`

### `POST /api/auth/register`
```jsonc
// body
{ "displayName": "Yosef", "email": "y@x.com", "password": "hunter22", "confirmPassword": "hunter22" }
// 201
{ "data": { "token": "eyJ...", "user": { "id": "...", "displayName": "Yosef", "email": "y@x.com", "avatarUrl": null } } }
```
409 `CONFLICT` if email exists. 422 if passwords mismatch or password < 8 chars.

### `POST /api/auth/login`
```jsonc
{ "email": "y@x.com", "password": "hunter22" }
// 200 → same shape as register
```
401 `UNAUTHENTICATED` with message `"Email or password is incorrect."` for both wrong-email and wrong-password. Never distinguish.

### `GET /api/auth/me`
```jsonc
// 200
{ "data": { "user": {...}, "circles": [ { "id": "...", "name": "Friends 1", "inviteCode": "F1-8KZQ", "memberCount": 5 } ] } }
```
Called once on app boot to rehydrate. Returning circles here saves a round trip.

---

## Circles — `features/circles.md`

### `POST /api/circles`
```jsonc
{ "name": "Friends 1" }            // 1–50 chars
// 201 { "data": { "circle": { id, name, inviteCode, memberCount: 1 } } }
```
Creator is auto-added to `circle_members`.

### `POST /api/circles/join`
```jsonc
{ "inviteCode": "F1-8KZQ" }        // case-insensitive, dashes optional
// 200 { "data": { "circle": {...} } }
```
404 if no such code. 409 `CONFLICT` message `"You're already in this circle."`

### `GET /api/circles/:id`
```jsonc
// 200
{ "data": { "circle": { id, name, inviteCode, memberCount,
    "members": [ { "id": "...", "displayName": "Ben", "avatarUrl": null } ] } } }
```
403 if requester is not a member.

### `GET /api/circles/:id/feed`
See `features/feed.md` for the post object.
```jsonc
// 200 { "data": { "posts": [ Post, ... ] } }   // max 50, newest first
```

### `GET /api/circles/:id/leaderboard?period=month|all`
Returns **all four categories in one call** — the page shows all four at once, don't make it four requests.
```jsonc
{ "data": { "period": "month",
  "categories": {
    "books":   [ { "rank":1, "user": {...}, "value": 7 }, ... ],
    "genres":  [ ... ],
    "pages":   [ ... ],
    "streak":  [ ... ] } } }
```
Each array holds every member, ordered, with ties sharing a rank. The client renders the top 3 and a "···" row.

---

## Books & shelf — `features/add-book.md`, `features/book-status.md`

### `GET /api/books/search?q=<string>&limit=10`
Proxy to Google Books. Returns **candidates**, nothing is saved.
```jsonc
{ "data": { "results": [ { "title","author","genre","pageCount","coverUrl","isbn" } ] } }
```

### `POST /api/books/scan`
`multipart/form-data`, field `image`, ≤5MB, `image/*` only.
```jsonc
// 200
{ "data": { "candidate": { "title","author","genre","pageCount","coverUrl","isbn" },
            "scanUrl": "https://.../book-scans/uuid.jpg",
            "confidence": "high" | "low" } }
```
`confidence: "low"` → client shows an editable form pre-filled with what Gemini read instead of a one-tap confirm. 422 if no text could be read.

### `POST /api/user-books`
Adds to the caller's shelf. Always lands as `status: 'want'` and emits an `added` feed post.
```jsonc
{ "book": { "title": "Dune", "author": "Frank Herbert", "genre": "Sci-Fi",
            "pageCount": 412, "coverUrl": "https://...", "isbn": "9780441013593" },
  "source": "scan" | "search" | "manual",
  "circleId": "..." }
// 201 { "data": { "userBook": UserBook } }
```
`title` and `source` required; everything else optional but `pageCount` must be a positive int if present. 409 if this user already has this book.

### `PATCH /api/user-books/:id`
```jsonc
{ "status": "want" | "reading" }
// 200 { "data": { "userBook": UserBook } }
```
- 403 if the row isn't yours — **check ownership server-side**, never trust the client hiding pills.
- 400 if `status: 'finished'` — that transition only happens via the review endpoint.
- The "are you sure?" dialog for `reading` is a client-side UX gate; the server does not care.

### `GET /api/users/:id/books?status=want|reading|finished`
Any circle-mate's shelf is readable. Response is identical whether it's your own or not — the client decides whether pills are interactive.
```jsonc
{ "data": { "user": { id, displayName, avatarUrl }, "books": [ UserBook ] } }
```
403 if you share no circle with `:id`.

---

## Review / interview — `features/ai-interview.md`

### `GET /api/user-books/:id/interview/questions`
```jsonc
// 200 { "data": { "questions": ["What stuck with you most?", "Who would you recommend it to?"] } }
```
2–3 questions, generated from title+author+genre. Falls back to a static list if Gemini fails — never block the user. 403 if not your row.

### `POST /api/user-books/:id/review`
The one transactional endpoint. Generates the article, saves the review, flips the status, posts to the feed.
```jsonc
{ "rating": 4.5,
  "qa": [ { "q": "...", "a": "..." }, { "q": "...", "a": "..." } ],
  "circleId": "..." }
// 201
{ "data": { "review": { id, rating, articleText, createdAt },
            "userBook": UserBook,
            "post": Post } }
```
`qa` must have ≥1 pair with a non-empty answer. 409 if a review already exists for this `userBook`.

---

## Social — `features/feed.md`

### `POST /api/posts/:id/like` → `200 { "data": { "likeCount": 8, "likedByMe": true } }`
### `DELETE /api/posts/:id/like` → `200 { "data": { "likeCount": 7, "likedByMe": false } }`
Both idempotent. 403 if the post's circle isn't one of yours.

### `GET /api/posts/:id/comments`
```jsonc
{ "data": { "comments": [ { id, content, createdAt, user: { id, displayName, avatarUrl } } ] } }
```

### `POST /api/posts/:id/comments`
```jsonc
{ "content": "Loved this one too" }     // 1–1000 chars, trimmed
// 201 { "data": { "comment": Comment } }
```

---

## Shared object shapes

```jsonc
UserBook {
  "id": "...", "status": "want",
  "source": "scan", "startedAt": null, "finishedAt": null,
  "book": { "id","title","author","genre","pageCount","coverUrl","isbn" },
  "review": null | { "rating": 4.5, "articleText": "..." }
}

Post {
  "id": "...", "type": "finished", "createdAt": "2026-08-10T...",
  "user": { "id","displayName","avatarUrl" },
  "userBook": UserBook,
  "likeCount": 7, "likedByMe": false, "commentCount": 3
}
```

## Server-side authorization checklist

Every route that takes an id must answer one of these before doing anything:

- **Is this my row?** → `user_books`, `reviews` (via `user_book_id`)
- **Am I in this circle?** → circle feed, leaderboard, circle detail, posting/liking/commenting
- **Do I share a circle with this user?** → viewing someone's shelf

Put the circle check in `requireCircleMember` middleware. Put ownership checks in the service, because they need the row.
