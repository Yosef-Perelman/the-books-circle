# features/book-status.md

The three-status model, the confirmation dialog, and the ownership rule. Small feature, two of the project's graded business rules. Load with `api-contract.md`.

## The three statuses

`want` → **Want to read** · `reading` → **Reading** · `finished` → **Finished**

Rendered as three pills. Clicking a different pill changes the status. Any transition is legal in any direction — a user can move a book back to Want to read.

## Business rule 1 — confirm before Reading

**Moving a book to `reading` requires an "Are you sure?" confirmation dialog before it is applied.**

Moving to `want` (including on add) and moving to `finished` do **not** require it.

```
user clicks "Reading"
  → ConfirmReadingDialog opens
      "Start reading The Hobbit?"
      "We'll let your circle know you've started."
      [Cancel] [Yes, start reading]
  → Cancel  → nothing happens, pills stay as they were
  → Confirm → PATCH /api/user-books/:id { status: 'reading' }
```

The pills must not update optimistically here — the whole point is that nothing changes until the user confirms. Only after the server responds does the pill flip.

This is a **client-side UX gate**. The server does not require a confirmation flag. But the server is still defensive about the transition itself (validated enum, ownership check).

## Business rule 2 — pills are editable only on your own profile

**Status pills are interactive only when viewing your own profile.** On another member's profile their books are visible but read-only.

`StatusPills` takes one prop that encodes the whole rule:

```jsx
<StatusPills value={userBook.status} onChange={handleChange} readOnly={!isOwnProfile} />
```

`readOnly` behaviour (`design/ui-patterns.md`):

- Render **only the active pill**, not all three.
- `bg line`, `stale` text, no border, no hover, `cursor: default`, not focusable, no `onClick`.

`isOwnProfile` is derived from the route: `params.userId === authStore.user.id`. Never from a prop threaded down through five components.

**And the server enforces it independently.** Hiding pills is not authorization:

```js
// userBook.service.updateStatus
const row = await userBookModel.findById(id);
if (!row) throw new ApiError(404, 'NOT_FOUND', 'Book not found.');
if (row.user_id !== userId) {
  throw new ApiError(403, 'FORBIDDEN', 'You can only change your own books.');
}
```

This check is a demo talking point — it's exactly the "Authentication & Authorization" requirement. Be ready to show it working with a hand-crafted request.

## Transition side effects

| To | Side effects |
|---|---|
| `want` | clear `started_at` and `finished_at` |
| `reading` | set `started_at = now()` **if null** (don't overwrite on re-entry); create a `started` feed post |
| `finished` | set `finished_at = now()`; create a `finished` feed post — **only via the review endpoint** |

`updated_at` is set on every write by the service.

### `finished` is not reachable via PATCH

`PATCH /api/user-books/:id { status: 'finished' }` returns **400 `BAD_REQUEST`**: "Finishing a book requires completing the review interview."

The only path to `finished` is `POST /api/user-books/:id/review`, which writes the review, flips the status, and creates the post together (`features/ai-interview.md`). The interview is mandatory — it's the app's differentiator, so the data model refuses to let it be skipped.

On the client, clicking the **Finished** pill therefore does not call PATCH. It opens `InterviewModal`. If the user cancels the interview, the status does not change.

### Re-entering the same status

A no-op. Return `200` with the unchanged row. Do not create a duplicate feed post, do not error.

## Where pills appear

| Location | Interactive? |
|---|---|
| Own profile, book row | Yes |
| Another member's profile | No — read-only, single pill |
| Add-a-Book confirm card | Yes (`Want to read` preselected) |
| Feed posts | Not rendered at all |

## Client flow

```
StatusPills.onChange(next)
  ├─ next === 'reading'   → open ConfirmReadingDialog → confirm → patch()
  ├─ next === 'finished'  → open InterviewModal (no patch)
  └─ next === 'want'      → patch() immediately
```

`patch()`: disable the pills while in flight, await, replace the row in local state on success, toast on failure. No optimistic update for status — the transition has real side effects (a public feed post) and a silent revert would be confusing.

## Server — `PATCH /api/user-books/:id`

```
requireAuth
  → validate({ status: z.enum(['want','reading']) })   // 'finished' rejected by the schema itself
  → service: fetch row → 404 if missing → 403 if not yours
           → no-op if unchanged
           → apply timestamps, update
           → if newly 'reading': create 'started' post in each of the user's circles
  → 200 { userBook }
```

Putting `finished` outside the enum means Zod produces the rejection and the error message lives in one place.

## Rules that are easy to get wrong

- Confirmation is for `reading` only — not for `want`, not for `finished`.
- Nothing changes on screen until the confirmation is accepted.
- Read-only mode renders one pill, not three greyed ones.
- The ownership check lives in the service, not the controller, and not only on the client.
- `started_at` is never overwritten once set.
- A no-op transition is a 200, not a 409.

## Out of scope

Reading progress (page numbers, percentages) · DNF/abandoned status · re-reads (the `unique (user_id, book_id)` constraint means one row per user per book) · removing a book from the shelf · status change history.
